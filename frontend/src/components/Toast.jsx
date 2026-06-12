import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', icon: '#22c55e' },
  error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', icon: '#f59e0b' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', icon: '#3b82f6' },
};

const ToastItem = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const autoClose = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration || 3000);

    return () => clearTimeout(autoClose);
  }, [toast.duration]);

  useEffect(() => {
    // If exit animation started, remove toast after animation completes
    if (isExiting) {
      const timer = setTimeout(() => onRemove(toast.id), 300);
      return () => clearTimeout(timer);
    }
  }, [isExiting, toast.id, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
  };

  const color = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || ICONS.info;

  const style = {
    container: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 16px',
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color.icon}`,
      minWidth: '320px',
      maxWidth: '440px',
      animation: isExiting
        ? 'toastSlideOut 0.3s ease-in forwards'
        : 'toastSlideIn 0.3s ease-out forwards',
      pointerEvents: 'auto',
    },
    iconWrap: {
      flexShrink: 0,
      marginTop: '1px',
      color: color.icon,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#1e293b',
      margin: '0 0 2px',
    },
    message: {
      fontSize: '13px',
      color: '#64748b',
      margin: 0,
      wordBreak: 'break-word',
    },
    closeBtn: {
      flexShrink: 0,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#94a3b8',
      padding: '2px',
      display: 'flex',
      alignItems: 'center',
    },
  };

  const titleText = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <div style={style.container}>
      <div style={style.iconWrap}>
        <Icon size={20} />
      </div>
      <div style={style.content}>
        <p style={style.title}>{titleText[toast.type] || 'Notification'}</p>
        <p style={style.message}>{toast.message}</p>
      </div>
      <button type="button" style={style.closeBtn} onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  const containerStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Keyframe animations */}
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

      <div style={containerStyle}>
        {/* Loop through all toasts to render each one */}
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
};