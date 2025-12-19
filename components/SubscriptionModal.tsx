
import React, { useState, useEffect } from 'react';
import { AlertProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profiles: AlertProfile[];
  onAddProfile: (profile: { email: string; keywords: string[]; source: string }) => void;
  onRemoveProfile: (id: string) => void;
  sources: string[];
  currentSearch: string;
}

const SubscriptionModal: React.FC<Props> = ({ isOpen, onClose, profiles, onAddProfile, onRemoveProfile, sources, currentSearch }) => {
  const [email, setEmail] = useState('');
  const [keywordsString, setKeywordsString] = useState('');
  const [source, setSource] = useState('All');

  // Automatically populate keywords from current search if user is creating a profile
  useEffect(() => {
    if (isOpen && currentSearch) {
      setKeywordsString(currentSearch);
    }
  }, [isOpen, currentSearch]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Parse comma separated keywords
    const keywords = keywordsString.split(',')
      .map(k => k.trim())
      .filter(k => k !== '');
      
    onAddProfile({ email, keywords, source });
    setKeywordsString('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Permanent Alert Profiles
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="security-ops@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Products/Keywords (OR condition, comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cisco, Windows, Log4j"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={keywordsString}
                    onChange={(e) => setKeywordsString(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-600">Alarms trigger if ANY of these terms match a new advisory.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Advisory Source</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-lg shadow-orange-600/20"
            >
              Save Alert Profile
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Profiles</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {profiles.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No stored profiles. Create one to receive tailored alerts.</p>
              ) : (
                profiles.map(p => (
                  <div key={p.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center group">
                    <div className="space-y-1 pr-4">
                      <p className="text-xs font-bold text-slate-200">{p.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                         {p.keywords.map((kw, i) => (
                           <span key={i} className="px-1.5 py-0.5 bg-orange-900/30 text-orange-400 text-[9px] rounded border border-orange-400/20">
                             {kw}
                           </span>
                         ))}
                         {p.keywords.length === 0 && <span className="text-[9px] text-slate-600 italic">All products</span>}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tight">Source: {p.source}</p>
                    </div>
                    <button 
                      onClick={() => onRemoveProfile(p.id)}
                      className="text-slate-600 hover:text-red-400 p-1 transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 rounded-b-2xl">
          <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
            Profiles are persisted in your browser's local storage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
