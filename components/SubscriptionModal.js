
import React, { useState, useEffect } from 'react';

const SubscriptionModal = ({ isOpen, onClose, profiles, onAddProfile, onRemoveProfile, sources, currentSearch }) => {
  const [email, setEmail] = useState('');
  const [keywordsString, setKeywordsString] = useState('');
  const [source, setSource] = useState('All');

  useEffect(() => {
    if (isOpen && currentSearch) {
      setKeywordsString(currentSearch);
    }
  }, [isOpen, currentSearch]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    const keywords = keywordsString.split(',').map(k => k.trim()).filter(k => k !== '');
    onAddProfile({ email, keywords, source });
    setKeywordsString('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100">Alert Profiles</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="email" 
              required
              placeholder="Email Address"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Keywords (comma separated)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200"
              value={keywordsString}
              onChange={(e) => setKeywordsString(e.target.value)}
            />
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm"
            >
              Save Profile
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase">Existing Profiles</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {profiles.map(p => (
                <div key={p.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center">
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">{p.email}</p>
                    <p className="text-slate-500">{p.keywords.join(', ') || 'All products'}</p>
                  </div>
                  <button onClick={() => onRemoveProfile(p.id)} className="text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
