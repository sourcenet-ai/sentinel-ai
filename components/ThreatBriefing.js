
import React from 'react';

const ThreatBriefing = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-800 rounded"></div>
          <div className="h-3 bg-slate-800 rounded w-5/6"></div>
        </div>
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
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 mb-8 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-orange-500/80"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
          AI Threat Briefing
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskColors[analysis.riskLevel] || riskColors.Medium}`}>
          {analysis.riskLevel.toUpperCase()} RISK
        </span>
      </div>
      
      <p className="text-slate-300 leading-relaxed mb-6">
        {analysis.summary}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority Recommendations</h3>
          <ul className="space-y-2">
            {analysis.topRecommendations.map((rec, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ThreatBriefing;
