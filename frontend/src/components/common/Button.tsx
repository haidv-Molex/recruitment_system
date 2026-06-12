import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800',
    secondary: 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 active:bg-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white active:bg-red-800',
    ghost: 'bg-transparent hover:bg-slate-100 border-none text-slate-600 shadow-none active:bg-slate-200',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
