import { ReactNode } from 'react';

export interface DashboardTableColumn<T> {
  header?: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  renderCell: (item: T, index: number) => ReactNode;
  renderFooter?: (data: T[]) => ReactNode;
  width?: string;
}

interface DashboardTableProps<T> {
  data: T[];
  columns: DashboardTableColumn<T>[];
  rowKey: (item: T, index: number) => string | number;
  emptyText?: string;
}

export default function DashboardTable<T>({
  data,
  columns,
  rowKey,
  emptyText = 'No data',
}: DashboardTableProps<T>) {
  const hasHeaderRow = columns.some((col) => col.header !== undefined);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full font-sans dashboard-table">
      {/* Scrollable table container */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <table className="w-full min-w-full text-xs border-collapse dashboard-table">
          {/* Table Header Row */}
          {hasHeaderRow && (
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`sticky top-0 bg-slate-50 px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 z-10 whitespace-nowrap ${
                      col.headerClassName || 'text-left'
                    }`}
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {data.map((item, idx) => (
              <tr key={rowKey(item, idx)} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-2 py-1.5 align-middle whitespace-nowrap ${col.cellClassName || ''}`}
                    style={{ width: col.width }}
                  >
                    {col.renderCell(item, idx)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400 font-medium">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>

          {/* Table Footer */}
          <tfoot>
            <tr className="font-semibold text-slate-800">
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={`sticky bottom-0 bg-slate-50 px-2 py-1.5 align-middle border-t border-slate-200 z-10 ${col.cellClassName || ''}`}
                  style={{ width: col.width }}
                >
                  {col.renderFooter ? col.renderFooter(data) : null}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
