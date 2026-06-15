import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  disableTruncate?: boolean;
  filterOptions?: string[];
  valueGetter?: (row: T) => any;
  render?: (row: T, value: any) => React.ReactNode;
}

export interface ExcelAction<T> {
  label: string;
  icon?: React.ReactNode;
  /** Called when exactly 1 row is selected (or action is always single-only) */
  onClick: (row: T) => void;
  /**
   * When provided, this action supports bulk (multiple-row) selection.
   * Called with the array of all selected rows.
   * If omitted, the action is disabled when more than 1 row is selected.
   */
  onBulkClick?: (rows: T[]) => void;
}

export interface ExcelTableProps<T> {
  title?: string;
  rows: T[];
  columns: ExcelColumn<T>[];
  emptyMessage?: string;
  defaultVisibleColumns?: string[];
  toolbarRight?: React.ReactNode;
  compact?: boolean;
  isLoading?: boolean;
  actions?: ExcelAction<T>[];
  selectedId?: string | number;
  onSelectRow?: (row: T) => void;
  onChangeVisibleColumns?: (visibleColumns: string[]) => void;
  /**
   * When provided, column-filter inputs and the global search box will NOT
   * filter locally. Instead, clicking "Search" (or pressing Enter) calls this
   * callback with the current filter map and global search string so the parent
   * can fire an API request.  "Clear" resets the inputs and calls this callback
   * with empty values so the parent can reload unfiltered data.
   */
  onSearch?: (columnFilters: Record<string, string>, globalSearch: string) => void;
}

export default function ExcelTable<T extends Record<string, any>>({
  title,
  rows,
  columns,
  emptyMessage = 'No data found',
  defaultVisibleColumns,
  onChangeVisibleColumns,
  toolbarRight,
  compact = false,
  isLoading = false,
  actions,
  selectedId,
  onSelectRow,
  onSearch,
}: ExcelTableProps<T>) {
  const initialVisible = defaultVisibleColumns || columns.map((col) => col.key);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(initialVisible);

  useEffect(() => {
    if (defaultVisibleColumns) {
      setVisibleColumns(defaultVisibleColumns);
    }
  }, [defaultVisibleColumns]);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColumns, setShowColumns] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ text: string; x: number; y: number } | null>(null);
  // Row selection state (Set of row keys)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Clear selection when the data changes (e.g. after a search / page change)
  useEffect(() => {
    setSelectedKeys(new Set());
  }, [rows]);

  const getRowKey = (row: T, idx: number) => String(row.id ?? row.jobCode ?? idx);

  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>) => {
    const element = e.currentTarget;
    if (element.scrollWidth > element.clientWidth) {
      const text = element.innerText || element.textContent || '';
      if (text && text.trim() !== '-' && text.trim() !== '') {
        setHoveredCell({ text, x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (hoveredCell) {
      setHoveredCell((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    }
  };

  const handleMouseLeave = () => setHoveredCell(null);

  const activeColumns = useMemo(
    () => columns.filter((col) => visibleColumns.includes(col.key)),
    [columns, visibleColumns]
  );

  // Local filter — only used when onSearch is NOT provided
  const filteredRows = useMemo(() => {
    if (onSearch) return rows; // parent controls data via API
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
  }, [rows, columns, activeColumns, columnFilters, globalSearch, onSearch]);

  // Derived selection data
  const selectedRows = useMemo(
    () => filteredRows.filter((row, idx) => selectedKeys.has(getRowKey(row, idx))),
    [filteredRows, selectedKeys]
  );
  const selectionCount = selectedRows.length;
  const allChecked = filteredRows.length > 0 && selectionCount === filteredRows.length;
  const someChecked = selectionCount > 0 && !allChecked;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  const toggleSelectAll = () => {
    if (allChecked) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredRows.map((row, idx) => getRowKey(row, idx))));
    }
  };

  const toggleRow = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Toolbar filter helpers
  const updateFilter = (key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleColumn = (key: string) => {
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter((k) => k !== key)
      : [...visibleColumns, key];
    setVisibleColumns(next);
    onChangeVisibleColumns?.(next);
  };

  const triggerSearch = () => {
    onSearch?.(columnFilters, globalSearch);
  };

  const clearFilters = () => {
    setColumnFilters({});
    setGlobalSearch('');
    onSearch?.({}, '');
  };

  const handleFilterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') triggerSearch();
  };

  const hasActiveFilters =
    globalSearch.trim() !== '' || Object.values(columnFilters).some((v) => v.trim() !== '');

  // Action button state
  const canEdit = selectionCount === 1;
  const canDelete = selectionCount >= 1;

  const handleActionClick = (act: ExcelAction<T>) => {
    if (selectionCount === 1) {
      act.onClick(selectedRows[0]);
    } else if (selectionCount > 1 && act.onBulkClick) {
      act.onBulkClick(selectedRows);
    }
  };

  const isActionEnabled = (act: ExcelAction<T>) => {
    if (selectionCount === 0) return false;
    if (selectionCount === 1) return true;
    // multiple — only enabled if onBulkClick provided
    return !!act.onBulkClick;
  };

  // Total colspan (for loading/empty rows)
  const totalCols = (actions ? 1 : 0) + activeColumns.length + 1; // +1 for checkbox col

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-100 gap-3 bg-slate-50/50">
        <div className="flex items-center gap-4 min-w-0">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            <p className="text-xs text-slate-500 mt-0.5">
              Showing <span className="font-medium text-slate-800">{filteredRows.length}</span> / {rows.length} records
            </p>
          </div>

          {/* Action buttons — always visible, dimmed when disabled */}
          {actions && (
            <div className="flex items-center gap-1.5">
              {selectionCount > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 mr-1">
                  {selectionCount} selected
                </span>
              )}
              {actions.map((act) => {
                const enabled = isActionEnabled(act);
                return (
                  <button
                    key={act.label}
                    type="button"
                    disabled={!enabled}
                    onClick={() => enabled && handleActionClick(act)}
                    title={
                      selectionCount === 0
                        ? 'Select a row first'
                        : selectionCount > 1 && !act.onBulkClick
                        ? 'Only available for single selection'
                        : act.label
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                      enabled
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm cursor-pointer'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}
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
              onKeyDown={handleFilterKeyDown}
              placeholder="Search all columns..."
              className="pl-9 pr-3 py-1.5 w-full sm:w-56 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Search button */}
          {onSearch && (
            <button
              type="button"
              onClick={triggerSearch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm"
            >
              <Search size={15} /> Search
            </button>
          )}

          <button
            type="button"
            onClick={clearFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors shadow-sm ${
              hasActiveFilters
                ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50 active:bg-slate-100'
            }`}
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
        <table className="w-full border-collapse text-left text-sm border-t border-slate-300">
          <thead>
            {/* Header label row */}
            <tr className="bg-slate-100 border-b border-slate-300">
              {/* Sticky checkbox column header */}
              {actions && (
                <th
                  className="w-10 px-3 py-3 border-r border-slate-300 bg-slate-100 sticky left-0 z-20"
                  style={{ minWidth: 40 }}
                >
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-400 focus:ring-emerald-500 cursor-pointer"
                    title="Select all"
                  />
                </th>
              )}
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.width || 140 }}
                  className="px-4 py-3 font-semibold text-slate-700 text-xs tracking-wider uppercase border-r border-slate-300 last:border-r-0"
                >
                  {col.label}
                </th>
              ))}
            </tr>
            {/* Filter row */}
            {activeColumns.some((col) => !col.disableFilter) && (
              <tr className="bg-slate-50 border-b-2 border-slate-300">
                {/* Sticky checkbox filter cell */}
                {actions && (
                  <th className="w-10 px-3 py-2 border-r border-slate-300 bg-slate-50 sticky left-0 z-20" />
                )}
                {activeColumns.map((col) => (
                  <th key={`${col.key}-filter`} className="p-2 border-r border-slate-300 last:border-r-0">
                    {col.disableFilter ? null : col.filterOptions ? (
                      <select
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => updateFilter(col.key, e.target.value)}
                        onKeyDown={handleFilterKeyDown}
                        className="w-full p-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      >
                        <option value="">All</option>
                        {col.filterOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => updateFilter(col.key, e.target.value)}
                        onKeyDown={handleFilterKeyDown}
                        placeholder="Filter..."
                        className="w-full p-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={totalCols} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <svg className="animate-spin h-7 w-7 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-6 py-10 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIndex) => {
                const rowKey = getRowKey(row, rowIndex);
                const isChecked = selectedKeys.has(rowKey);
                const isHighlighted = selectedId !== undefined && (row.id === selectedId || row.jobCode === selectedId);

                let rowBg: string;
                if (isChecked) {
                  rowBg = 'bg-emerald-50/80 hover:bg-emerald-100/80';
                } else if (isHighlighted) {
                  rowBg = 'bg-blue-50/60 hover:bg-blue-100/60';
                } else if (rowIndex % 2 === 0) {
                  rowBg = 'bg-white hover:bg-slate-50/80';
                } else {
                  rowBg = 'bg-slate-50/40 hover:bg-slate-100/60';
                }

                // Sticky cell background must match row
                const stickyBg = isChecked
                  ? 'bg-emerald-50'
                  : rowIndex % 2 === 0
                  ? 'bg-white'
                  : 'bg-slate-50';

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onSelectRow?.(row)}
                    className={`transition-colors cursor-pointer border-b border-slate-200 last:border-b-0 ${rowBg}`}
                  >
                    {/* Sticky checkbox cell */}
                    {actions && (
                      <td
                        className={`w-10 px-3 py-2.5 border-r border-slate-200 sticky left-0 z-10 ${stickyBg}`}
                        onClick={(e) => toggleRow(rowKey, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-400 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {activeColumns.map((col) => {
                      const rawValue = col.valueGetter ? col.valueGetter(row) : row[col.key];
                      const alignmentClass =
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                      const shouldTruncate = col.key !== 'status' && col.key !== 'file' && !col.disableTruncate;
                      return (
                        <td
                          key={`${rowKey}-${col.key}`}
                          style={shouldTruncate ? { maxWidth: col.width || 140 } : undefined}
                          className={`px-4 border-r border-slate-200 last:border-r-0 ${
                            shouldTruncate ? 'truncate whitespace-nowrap overflow-hidden text-ellipsis' : ''
                          } ${compact ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} ${alignmentClass}`}
                          onMouseEnter={shouldTruncate ? handleMouseEnter : undefined}
                          onMouseMove={shouldTruncate ? handleMouseMove : undefined}
                          onMouseLeave={shouldTruncate ? handleMouseLeave : undefined}
                        >
                          {col.render ? col.render(row, rawValue) : displayValue(rawValue)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hoveredCell && (
        <div
          className="fixed z-[9999] pointer-events-none bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-sm break-words font-medium border border-slate-700/50 transition-opacity duration-150"
          style={{ left: hoveredCell.x + 12, top: hoveredCell.y + 12 }}
        >
          {hoveredCell.text}
        </div>
      )}
    </div>
  );
}
