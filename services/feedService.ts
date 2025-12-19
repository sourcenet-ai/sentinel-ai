
import { Advisory, FetchError } from '../types';

/**
 * Proxies used to bypass CORS for standard feeds.
 */
const PROXY_URLS = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/'
];

const RANSOMWARE_API_TOKEN = 'f89d184d-143e-4525-a4f8-c15bf307fc28';

interface SourceConfig {
  name: string;
  url: string;
  format: 'atom' | 'rss' | 'html-ncsc' | 'ransomware';
  category: 'intel' | 'news' | 'breaches' | 'ransomware';
}

const FEED_SOURCES: SourceConfig[] = [
  // Threat Intelligence
  { name: 'Heise Security', url: 'https://www.heise.de/security/Alerts/feed.xml', format: 'atom', category: 'intel' },
  { name: 'CERT-EU', url: 'https://cert.europa.eu/publications/security-advisories-rss', format: 'rss', category: 'intel' },
  { name: 'CIS Security', url: 'https://www.cisecurity.org/feed/advisories', format: 'rss', category: 'intel' },
  { name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed_full.xml', format: 'rss', category: 'intel' },
  { name: 'CISA ICS', url: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', format: 'atom', category: 'intel' },
  
  // Intelligence Briefings
  { name: 'CERT-EU Briefings', url: 'https://cert.europa.eu/publications/threat-intelligence-rss', format: 'rss', category: 'news' },
  { name: 'NCSC Switzerland', url: 'https://www.ncsc.admin.ch/ncsc/en/home/dokumentation/berichte/lageberichte.html', format: 'html-ncsc', category: 'news' },
  
  // Data Breaches
  { name: 'Have I Been Pwned', url: 'https://feeds.feedburner.com/HaveIBeenPwned', format: 'rss', category: 'breaches' },
  { name: 'Data Breach Today', url: 'https://www.databreachtoday.com/rss', format: 'rss', category: 'breaches' },
  { name: 'Security Affairs', url: 'https://securityaffairs.co/wordpress/category/data-breach/feed', format: 'rss', category: 'breaches' },

  // Ransomware Victims - Pro API endpoint (Direct fetch only)
  { name: 'Ransomware.live', url: 'https://api-pro.ransomware.live/victims/recent?order=discovered', format: 'ransomware', category: 'ransomware' }
];

async function fetchWithRetry(
  url: string, 
  headers: Record<string, string> = {}, 
  skipCacheBuster = false,
  directOnly = false
): Promise<string> {
  let finalUrl = url;
  if (!skipCacheBuster) {
    const cacheBuster = `_cb=${Math.floor(Date.now() / 60000)}`; 
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}${cacheBuster}`;
  }

  // Attempt direct fetch
  try {
    const response = await fetch(finalUrl, { 
      // We minimize headers here to avoid triggering CORS preflight (OPTIONS)
      headers: headers
    });
    
    if (response.ok) return await response.text();
    
    const errorBody = await response.text().catch(() => "No error body available");
    const statusError = `HTTP ${response.status} ${response.statusText}. Response: ${errorBody.substring(0, 500)}`;
    if (directOnly) throw new Error(statusError);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
      // Browsers hide the specific reason (CORS vs DNS) for security, but we can provide a strong hint.
      const corsHint = " [CORS/Network Block]: The browser blocked this direct request. This usually happens because the API server does not send the 'Access-Control-Allow-Origin' header to permit your domain. Direct browser-to-API calls are often restricted by the provider.";
      if (directOnly) throw new Error(`${msg}${corsHint}`);
    } else {
      if (directOnly) throw e;
    }
  }

  // Fallback to proxies for standard sources
  let lastErrorDetails = "Direct fetch failed.";
  for (const proxy of PROXY_URLS) {
    try {
      const targetUrl = proxy.includes('?') ? `${proxy}${encodeURIComponent(finalUrl)}` : `${proxy}${finalUrl}`;
      const response = await fetch(targetUrl, { 
        headers: {
          'Accept': 'application/json, text/html, application/xml, */*',
          ...headers
        }
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Proxy ${proxy} returned ${response.status}: ${body.substring(0, 100)}`);
      }
      
      const text = await response.text();
      if (!text || text.length < 5) throw new Error('Empty response');
      return text;
    } catch (e) {
      lastErrorDetails += ` | ${proxy}: ${(e as Error).message}`;
      continue;
    }
  }
  
  throw new Error(lastErrorDetails);
}

export async function fetchAllAdvisories(): Promise<{ advisories: Advisory[], errors: FetchError[] }> {
  const errors: FetchError[] = [];
  
  const fetchPromises = FEED_SOURCES.map(async (source) => {
    try {
      const headers: Record<string, string> = {};
      let skipCB = false;
      let directOnly = false;
      let targetUrl = source.url;
      
      if (source.format === 'ransomware') {
        // Attempt to move API key to query string to avoid Preflight OPTIONS request
        // Most APIs support this as a 'simple' request fallback
        const keyParam = `key=${RANSOMWARE_API_TOKEN}`;
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + keyParam;
        
        skipCB = true;
        directOnly = true; 
      }

      const content = await fetchWithRetry(targetUrl, headers, skipCB, directOnly);
      
      if (source.format === 'ransomware') {
        return parseRansomware(content);
      }
      
      if (source.format === 'html-ncsc') {
        return parseNCSC(content, source.category);
      }

      const cleanedXml = content.trim().replace(/^[^<]*/, '');
      const parser = new DOMParser();
      let xmlDoc = parser.parseFromString(cleanedXml, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        xmlDoc = parser.parseFromString(cleanedXml, 'text/html');
      }

      let advisories: Advisory[] = [];
      const hasEntry = xmlDoc.getElementsByTagName('entry').length > 0 || xmlDoc.getElementsByTagName('ENTRY').length > 0;
      const hasItem = xmlDoc.getElementsByTagName('item').length > 0 || xmlDoc.getElementsByTagName('ITEM').length > 0;

      if (hasEntry && (!hasItem || source.format === 'atom')) {
        advisories = parseAtom(xmlDoc, source.name, source.category);
      } else if (hasItem) {
        advisories = parseRSS(xmlDoc, source.name, source.category);
      }

      return advisories;
    } catch (error) {
      console.error(`Error syncing ${source.name}:`, error);
      errors.push({ source: source.name, message: (error as Error).message });
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  const flattened = results.flat();
  
  const seenIds = new Set();
  const unique = flattened.filter(a => {
    const key = `${a.source}-${a.id || a.title}-${a.published.getTime()}`;
    if (seenIds.has(key)) return false;
    seenIds.add(key);
    return true;
  });

  return { 
    advisories: unique.sort((a, b) => b.published.getTime() - a.published.getTime()), 
    errors 
  };
}

function parseRansomware(jsonText: string): Advisory[] {
  try {
    const data = JSON.parse(jsonText);
    const victims = Array.isArray(data) ? data : (data.victims || []);
    
    return victims.map((v: any) => ({
      id: v.id || `${v.group_name}-${v.post_title}-${v.published || v.date}`,
      title: v.post_title || v.victim_name || 'Unknown Victim',
      link: v.website || v.infostealer_url || 'https://ransomware.live',
      summary: `Group: ${v.group_name || 'N/A'}. Sector: ${v.sector || 'N/A'}. Country: ${v.country || 'N/A'}.`,
      content: v.description || `Incident reported on ${v.published || v.date}. Retrieved via Direct Pro Intelligence monitoring.`,
      published: v.published ? new Date(v.published) : (v.date ? new Date(v.date) : new Date()),
      updated: new Date(),
      source: v.group_name || 'Ransomware Group',
      author: 'Ransomware.live',
      category: 'ransomware'
    }));
  } catch (e) {
    throw new Error(`Parse Failed: ${(e as Error).message}. Snippet: ${jsonText.substring(0, 200)}`);
  }
}

function parseNCSC(html: string, category: Advisory['category']): Advisory[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const baseUrl = 'https://www.ncsc.admin.ch';
  const sourceName = 'NCSC Switzerland';
  
  const links = Array.from(doc.querySelectorAll('a'));
  const reportLinks = links.filter(link => {
    const text = link.textContent?.trim() || '';
    return /Semi-annual report \d{4}\/\d/i.test(text);
  });

  return reportLinks.map((link) => {
    const title = link.textContent?.trim() || 'NCSC Semi-annual report';
    let href = link.getAttribute('href') || '#';
    if (href.startsWith('/')) href = baseUrl + href;

    let pubDate = new Date();
    const parent = link.closest('.ns-list-item, li, div');
    if (parent) {
      const dateEl = parent.querySelector('.date, time, .ns-date');
      if (dateEl && dateEl.textContent) {
        const parsedDate = new Date(dateEl.textContent.trim());
        if (!isNaN(parsedDate.getTime())) pubDate = parsedDate;
      } else {
        const match = title.match(/(\d{4})\/(\d)/);
        if (match) {
          const year = parseInt(match[1]);
          const half = match[2];
          pubDate = half === '1' ? new Date(year, 9, 1) : new Date(year + 1, 3, 1);
        }
      }
    }

    return {
      id: `ncsc-report-${title.replace(/\s+/g, '-').toLowerCase()}`,
      title,
      link: href,
      summary: `NCSC Switzerland Semi-Annual Report covering situational awareness and key threats.`,
      content: `Official situational report from the National Cyber Security Centre (NCSC) of Switzerland.`,
      published: pubDate,
      updated: new Date(),
      source: sourceName,
      author: 'NCSC Switzerland',
      category
    };
  });
}

function findElement(parent: Element | Document, tagName: string): Element | null {
  let el = parent.getElementsByTagName(tagName)[0];
  if (!el) el = parent.getElementsByTagName(tagName.toUpperCase())[0];
  if (!el) el = parent.getElementsByTagName(tagName.toLowerCase())[0];
  if (el) return el;
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const node = all[i];
    const localName = node.localName || node.tagName.split(':').pop();
    if (localName?.toLowerCase() === tagName.toLowerCase()) return node;
  }
  return null;
}

function getSafeText(parent: Element | Document, tagName: string): string {
  const el = findElement(parent, tagName);
  return el ? el.textContent || '' : '';
}

function parseAtom(xmlDoc: Document, sourceName: string, category: Advisory['category']): Advisory[] {
  let entries = Array.from(xmlDoc.getElementsByTagName('entry'));
  if (entries.length === 0) entries = Array.from(xmlDoc.getElementsByTagName('ENTRY'));
  
  return entries.map(entry => {
    const title = getSafeText(entry, 'title');
    const id = getSafeText(entry, 'id') || Math.random().toString();
    const linkEl = findElement(entry, 'link');
    const link = linkEl ? (linkEl.getAttribute('href') || linkEl.textContent || '#') : '#';
    const summary = getSafeText(entry, 'summary') || getSafeText(entry, 'description') || '';
    const content = getSafeText(entry, 'content') || '';
    const publishedStr = getSafeText(entry, 'published') || getSafeText(entry, 'updated') || getSafeText(entry, 'date');
    const authorEl = findElement(entry, 'author');
    const author = authorEl ? getSafeText(authorEl, 'name') : sourceName;

    let pubDate = new Date();
    if (publishedStr) {
      const parsed = new Date(publishedStr);
      if (!isNaN(parsed.getTime())) pubDate = parsed;
    }

    return {
      id,
      title: title.trim(),
      link: link.startsWith('/') ? new URL(link, 'https://www.cisa.gov').href : link,
      summary: summary.trim(),
      content: content.trim(),
      published: pubDate,
      updated: new Date(),
      source: sourceName,
      author: author || sourceName,
      category
    };
  });
}

function parseRSS(xmlDoc: Document, sourceName: string, category: Advisory['category']): Advisory[] {
  let items = Array.from(xmlDoc.getElementsByTagName('item'));
  if (items.length === 0) items = Array.from(xmlDoc.getElementsByTagName('ITEM'));

  return items.map(item => {
    const title = getSafeText(item, 'title');
    const guidEl = findElement(item, 'guid');
    const id = guidEl?.textContent || getSafeText(item, 'id') || getSafeText(item, 'link') || Math.random().toString();
    const link = getSafeText(item, 'link') || guidEl?.textContent || '#';
    const description = getSafeText(item, 'description') || getSafeText(item, 'summary');
    const content = getSafeText(item, 'encoded') || getSafeText(item, 'content') || description;
    const pubDateStr = getSafeText(item, 'pubDate') || getSafeText(item, 'date') || getSafeText(item, 'published');
    const author = getSafeText(item, 'creator') || getSafeText(item, 'author') || sourceName;

    let pubDate = new Date();
    if (pubDateStr) {
      let parsed = new Date(pubDateStr);
      if (isNaN(parsed.getTime())) {
        const cleaned = pubDateStr.replace(/CET/g, '+0100').replace(/CEST/g, '+0200');
        parsed = new Date(cleaned);
      }
      if (!isNaN(parsed.getTime())) pubDate = parsed;
    }

    return {
      id,
      title: title.trim(),
      link,
      summary: description.trim(),
      content: content.trim(),
      published: pubDate,
      updated: new Date(),
      source: sourceName,
      author: author || sourceName,
      category
    };
  });
}
