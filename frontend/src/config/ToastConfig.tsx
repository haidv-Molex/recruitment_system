import React, { createContext, useContext, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
    id: string
    type: ToastType
    text1: string
    text2?: string
}

interface ToastContextValue {
    show: (type: ToastType, text1: string, text2?: string, durationMs?: number) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Icons (inline SVG – không cần thư viện icon) ────────────────────────────
// display:block trên SVG loại bỏ khoảng trống inline mặc định của trình duyệt
const svgProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'white',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    style: { display: 'block' } // ← quan trọng: xoá baseline gap
}

const Icon = ({ type }: { type: ToastType }) => {
    if (type === 'success')
        return (
            <svg {...svgProps}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="8 12 11 15 16 9" />
            </svg>
        )
    if (type === 'error')
        return (
            <svg {...svgProps}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        )
    // warning
    return (
        <svg {...svgProps}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
}

const BG: Record<ToastType, string> = {
    success: '#00D796',
    error: '#E05B63',
    warning: '#FBC02D'
}

// ─── Single Toast Item ────────────────────────────────────────────────────────
const ToastCard = ({ item }: { item: ToastItem }) => (
    <div
        role="alert"
        aria-live="assertive"
        aria-label={[item.text1, item.text2].filter(Boolean).join('. ')}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: BG[item.type],
            color: 'white',
            borderRadius: 12,
            padding: '10px 14px',
            minWidth: 220,
            maxWidth: '90vw',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            animation: 'toast-slide-in 0.28s cubic-bezier(.22,.68,0,1.3) both',
            pointerEvents: 'auto'
        }}
    >
        <span style={{ flexShrink: 0 }}>
            <Icon type={item.type} />
        </span>
        <div style={{ minWidth: 0 }}>
            {item.text1 && (
                <p
                    style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        color: '#fff'
                    }}
                >
                    {item.text1}
                </p>
            )}
            {item.text2 && (
                <p
                    style={{
                        margin: '3px 0 0',
                        fontWeight: 400,
                        fontSize: 13,
                        lineHeight: 1.3,
                        color: 'rgba(255,255,255,0.88)',
                        wordBreak: 'break-word'
                    }}
                >
                    {item.text2}
                </p>
            )}
        </div>
    </div>
)

// ─── Toast Container (Portal) ─────────────────────────────────────────────────
const ToastContainer = ({ toasts }: { toasts: ToastItem[] }) => {
    if (toasts.length === 0) return null

    return createPortal(
        <>
            {/* Inject keyframes một lần */}
            <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateY(-20px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>

            <div
                style={{
                    position: 'fixed',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    pointerEvents: 'none'
                }}
            >
                {toasts.map((t) => (
                    <ToastCard key={t.id} item={t} />
                ))}
            </div>
        </>,
        document.body
    )
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        const timer = timerRef.current.get(id)
        if (timer) {
            clearTimeout(timer)
            timerRef.current.delete(id)
        }
    }, [])

    const show = useCallback(
        (type: ToastType, text1: string, text2 = '', durationMs = 2500) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
            setToasts((prev) => [...prev, { id, type, text1, text2 }])

            // Announce to screen readers
            try {
                window.speechSynthesis?.cancel()
            } catch {
                /**/
            }

            const timer = setTimeout(() => dismiss(id), durationMs)
            timerRef.current.set(id, timer)
        },
        [dismiss]
    )

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
    return ctx
}

// ─── Singleton helper (gọi được từ ngoài component, ví dụ axiosInstance) ──────
let _show: ToastContextValue['show'] | null = null

/** Gọi hàm này trong App root để kết nối singleton với Provider */
export function connectToastSingleton(fn: ToastContextValue['show']) {
    _show = fn
}

export function showToast(
    type: ToastType,
    text1: string,
    text2 = '',
    _topOffset = 10 // giữ signature tương thích React Native cũ
) {
    if (_show) {
        _show(type, text1, text2)
    } else {
        // Fallback nếu Provider chưa mount
        console.warn(`[Toast] ${type}: ${text1}${text2 ? ' – ' + text2 : ''}`)
    }
}

// ─── Connector Component (đặt bên trong ToastProvider) ────────────────────────
/** Đặt <ToastConnector /> bên trong <ToastProvider> để kích hoạt singleton */
export function ToastConnector() {
    const { show } = useToast()
    React.useEffect(() => {
        connectToastSingleton(show)
        return () => {
            _show = null
        }
    }, [show])
    return null
}

export default ToastProvider