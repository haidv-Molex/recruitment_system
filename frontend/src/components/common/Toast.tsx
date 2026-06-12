import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<any>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const BORDERS: Record<string, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

const ICON_COLORS: Record<string, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

interface ToastItemProps {
  toast: any;
  onRemove: (id: string | number) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const autoClose = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration || 3000);

    return () => clearTimeout(autoClose);
  }, [toast.duration]);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => onRemove(toast.id), 300);
      return () => clearTimeout(timer);
    }
  }, [isExiting, toast.id, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
  };

  const Icon = ICONS[toast.type] || ICONS.info;
  const borderClass = BORDERS[toast.type] || BORDERS.info;
  const iconColorClass = ICON_COLORS[toast.type] || ICON_COLORS.info;

  const titleText: Record<string, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <div
      className={`flex items-start gap-3 p-3.5 bg-white rounded-lg shadow-lg border-l-4 ${borderClass} min-w-[320px] max-w-[440px] pointer-events-auto`}
      style={{
        animation: isExiting
          ? 'toastSlideOut 0.3s ease-in forwards'
          : 'toastSlideIn 0.3s ease-out forwards',
      }}
    >
      <div className={`flex-shrink-0 mt-0.5 ${iconColorClass}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{titleText[toast.type] || 'Notification'}</p>
        <p className="text-xs text-slate-500 mt-0.5 break-words">{toast.message}</p>
      </div>
      <button
        type="button"
        className="flex-shrink-0 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        onClick={handleClose}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: any[];
  removeToast: (id: string | number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>

      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}
export default ToastContainer;
