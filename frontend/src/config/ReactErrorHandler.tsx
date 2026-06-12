import React from 'react'
import { showToast } from '@/config/ToastConfig'

// ─── Props / State ────────────────────────────────────────────────────────────
interface Props {
    children?: React.ReactNode
    /** Callback tuỳ chọn: gọi khi muốn điều hướng về trang chủ */
    onReset?: () => void
}

interface State {
    hasError: boolean
    error: Error | null
}

// ─── Inner class (ErrorBoundary) ──────────────────────────────────────────────
class ReactErrorHandlerInner extends React.Component<Props & { _onReset?: () => void }, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): Partial<State> | null {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('🧩 UI crash caught:', error, info)
        showToast('error', 'Lỗi hiển thị giao diện', error?.message ?? 'Đã xảy ra lỗi không xác định.')
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null })

        setTimeout(() => {
            if (this.props._onReset) {
                this.props._onReset()
            } else {
                // Fallback: reload trang
                window.location.href = '/'
            }
        }, 100)
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            const { error } = this.state
            return (
                <div style={styles.container}>
                    <h2 style={styles.title}>Giao diện gặp lỗi 😥</h2>
                    <p style={styles.subtitle}>Vui lòng thử lại hoặc báo lỗi cho chúng tôi.</p>

                    <div style={styles.errorBox}>
                        <pre style={styles.errorMessage}>{error?.message}</pre>
                        <pre style={styles.errorStack}>{error?.stack}</pre>
                    </div>

                    <button style={styles.button} onClick={this.handleReload}>
                        🔄 Tải lại
                    </button>
                </div>
            )
        }

        return this.props.children ?? null
    }
}

// ─── Public wrapper ───────────────────────────────────────────────────────────
function ReactErrorHandler({ children, onReset }: Props) {
    return <ReactErrorHandlerInner _onReset={onReset}>{children}</ReactErrorHandlerInner>
}

// ─── Inline styles (thay StyleSheet.create của React Native) ──────────────────
const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        minHeight: '100vh',
        backgroundColor: '#fff',
        boxSizing: 'border-box'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center'
    },
    errorBox: {
        width: '100%',
        maxWidth: 600,
        maxHeight: 200,
        overflowY: 'auto',
        backgroundColor: '#f9eaea',
        border: '1px solid #e99',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        boxSizing: 'border-box'
    },
    errorMessage: {
        fontWeight: 'bold',
        color: '#c00',
        marginBottom: 6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 13
    },
    errorStack: {
        fontSize: 11,
        color: '#555',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    },
    button: {
        padding: '8px 20px',
        fontSize: 14,
        cursor: 'pointer',
        borderRadius: 6,
        border: '1px solid #ccc',
        background: '#f0f0f0'
    }
}

export default ReactErrorHandler