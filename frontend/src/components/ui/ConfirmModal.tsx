import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the cancel button (safer default) when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const colorMap = {
    danger: {
      icon: <Trash2 size={22} className="text-red-500" />,
      iconBg: 'bg-red-50 border border-red-100',
      btn: 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
      title: 'text-slate-900',
    },
    warning: {
      icon: <AlertTriangle size={22} className="text-amber-500" />,
      iconBg: 'bg-amber-50 border border-amber-100',
      btn: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-400',
      title: 'text-slate-900',
    },
    info: {
      icon: <AlertTriangle size={22} className="text-blue-500" />,
      iconBg: 'bg-blue-50 border border-blue-100',
      btn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
      title: 'text-slate-900',
    },
  };

  const colors = colorMap[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3 right-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Body */}
        <div className="px-6 pt-7 pb-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
              {colors.icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3
                id="confirm-modal-title"
                className={`text-base font-semibold leading-snug ${colors.title}`}
              >
                {title}
              </h3>
              <div className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                {message}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 border-t border-slate-100" />

          {/* Actions */}
          <div className="mt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${colors.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
