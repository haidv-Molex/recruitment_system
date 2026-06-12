import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export default function SelectField({
  label,
  error,
  options,
  id,
  className = '',
  disabled,
  ...props
}: SelectFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900'
            : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
