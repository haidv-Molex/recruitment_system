import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const normalize = (value: any) => String(value ?? '').toLowerCase().trim();

const displayValue = (value: any) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

export const formatDate = (value: any) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

export interface ExcelColumn<T> {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  disableFilter?: boolean;
  filterOptions?: string[];
  valueGetter?: (row: T) => any;
  render?: (row: T, value: any) => React.ReactNode;
}

export interface ExcelTableProps<T> {
  title?: string;
  rows: T[];
  columns: ExcelColumn<T>[];
  emptyMessage?: string;
  defaultVisibleColumns?: string[];
  toolbarRight?: React.ReactNode;
  compact?: boolean;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T) => void;
  }[];
  selectedId?: string | number;
  onSelectRow?: (row: T) => void;
}

export default function ExcelTable<T extends Record<string, any>>({
  title,
  rows,
  columns,
  emptyMessage = 'No data found',
  defaultVisibleColumns,
  toolbarRight,
  compact = false,
  actions,
  selectedId,
  onSelectRow,
}: ExcelTableProps<T>) {
  const initialVisible = defaultVisibleColumns || columns.map((col) => col.key);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(initialVisible);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColumns, setShowColumns] = useState(false);

  const activeColumns = useMemo(
    () => columns.filter((col) => visibleColumns.includes(col.key)),
    [columns, visibleColumns]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesGlobal = !globalSearch
        ? true
        : columns.some((col) =>
            normalize(col.valueGetter ? col.valueGetter(row) : row[col.key]).includes(normalize(globalSearch))
          );

      const matchesColumns = activeColumns.every((col) => {
        if (col.disableFilter) return true;
        const filterValue = columnFilters[col.key];
        if (!filterValue) return true;
        const rawValue = col.valueGetter ? col.valueGetter(row) : row[col.key];
        return normalize(rawValue).includes(normalize(filterValue));
      });

      return matchesGlobal && matchesColumns;
    });
  }, [rows, columns, activeColumns, columnFilters, globalSearch]);

  const updateFilter = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((colKey) => colKey !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setColumnFilters({});
    setGlobalSearch('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-100 gap-4 bg-slate-50/50">
        <div>
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          <p className="text-xs text-slate-500 mt-0.5">
            Showing <span className="font-medium text-slate-800">{filteredRows.length}</span> / {rows.length} records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global search */}
          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search all columns..."
              className="pl-9 pr-3 py-1.5 w-full sm:w-64 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
          >
            <X size={16} /> Clear
          </button>

          <button
            type="button"
            onClick={() => setShowColumns((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors shadow-sm ${
              showColumns
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={16} /> Columns
          </button>

          {toolbarRight}
        </div>
      </div>

      {/* Column Visibility Selector */}
      {showColumns && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 p-4 bg-slate-50 border-b border-slate-100 text-sm">
          {columns.map((col) => (
            <label key={col.key} className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-slate-700 font-medium">{col.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200">
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.width || 140 }}
                  className="px-4 py-3 font-semibold text-slate-700 text-xs tracking-wider uppercase border-r border-slate-100 last:border-r-0"
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 font-semibold text-slate-700 text-xs tracking-wider uppercase min-w-[150px]">
                  Actions
                </th>
              )}
            </tr>
            {/* Filter row */}
            <tr className="bg-slate-50/20 border-b border-slate-200">
              {activeColumns.map((col) => (
                <th key={`${col.key}-filter`} className="p-2 border-r border-slate-100 last:border-r-0">
                  {col.disableFilter ? null : col.filterOptions ? (
                    <select
                      value={columnFilters[col.key] || ''}
                      onChange={(e) => updateFilter(col.key, e.target.value)}
                      className="w-full p-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="">All</option>
                      {col.filterOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={columnFilters[col.key] || ''}
                      onChange={(e) => updateFilter(col.key, e.target.value)}
                      placeholder="Filter..."
                      className="w-full p-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  )}
                </th>
              ))}
              {actions && <th className="p-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={(activeColumns.length || 1) + (actions ? 1 : 0)} className="px-6 py-10 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIndex) => {
                const isSelected = selectedId !== undefined && (row.id === selectedId || row.jobCode === selectedId);
                return (
                  <tr
                    key={row.id || row.jobCode || rowIndex}
                    onClick={() => onSelectRow?.(row)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 hover:bg-emerald-50'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {activeColumns.map((col) => {
                      const rawValue = col.valueGetter ? col.valueGetter(row) : row[col.key];
                      const alignmentClass =
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';

                      return (
                        <td
                          key={`${row.id || row.jobCode || rowIndex}-${col.key}`}
                          className={`px-4 py-2.5 border-r border-slate-100 last:border-r-0 ${
                            compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'
                          } ${alignmentClass}`}
                        >
                          {col.render ? col.render(row, rawValue) : displayValue(rawValue)}
                        </td>
                      );
                    })}
                    {actions && (
                      <td className="px-4 py-2 flex items-center gap-2 border-slate-100">
                        {actions.map((act) => (
                          <button
                            key={act.label}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              act.onClick(row);
                            }}
                            className="text-xs font-semibold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded"
                            title={act.label}
                          >
                            {act.icon}
                            <span className={act.icon ? 'sr-only md:not-sr-only' : ''}>{act.label}</span>
                          </button>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
