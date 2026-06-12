import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const normalize = (value) => String(value ?? '').toLowerCase().trim();
const displayValue = (value) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '-';
  return value;
};

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

export const ExcelTable = ({
  title,
  rows,
  columns,
  emptyMessage = 'No data found',
  defaultVisibleColumns,
  toolbarRight,
  compact = false,
}) => {
  const initialVisible = defaultVisibleColumns || columns.map((column) => column.key);
  const [visibleColumns, setVisibleColumns] = useState(initialVisible);
  const [columnFilters, setColumnFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColumns, setShowColumns] = useState(false);

  const activeColumns = useMemo(
    () => columns.filter((column) => visibleColumns.includes(column.key)),
    [columns, visibleColumns]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesGlobal = !globalSearch
        ? true
        : columns.some((column) => normalize(column.valueGetter ? column.valueGetter(row) : row[column.key]).includes(normalize(globalSearch)));

      const matchesColumns = activeColumns.every((column) => {
        if (column.disableFilter) return true;
        const filterValue = columnFilters[column.key];
        if (!filterValue) return true;
        const rawValue = column.valueGetter ? column.valueGetter(row) : row[column.key];
        return normalize(rawValue).includes(normalize(filterValue));
      });

      return matchesGlobal && matchesColumns;
    });
  }, [rows, columns, activeColumns, columnFilters, globalSearch]);

  const updateFilter = (key, value) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((columnKey) => columnKey !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setColumnFilters({});
    setGlobalSearch('');
  };

  return (
    <div className="excel-card">
      <div className="excel-toolbar">
        <div>
          {title && <h2 className="excel-title">{title}</h2>}
          <p className="excel-subtitle">Showing {filteredRows.length} / {rows.length} records</p>
        </div>

        <div className="excel-toolbar-actions">
          <div className="excel-search">
            <Search size={16} />
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search all columns..."
            />
          </div>
          <button type="button" className="excel-button secondary" onClick={clearFilters}>
            <X size={16} /> Clear
          </button>
          <button type="button" className="excel-button secondary" onClick={() => setShowColumns((value) => !value)}>
            <SlidersHorizontal size={16} /> Columns
          </button>
          {toolbarRight}
        </div>
      </div>

      {showColumns && (
        <div className="column-chooser">
          {columns.map((column) => (
            <label key={column.key} className="column-checkbox">
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.key)}
                onChange={() => toggleColumn(column.key)}
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
      )}

      <div className="excel-table-wrap">
        <table className={`excel-table ${compact ? 'compact' : ''}`}>
          <thead>
            <tr>
              {activeColumns.map((column) => (
                <th key={column.key} style={{ minWidth: column.width || 140 }}>
                  {column.label}
                </th>
              ))}
            </tr>
            <tr className="filter-row">
              {activeColumns.map((column) => (
                <th key={`${column.key}-filter`}>
                  {column.disableFilter ? null : column.filterOptions ? (
                    <select
                      value={columnFilters[column.key] || ''}
                      onChange={(event) => updateFilter(column.key, event.target.value)}
                    >
                      <option value="">All</option>
                      {column.filterOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={columnFilters[column.key] || ''}
                      onChange={(event) => updateFilter(column.key, event.target.value)}
                      placeholder="Filter..."
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length || 1} className="empty-cell">{emptyMessage}</td>
              </tr>
            ) : (
              filteredRows.map((row, rowIndex) => (
                <tr key={row.id || row.jobCode || rowIndex}>
                  {activeColumns.map((column) => {
                    const rawValue = column.valueGetter ? column.valueGetter(row) : row[column.key];
                    return (
                      <td key={`${row.id || row.jobCode || rowIndex}-${column.key}`} className={column.align === 'right' ? 'text-right' : ''}>
                        {column.render ? column.render(row, rawValue) : displayValue(rawValue)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
