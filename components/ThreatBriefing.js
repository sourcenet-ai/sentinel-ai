
import React from 'react';

export default function ThreatBriefing({ analysis, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="h-20 bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  if (!analysis) return null;

  const riskColors = {
    Low: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    High: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    Critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM16.243 16.243a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414z" />
          </svg>
          AI Security Intelligence
        </h2>
        <span className={`px-4 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${riskColors[analysis.riskLevel]}`}>
          {analysis.riskLevel} Global Risk
        </span>
      </div>

      <p className="text-slate-300 leading-relaxed text-sm md:text-base mb-6">
        {analysis.overview}
      </p>

      <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Actions</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
              <span className="text-orange-500 mt-1.5">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
