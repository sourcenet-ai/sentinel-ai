
import React from 'react';

export default function AdvisoryModal({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-start">
          <div className="space-y-2">
            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[9px] font-black rounded uppercase tracking-widest border border-orange-500/20">
              {alert.source} Verified
            </span>
            <h3 className="text-2xl font-black text-white leading-tight">{alert.title}</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Reported on {alert.date.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-8">
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Executive Summary</h4>
            <div 
              className="text-slate-300 text-sm md:text-base leading-relaxed prose prose-invert"
              dangerouslySetInnerHTML={{ __html: alert.summary }}
            />
          </section>

          <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Source Bulletin</p>
              <p className="text-xs text-slate-400">Read the original advisory directly from the Heise Security Portal.</p>
            </div>
            <a 
              href={alert.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap"
            >
              EXTERNAL BULLETIN
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
