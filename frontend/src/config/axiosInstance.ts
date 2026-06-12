import axios, { AxiosError, AxiosResponse } from 'axios'
import { showToast } from '@/config/ToastConfig'
import { setItem } from '@/config/zustandStore'

// ─── Kiểu API response ────────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
    result: boolean
    message: string
    data?: T
    details?: string | string[]
}

// ─── Theo dõi kết nối mạng (Web API) ─────────────────────────────────────────
window.addEventListener('online', () => {
    setItem('isNetWorkConnected', true)
    console.log('[axiosInstance] Network connected')
})
window.addEventListener('offline', () => {
    setItem('isNetWorkConnected', false)
    console.warn('[axiosInstance] Network disconnected')
})

// ─── Axios instance ───────────────────────────────────────────────────────────
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 30 * 1000,
    withCredentials: true, // tự động gửi & nhận cookie
    headers: { 'X-Custom-Header': 'foobar' }
})

// ─── Request interceptor: kiểm tra mạng + gắn token ──────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        // Kiểm tra kết nối qua Web API
        if (!navigator.onLine) {
            showToast('error', 'Không có kết nối mạng. Vui lòng kiểm tra lại.')
            return Promise.reject(new Error('Không có kết nối mạng. Vui lòng kiểm tra lại.'))
        }

        // Gắn access token từ localStorage
        const token = localStorage.getItem('authToken')
        if (token) config.headers.Authorization = `Bearer ${token}`

        config.timeoutErrorMessage = 'Request timeout'
        return config
    },
    (error) => Promise.reject(error)
)

// ─── Response interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        if (response.data?.result === false) {
            showToast('error', response.data.message || 'Đã xảy ra lỗi.')
            return Promise.reject(new Error(response.data.message || 'API trả về lỗi'))
        }
        return response
    },

    async (error: AxiosError<ApiResponse>) => {
        const status = error.response?.status

        // ── 401: Hết hạn phiên đăng nhập / Không có quyền truy cập ────────────────
        if (status === 401) {
            const currentPath = window.location.pathname
            if (currentPath !== '/login') {
                localStorage.removeItem('authToken')
                localStorage.removeItem('recruitment_auth_user')
                showToast('warning', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
                window.location.href = '/login'
            }
            return Promise.reject(error)
        }

        // ── Các lỗi HTTP khác ─────────────────────────────────────────────────
        const detailMessage = Array.isArray(error.response?.data?.details)
            ? error.response!.data!.details!.join(', ')
            : (error.response?.data?.details as string | undefined)

        switch (status) {
            case 400:
                showToast(
                    'warning',
                    error.response?.data?.message || 'Yêu cầu không hợp lệ.',
                    detailMessage
                )
                break
            case 404:
                showToast(
                    'warning',
                    error.response?.data?.message || 'Không tìm thấy tài nguyên.',
                    detailMessage
                )
                break
            case 500:
                showToast('error', 'Lỗi server. Vui lòng thử lại sau.', detailMessage)
                break
            default:
                if (!status || status < 200 || status >= 300) {
                    showToast('error', error.response?.data?.message || error.message, detailMessage)
                }
                break
        }

        return Promise.reject(error)
    }
)

export default axiosInstance