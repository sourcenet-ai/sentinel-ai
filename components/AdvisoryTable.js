
import React from 'react';

export default function AdvisoryTable({ alerts, loading, onSelect }) {
  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4">Release Date</th>
              <th className="px-6 py-4">Security Advisory</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {alerts.map((alert) => (
              <tr 
                key={alert.id} 
                className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                onClick={() => onSelect(alert)}
              >
                <td className="px-6 py-5 whitespace-nowrap text-xs text-slate-500 font-medium">
                  {alert.date.toLocaleDateString()}
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-1">
                    {alert.title}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className="px-2 py-1 bg-slate-800 rounded text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                    {alert.source}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-[10px] font-black text-slate-600 hover:text-orange-400 uppercase tracking-widest transition-colors">
                    Report Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
