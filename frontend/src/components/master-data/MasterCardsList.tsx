import React from 'react';

export interface MasterCardsListProps {
  masterData: Record<string, string[]>;
}

export default function MasterCardsList({ masterData }: MasterCardsListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Object.entries(masterData).map(([type, values]) => (
        <div key={type} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 mb-3 uppercase tracking-wider">
            {type}
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 font-medium">
            {values.map((value) => (
              <li key={value} className="truncate" title={value}>
                {value}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
