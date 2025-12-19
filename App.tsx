
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAllAdvisories } from './services/feedService';
import { analyzeThreatLandscape } from './services/geminiService';
import { Advisory, FilterState, AIAnalysis, AlertProfile, FetchError } from './types';
import AdvisoryTable from './components/AdvisoryTable';
import AdvisoryModal from './components/AdvisoryModal';
import ThreatBriefing from './components/ThreatBriefing';
import SubscriptionModal from './components/SubscriptionModal';
import Logo from './components/Logo';

type TabType = 'intel' | 'news' | 'breaches' | 'ransomware';

const App: React.FC = () => {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [fetchErrors, setFetchErrors] = useState<FetchError[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('intel');
  const [isLoading, setIsLoading] = useState(true);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [alertProfiles, setAlertProfiles] = useState<AlertProfile[]>(() => {
    const saved = localStorage.getItem('threat_sentinel_profiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastCheckedId, setLastCheckedId] = useState<string>(() => {
    return localStorage.getItem('threat_sentinel_last_id') || '';
  });

  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    source: 'All',
    startDate: '',
    endDate: ''
  });

  const sources = useMemo(() => {
    const s = new Set<string>();
    s.add('All');
    advisories.filter(a => a.category === activeTab).forEach(a => s.add(a.source));
    return Array.from(s).sort();
  }, [advisories, activeTab]);

  const checkNotifications = useCallback((newAdvisories: Advisory[]) => {
    if (newAdvisories.length === 0) return;

    const lastIdIndex = lastCheckedId ? newAdvisories.findIndex(a => a.id === lastCheckedId) : newAdvisories.length;
    const itemsToCheck = lastIdIndex === -1 ? newAdvisories : newAdvisories.slice(0, lastIdIndex);

    if (itemsToCheck.length > 0) {
      alertProfiles.forEach(profile => {
        const matches = itemsToCheck.filter(a => {
          const matchesKeyword = !profile.keywords || profile.keywords.length === 0 || 
            profile.keywords.some(kw => 
              kw.trim() !== '' && (
                a.title.toLowerCase().includes(kw.toLowerCase()) || 
                a.summary.toLowerCase().includes(kw.toLowerCase())
              )
            );
          const matchesSource = profile.source === 'All' || a.source === profile.source;
          return matchesKeyword && matchesSource;
        });

        if (matches.length > 0) {
          if (Notification.permission === 'granted') {
            new Notification('Threat Alert: Matching Products Detected', {
              body: `${matches[0].title}${matches.length > 1 ? ` and ${matches.length - 1} more...` : ''}`,
            });
          }
        }
      });

      const newLastId = newAdvisories[0].id;
      setLastCheckedId(newLastId);
      localStorage.setItem('threat_sentinel_last_id', newLastId);
    }
  }, [alertProfiles, lastCheckedId]);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchErrors([]);
    const { advisories: data, errors } = await fetchAllAdvisories();
    setAdvisories(data);
    setFetchErrors(errors);
    setIsLoading(false);

    checkNotifications(data);

    const intelAdvisories = data.filter(a => a.category === 'intel');
    if (intelAdvisories.length > 0) {
      setIsAIAnalysisLoading(true);
      const insights = await analyzeThreatLandscape(intelAdvisories);
      setAnalysis(insights);
      setIsAIAnalysisLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('threat_sentinel_profiles', JSON.stringify(alertProfiles));
  }, [alertProfiles]);

  const addProfile = (p: { email: string; keywords: string[]; source: string }) => {
    const newProfile: AlertProfile = {
      ...p,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      isActive: true
    };
    setAlertProfiles([...alertProfiles, newProfile]);
  };

  const removeProfile = (id: string) => {
    setAlertProfiles(alertProfiles.filter(p => p.id !== id));
  };

  const filteredAdvisories = useMemo(() => {
    return advisories
      .filter(a => a.category === activeTab)
      .filter(a => {
        const searchTerms = filters.keyword.split(',').map(t => t.trim()).filter(t => t !== '');
        
        const matchesKeyword = searchTerms.length === 0 || searchTerms.some(term => 
          a.title.toLowerCase().includes(term.toLowerCase()) || 
          a.summary.toLowerCase().includes(term.toLowerCase()) ||
          a.content.toLowerCase().includes(term.toLowerCase())
        );
        
        const matchesSource = filters.source === 'All' || a.source === filters.source;
        
        const publishedTime = a.published.getTime();
        const start = filters.startDate ? new Date(filters.startDate).getTime() : 0;
        const end = filters.endDate ? new Date(filters.endDate).getTime() : Infinity;
        const matchesDate = publishedTime >= start && publishedTime <= end;

        return matchesKeyword && matchesSource && matchesDate;
      });
  }, [advisories, filters, activeTab]);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 px-6 py-4 mb-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo className="w-16 h-16" />
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight leading-none mb-1">
                Threat<span className="text-orange-500">Sentinel</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Security Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSubModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 rounded-lg text-xs font-bold text-orange-400 transition-all group shadow-lg shadow-orange-500/5"
            >
              <svg className={`w-4 h-4 ${alertProfiles.length > 0 ? 'animate-bounce' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span>Alert Profiles {alertProfiles.length > 0 && `(${alertProfiles.length})`}</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-800 mx-2"></div>
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-orange-400 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-spin text-orange-400' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* FEED ERRORS DEBUG BANNER */}
      {fetchErrors.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 shadow-lg shadow-red-900/10">
            <h4 className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Intelligence Sync Failures
            </h4>
            <div className="space-y-2">
              {fetchErrors.map((err, i) => (
                <div key={i} className="text-[10px] text-red-300 font-mono bg-red-950/30 border border-red-500/10 p-2 rounded break-all">
                  <span className="font-bold text-red-400 mr-2">[{err.source}]</span>
                  {err.message}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[9px] text-slate-500 italic">
              * Inspect individual error payloads above. Network failures typically indicate CORS restrictions or invalid credentials.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('intel'); setFilters(f => ({ ...f, source: 'All' })); }}
            className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === 'intel' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Threat Intel
          </button>
          <button
            onClick={() => { setActiveTab('news'); setFilters(f => ({ ...f, source: 'All' })); }}
            className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === 'news' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Briefings
          </button>
          <button
            onClick={() => { setActiveTab('breaches'); setFilters(f => ({ ...f, source: 'All' })); }}
            className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === 'breaches' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Data Breaches
          </button>
          <button
            onClick={() => { setActiveTab('ransomware'); setFilters(f => ({ ...f, source: 'All' })); }}
            className={`px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${activeTab === 'ransomware' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Ransomware
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">
        {activeTab === 'intel' && (
          <ThreatBriefing analysis={analysis} isLoading={isAIAnalysisLoading} />
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search (OR: comma sep.)</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Victim, CVE, Product..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  value={filters.keyword}
                  onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                />
                <svg className="absolute left-3 top-2.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeTab === 'ransomware' ? 'Ransom Group' : 'Source Provider'}</label>
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.source}
                onChange={(e) => setFilters(f => ({ ...f, source: e.target.value }))}
              >
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">From</label>
              <input 
                type="date" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.startDate}
                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">To</label>
              <input 
                type="date" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={filters.endDate}
                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-medium">Scanning multi-vector intelligence feeds...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {activeTab === 'intel' && 'Intelligence Reports'}
                {activeTab === 'news' && 'Intelligence Briefings'}
                {activeTab === 'breaches' && 'Confirmed Data Incidents'}
                {activeTab === 'ransomware' && 'Active Ransomware Victims'}
                <span className="ml-2 text-slate-600 font-normal">({filteredAdvisories.length} results)</span>
              </p>
              {filteredAdvisories.length < advisories.filter(a => a.category === activeTab).length && (
                 <button 
                  onClick={() => setFilters({ keyword: '', source: 'All', startDate: '', endDate: '' })}
                  className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-widest transition-colors"
                 >
                  Reset Tab Filters
                 </button>
              )}
            </div>
            <AdvisoryTable 
              advisories={filteredAdvisories} 
              onSelect={setSelectedAdvisory} 
            />
          </div>
        )}
      </main>

      <AdvisoryModal 
        advisory={selectedAdvisory} 
        onClose={() => setSelectedAdvisory(null)} 
      />

      <SubscriptionModal 
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        profiles={alertProfiles}
        onAddProfile={addProfile}
        onRemoveProfile={removeProfile}
        sources={sources}
        currentSearch={filters.keyword}
      />

      <footer className="mt-20 border-t border-slate-900 py-8 text-center">
        <p className="text-xs text-slate-600 font-medium tracking-wide">
          Intelligence synchronized from global providers • Dashboard by <span className="text-orange-500/80">ThreatSentinel AI</span> • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
