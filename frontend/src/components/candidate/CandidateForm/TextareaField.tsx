import React from 'react';

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export default function TextareaField({ label, id, className = '', disabled, ...props }: TextareaFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 ${className}`}
        {...props}
      />
    </div>
  );
}