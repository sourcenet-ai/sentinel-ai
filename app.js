
import { GoogleGenAI, Type } from "@google/genai";

// --- Configuration & State ---
const API_KEY = ""; // Injected by environment
const ai = new GoogleGenAI({ apiKey: API_KEY });

const FEED_SOURCES = [
    { name: 'Heise Security', url: 'https://www.heise.de/security/Alerts/feed.xml', format: 'atom', category: 'intel' },
    { name: 'CERT-EU', url: 'https://cert.europa.eu/publications/security-advisories-rss', format: 'rss', category: 'intel' },
    { name: 'CISA ICS', url: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', format: 'atom', category: 'intel' },
    { name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed_full.xml', format: 'rss', category: 'intel' },
    { name: 'NCSC Switzerland', url: 'https://www.ncsc.admin.ch/ncsc/en/home/dokumentation/berichte/lageberichte.html', format: 'html-ncsc', category: 'news' }
];

let state = {
    advisories: [],
    errors: [],
    activeTab: 'intel',
    isLoading: true,
    isAIAnalysisLoading: false,
    analysis: null,
    selectedAdvisory: null,
    filters: {
        keyword: '',
        source: 'All'
    }
};

// --- Core Logic ---

async function fetchFeed(source) {
    try {
        const proxyUrl = `api.php?url=${encodeURIComponent(source.url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(content, 'text/xml');
        
        if (source.format === 'atom') {
            return parseAtom(xml, source);
        } else if (source.format === 'rss') {
            return parseRSS(xml, source);
        }
        return [];
    } catch (e) {
        state.errors.push({ source: source.name, message: e.message });
        return [];
    }
}

function parseAtom(xml, source) {
    const entries = Array.from(xml.querySelectorAll('entry'));
    return entries.map(entry => ({
        id: entry.querySelector('id')?.textContent || Math.random().toString(),
        title: entry.querySelector('title')?.textContent || 'Untitled',
        link: entry.querySelector('link')?.getAttribute('href') || '#',
        summary: entry.querySelector('summary')?.textContent || entry.querySelector('content')?.textContent || '',
        published: new Date(entry.querySelector('published')?.textContent || entry.querySelector('updated')?.textContent || Date.now()),
        source: source.name,
        category: source.category
    }));
}

function parseRSS(xml, source) {
    const items = Array.from(xml.querySelectorAll('item'));
    return items.map(item => ({
        id: item.querySelector('guid')?.textContent || item.querySelector('link')?.textContent || Math.random().toString(),
        title: item.querySelector('title')?.textContent || 'Untitled',
        link: item.querySelector('link')?.textContent || '#',
        summary: item.querySelector('description')?.textContent || '',
        published: new Date(item.querySelector('pubDate')?.textContent || Date.now()),
        source: source.name,
        category: source.category
    }));
}

async function runAIAnalysis(advisories) {
    if (advisories.length === 0) return;
    state.isAIAnalysisLoading = true;
    render();

    try {
        const summaryText = advisories.slice(0, 5).map(a => `${a.source}: ${a.title}`).join('\n');
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze these security threats and provide a JSON summary:\n${summaryText}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                        topRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        state.analysis = JSON.parse(response.text);
    } catch (e) {
        console.error("AI Error:", e);
    } finally {
        state.isAIAnalysisLoading = false;
        render();
    }
}

async function init() {
    render();
    const results = await Promise.all(FEED_SOURCES.map(s => fetchFeed(s)));
    state.advisories = results.flat().sort((a, b) => b.published - a.published);
    state.isLoading = false;
    render();

    const intel = state.advisories.filter(a => a.category === 'intel');
    if (intel.length > 0) runAIAnalysis(intel);
}

// --- Rendering Engine ---

function render() {
    const root = document.getElementById('app');
    
    // Header & Layout Shell
    root.innerHTML = `
        <header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 px-6 py-4 mb-4">
            <div class="max-w-7xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622l-.382-3.016z"/></svg>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white tracking-tight">Threat<span class="text-orange-500">Sentinel</span></h1>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Intelligence Center</p>
                    </div>
                </div>
                <button id="refresh-btn" class="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <svg class="w-5 h-5 ${state.isLoading ? 'animate-spin text-orange-400' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-6">
            ${renderBriefing()}
            ${renderFilters()}
            ${state.isLoading ? renderLoader() : renderTable()}
        </main>

        ${renderModal()}
    `;

    // Event Listeners
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        state.isLoading = true;
        init();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeTab = btn.dataset.tab;
            render();
        });
    });

    document.getElementById('search-input')?.addEventListener('input', (e) => {
        state.filters.keyword = e.target.value;
        render();
    });

    document.querySelectorAll('.advisory-row').forEach(row => {
        row.addEventListener('click', () => {
            state.selectedAdvisory = state.advisories.find(a => a.id === row.dataset.id);
            render();
        });
    });

    document.getElementById('close-modal')?.addEventListener('click', () => {
        state.selectedAdvisory = null;
        render();
    });
}

function renderBriefing() {
    if (!state.analysis && !state.isAIAnalysisLoading) return '';
    
    if (state.isAIAnalysisLoading) {
        return `<div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 animate-pulse"><div class="h-4 bg-slate-800 w-1/4 rounded mb-4"></div><div class="h-3 bg-slate-800 rounded w-full"></div></div>`;
    }

    const riskColors = {
        Low: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
        Medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
        High: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
        Critical: 'text-red-400 border-red-400/20 bg-red-400/5',
    };

    return `
        <div class="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 mb-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold flex items-center gap-2">
                    <span class="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                    AI Threat Briefing
                </h2>
                <span class="px-2 py-1 rounded-full text-[10px] font-bold border ${riskColors[state.analysis.riskLevel]}">
                    ${state.analysis.riskLevel.toUpperCase()} RISK
                </span>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed mb-4">${state.analysis.summary}</p>
            <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <p class="text-[10px] font-bold text-slate-500 uppercase mb-2">Priority Recommendations</p>
                    <ul class="text-xs text-slate-300 space-y-1">
                        ${state.analysis.topRecommendations.map(r => `<li>• ${r}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function renderFilters() {
    const sources = Array.from(new Set(state.advisories.map(a => a.source)));
    return `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-xl">
            <div class="grid md:grid-cols-3 gap-4">
                <input id="search-input" type="text" placeholder="Filter by product, CVE, or keyword..." 
                       class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                       value="${state.filters.keyword}">
                <div class="flex gap-2 border-l border-slate-800 pl-4 no-scrollbar overflow-x-auto">
                    ${['intel', 'news'].map(tab => `
                        <button class="tab-btn px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors 
                                ${state.activeTab === tab ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-800'}" 
                                data-tab="${tab}">${tab}</button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderTable() {
    const filtered = state.advisories
        .filter(a => a.category === state.activeTab)
        .filter(a => a.title.toLowerCase().includes(state.filters.keyword.toLowerCase()) || 
                     a.summary.toLowerCase().includes(state.filters.keyword.toLowerCase()));

    return `
        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <tr>
                            <th class="px-6 py-4">Date</th>
                            <th class="px-6 py-4">Intelligence Subject</th>
                            <th class="px-6 py-4">Source</th>
                            <th class="px-6 py-4 text-right">Access</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800 text-sm">
                        ${filtered.length ? filtered.map(a => `
                            <tr class="advisory-row hover:bg-slate-800/30 transition-colors cursor-pointer group" data-id="${a.id}">
                                <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${a.published.toLocaleDateString()}</td>
                                <td class="px-6 py-4 font-medium text-slate-200 group-hover:text-orange-400 transition-colors">${a.title}</td>
                                <td class="px-6 py-4"><span class="px-2 py-0.5 bg-slate-800 text-[10px] rounded text-slate-400">${a.source}</span></td>
                                <td class="px-6 py-4 text-right">
                                    <button class="text-orange-500 hover:text-orange-400 font-bold uppercase text-[10px]">Details</button>
                                </td>
                            </tr>
                        `).join('') : `<tr><td colspan="4" class="py-10 text-center text-slate-500 italic">No matching intelligence found.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderModal() {
    if (!state.selectedAdvisory) return '';
    const a = state.selectedAdvisory;
    return `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div class="p-6 border-b border-slate-800 flex justify-between items-start">
                    <div>
                        <span class="text-[10px] font-bold text-orange-500 uppercase mb-1 block">${a.source} Intelligence</span>
                        <h3 class="text-xl font-bold text-white">${a.title}</h3>
                        <p class="text-xs text-slate-500 mt-1">${a.published.toLocaleString()}</p>
                    </div>
                    <button id="close-modal" class="text-slate-500 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto text-slate-300 text-sm leading-relaxed">
                    <p class="mb-6">${a.summary}</p>
                    <a href="${a.link}" target="_blank" class="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-colors">
                        View Official Bulletin
                    </a>
                </div>
            </div>
        </div>
    `;
}

function renderLoader() {
    return `<div class="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
        <div class="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-bold uppercase tracking-widest">Scanning Global Feeds...</p>
    </div>`;
}

// Start the app
init();
