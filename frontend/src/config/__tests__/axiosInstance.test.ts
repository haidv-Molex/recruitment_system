import { describe, it, expect, beforeEach, vi } from 'vitest'
import axiosInstance from '../axiosInstance'

describe('axiosInstance request interceptor tests', () => {
    beforeEach(() => {
        const store: Record<string, string> = {}
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => { store[key] = value },
            removeItem: (key: string) => { delete store[key] },
            clear: () => { for (const k in store) delete store[k] }
        })
        
        vi.stubGlobal('navigator', {
            onLine: true
        })
    })

    it('should attach Authorization header if token exists in localStorage', async () => {
        localStorage.setItem('authToken', 'my-dummy-token')
        
        const interceptor = (axiosInstance.interceptors.request as any).handlers[0]
        const dummyConfig = { headers: {} }
        const result = interceptor.fulfilled(dummyConfig)
        
        expect(result.headers.Authorization).toBe('Bearer my-dummy-token')
    })

    it('should not attach Authorization header if token does not exist in localStorage', async () => {
        localStorage.removeItem('authToken')
        
        const interceptor = (axiosInstance.interceptors.request as any).handlers[0]
        const dummyConfig = { headers: {} }
        const result = interceptor.fulfilled(dummyConfig)
        
        expect(result.headers.Authorization).toBeUndefined()
    })
})
