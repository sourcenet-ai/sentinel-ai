
import React from 'react';

const AdvisoryTable = ({ advisories, onSelect }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-t-2 border-orange-500/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {advisories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                  No advisories found matching your criteria.
                </td>
              </tr>
            ) : (
              advisories.map((advisory) => (
                <tr 
                  key={advisory.id} 
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  onClick={() => onSelect(advisory)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {advisory.published.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-1">
                      {advisory.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-[10px] font-bold bg-slate-800 text-slate-400 rounded">
                      {advisory.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-xs font-bold text-slate-500 hover:text-orange-400 uppercase tracking-widest transition-colors">
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvisoryTable;
