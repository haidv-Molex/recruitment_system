import React from 'react';

export interface FileUploadFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  label?: string;
  fileName?: string | null;
  placeholder?: string;
  error?: string;
}

export default function FileUploadField({
  label,
  fileName,
  placeholder = 'Click to select file...',
  error,
  id,
  className = '',
  disabled,
  accept = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.png',
  onChange,
  ...props
}: FileUploadFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <span className="block text-xs font-semibold text-slate-700">
          {label}
        </span>
      )}
      <label
        className={`flex items-center justify-between border rounded-lg px-3 py-2 transition-colors bg-white h-10 w-full ${
          disabled
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : error
            ? 'border-red-300 hover:bg-red-50/10 hover:border-red-500 cursor-pointer'
            : 'border-slate-300 hover:bg-slate-50 hover:border-emerald-500 cursor-pointer'
        } ${className}`}
      >
        <span
          className={`text-xs truncate max-w-[70%] ${
            fileName ? 'text-slate-800 font-medium' : 'text-slate-500'
          }`}
        >
          {fileName || placeholder}
        </span>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
            disabled
              ? 'text-slate-400 bg-slate-100 border-slate-200'
              : error
              ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
              : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          Browse
        </span>
        <input
          id={id}
          type="file"
          disabled={disabled}
          accept={accept}
          onChange={onChange}
          className="hidden"
          {...props}
        />
      </label>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
