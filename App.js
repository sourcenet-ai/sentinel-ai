
import React, { useState, useEffect } from 'react';
import { fetchHeiseAlerts } from './services/feedService.js';
import { analyzeThreats } from './services/geminiService.js';
import ThreatBriefing from './components/ThreatBriefing.js';
import AdvisoryTable from './components/AdvisoryTable.js';
import AdvisoryModal from './components/AdvisoryModal.js';
import Logo from './components/Logo.js';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHeiseAlerts();
      setAlerts(data);
      
      // Perform AI Analysis on the top 5 threats
      if (data.length > 0) {
        const result = await analyzeThreats(data.slice(0, 5));
        setAnalysis(result);
      }
    } catch (err) {
      setError("Failed to synchronize with Heise.de security feeds.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Logo className="w-16 h-16" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Threat<span className="text-orange-500">Sentinel</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Heise Security Intelligence</p>
          </div>
        </div>
        
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm font-semibold hover:border-orange-500/50 transition-all text-slate-400 hover:text-orange-400"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Intelligence
        </button>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <ThreatBriefing analysis={analysis} loading={loading} />

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Latest Security Advisories</h3>
          <AdvisoryTable 
            alerts={alerts} 
            loading={loading} 
            onSelect={setSelectedAlert} 
          />
        </div>
      </main>

      {selectedAlert && (
        <AdvisoryModal 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)} 
        />
      )}

      <footer className="max-w-6xl mx-auto mt-20 py-8 border-t border-slate-900 text-center text-slate-600 text-[10px] uppercase tracking-widest font-bold">
        Data Provided by Heise.de Security • Proxy Orchestrated • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
