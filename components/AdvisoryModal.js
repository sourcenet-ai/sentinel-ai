
import React from 'react';

const AdvisoryModal = ({ advisory, onClose }) => {
  if (!advisory) return null;

  const sanitize = (html) => {
    if (!html) return "";
    return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-600/10 text-orange-400 border border-orange-400/20 rounded">
              {advisory.source}
            </span>
            <h3 className="text-xl font-bold text-slate-100 mt-2 mb-1">{advisory.title}</h3>
            <div className="text-xs text-slate-500">
              {advisory.published.toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Details</h4>
            <div 
              className="text-slate-300 text-sm leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: sanitize(advisory.summary || advisory.content) }} 
            />
          </section>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 flex justify-between items-center">
            <span className="text-xs text-orange-200/80">View the original source bulletin.</span>
            <a 
              href={advisory.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              External Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryModal;
