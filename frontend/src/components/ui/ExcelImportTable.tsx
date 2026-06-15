import React from 'react';

export interface ExcelImportTableHeader {
  label: string;
  widthClass?: string; // e.g. "w-12", "w-44"
}

export interface ExcelImportTableProps<T> {
  minWidth?: string;
  rows: T[];
  selectedIndices: Set<number>;
  onSelectRow: (index: number) => void;
  onSelectAll: (checked: boolean) => void;
  headers: ExcelImportTableHeader[];
  renderRow: (item: T, index: number) => React.ReactNode;
}

export default function ExcelImportTable<T>({
  minWidth = '2000px',
  rows,
  selectedIndices,
  onSelectRow,
  onSelectAll,
  headers,
  renderRow,
}: ExcelImportTableProps<T>) {
  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;

  return (
    <div className="overflow-auto border border-slate-200 rounded-lg bg-white flex-grow min-h-0">
      <table
        className="w-full text-left text-xs text-slate-600 border-collapse table-fixed"
        style={{ minWidth }}
      >
        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-20">
          <tr>
            <th className="p-2.5 font-semibold text-slate-800 w-12 text-center sticky left-0 bg-slate-50 z-30 border-r border-slate-200">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </th>
            <th className="p-2.5 font-semibold text-slate-800 w-10 text-center">#</th>
            {headers.map((h, i) => (
              <th key={i} className={`p-2.5 font-semibold text-slate-800 ${h.widthClass || ''}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, i) => {
            const isSelected = selectedIndices.has(i);
            return (
              <tr
                key={i}
                className={`hover:bg-slate-50/50 transition-colors group ${
                  isSelected ? 'bg-emerald-50/10' : ''
                }`}
              >
                <td
                  className={`p-2.5 text-center sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors ${
                    isSelected ? 'bg-emerald-50' : 'bg-white group-hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectRow(i)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </td>
                <td className="p-2.5 text-center text-slate-400 font-semibold">{i + 1}</td>
                {renderRow(row, i)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
