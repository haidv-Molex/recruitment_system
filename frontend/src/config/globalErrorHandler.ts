import { showToast } from '@/config/ToastConfig'

// ─── Kiểu lỗi nội bộ ─────────────────────────────────────────────────────────
interface FrontendError {
    type: 'AppError' | 'NetworkError' | 'DatabaseError' | 'MailError' | 'UnknownError'
    message: string
    detail?: unknown
}

// ─── Hàm xử lý lỗi chung ─────────────────────────────────────────────────────
function handleGlobalError(error: FrontendError) {
    console.groupCollapsed(`❌ [${error.type}]`)
    console.error('Message:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    console.groupEnd()

    switch (error.type) {
        case 'AppError':
            showToast('error', 'Lỗi ứng dụng', error.message)
            break
        case 'NetworkError':
            showToast('error', 'Lỗi mạng', 'Vui lòng kiểm tra kết nối Internet')
            break
        case 'DatabaseError':
            showToast('error', 'Lỗi cơ sở dữ liệu', 'Không thể truy xuất dữ liệu')
            break
        case 'MailError':
            showToast('error', 'Lỗi gửi mail', 'Không thể gửi email, vui lòng thử lại')
            break
        default: {
            let detailText: string
            try {
                detailText =
                    typeof error.detail === 'string'
                        ? error.detail
                        : error.detail
                            ? JSON.stringify(error.detail)
                            : 'Lỗi không xác định'
            } catch {
                detailText = String(error.detail ?? 'Lỗi không xác định')
            }
            showToast('warning', detailText, error.message)
            break
        }
    }
}

// ─── Phân loại lỗi theo message ──────────────────────────────────────────────
function classifyError(msg: string): FrontendError['type'] {
    if (msg.includes('Network') || msg.includes('fetch') || msg.includes('ERR_'))
        return 'NetworkError'
    if (msg.includes('Database') || msg.includes('SQL')) return 'DatabaseError'
    if (msg.includes('mail') || msg.includes('smtp')) return 'MailError'
    return 'AppError'
}

// ─── Global error handler (Web) ───────────────────────────────────────────────
// Thay thế React Native ErrorUtils + LogBox

// ① Bắt lỗi đồng bộ chưa được try/catch
window.onerror = (message, _source, _lineno, _colno, error) => {
    const msg = String(error?.message ?? message ?? 'Lỗi không xác định')
    console.error('🔥 [window.onerror]', error ?? message)
    handleGlobalError({ type: classifyError(msg), message: msg, detail: error })
    // Trả về true để ngăn console hiện thêm lỗi mặc định của browser
    return true
}

// ② Bắt Promise bị reject mà không có .catch()
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const msg: string =
        reason instanceof Error
            ? reason.message
            : typeof reason === 'string'
                ? reason
                : (JSON.stringify(reason) ?? 'Unhandled promise rejection')

    console.error('🔥 [unhandledrejection]', reason)
    handleGlobalError({ type: classifyError(msg), message: msg, detail: reason })
    event.preventDefault() // ngăn browser log mặc định
}

    // ─── Đính kèm vào window để gọi thủ công từ bất kỳ đâu ──────────────────────
    ; (window as any).throwAppError = appError

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Ném lỗi thủ công, ví dụ:
 *   appError('Không thể tải dữ liệu', someDetail, 'NetworkError')
 *   window.throwAppError('Lỗi bất kỳ')
 */
export function appError(
    message: string,
    detail?: unknown,
    type: FrontendError['type'] = 'AppError'
): void {
    handleGlobalError({ type, message, detail })
}

export default appError