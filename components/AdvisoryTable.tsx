
import React from 'react';
import { Advisory } from '../types';

interface Props {
  advisories: Advisory[];
  onSelect: (advisory: Advisory) => void;
}

const AdvisoryTable: React.FC<Props> = ({ advisories, onSelect }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* Subtle orange accent bar above header */}
            <tr className="bg-slate-800/50 border-t-2 border-orange-500/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {advisories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                  No advisories found matching your criteria.
                </td>
              </tr>
            ) : (
              advisories.map((advisory) => (
                <tr 
                  key={advisory.id} 
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group relative"
                  onClick={() => onSelect(advisory)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    <div className="flex flex-col">
                      <span>{advisory.published.toLocaleDateString()}</span>
                      <span className="text-[10px] text-slate-600">{advisory.published.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-1">
                      {advisory.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-[10px] font-bold bg-slate-800 text-slate-400 rounded group-hover:bg-orange-500/10 group-hover:text-orange-400 transition-colors">
                      {advisory.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {advisory.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      className="text-xs font-bold text-slate-500 hover:text-orange-400 uppercase tracking-widest transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(advisory);
                      }}
                    >
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
