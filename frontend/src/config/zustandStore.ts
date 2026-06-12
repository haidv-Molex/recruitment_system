import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Kiểu keys ────────────────────────────────────────────────────────────────
export type StoreKey =
    | 'userId'
    | 'userName'
    | 'accessToken'
    | 'isLogin'
    | 'userRole'
    | 'isNetWorkConnected'
    | 'theme'
    | 'visibleJobColumns'

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────
export type StoreData = {
    userId: number
    userName: string
    accessToken: string
    isLogin: boolean
    userRole?: 'user' | 'admin'
    isNetWorkConnected: boolean
    theme: 'light' | 'dark'
    visibleJobColumns?: string[]
}

// ─── Default values ────────────────────────────────────────────────────────────
const defaultStoreData: Partial<Record<StoreKey, any>> = {
    isLogin: false,
    isNetWorkConnected: true,
    theme: 'light'
}

// ─── Store type ────────────────────────────────────────────────────────────────
type AppStore = {
    data: Partial<Record<StoreKey, any>>
    setItem: <K extends StoreKey>(key: K, value: StoreData[K], timeExpMs?: number) => void
    getItem: <K extends StoreKey>(key: K) => StoreData[K] | undefined
    removeItem: <K extends StoreKey>(key: K) => void
    clearAll: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────
const zustandStore = create<AppStore>()(
    persist(
        (set, get) => ({
            data: Object.fromEntries(
                Object.entries(defaultStoreData).map(([key, value]) => [
                    key,
                    { value, expireAt: undefined }
                ])
            ),

            setItem: (key, value, timeExpMs) => {
                const expireAt = timeExpMs ? Date.now() + timeExpMs : undefined
                set((state) => ({
                    data: { ...state.data, [key]: { value, expireAt } }
                }))
            },

            getItem: (key) => {
                const entry = get().data[key]
                if (!entry) return undefined
                if (entry.expireAt && entry.expireAt < Date.now()) {
                    console.warn(`[useAppStore] "${key}" expired and was removed`)
                    get().removeItem(key)
                    return undefined
                }
                return entry.value
            },

            removeItem: (key) => {
                console.log(`[useAppStore] removeItem:`, key)
                set((state) => {
                    const newData = { ...state.data }
                    delete newData[key]
                    return { data: newData }
                })
            },

            clearAll: () => {
                console.log(`[useAppStore] clearAll`)
                set({ data: {} })
            }
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => localStorage),
            merge: (persistedState: any, currentState: AppStore) => {
                return {
                    ...currentState,
                    ...(persistedState as object),
                    data: {
                        ...currentState.data,
                        ...((persistedState as any)?.data || {})
                    }
                }
            }
        }
    )
)

// ─── Global helpers ────────────────────────────────────────────────────────────
export const setItem = <K extends StoreKey>(key: K, value: StoreData[K], timeExpMs?: number) =>
    zustandStore.getState().setItem(key, value, timeExpMs)

export const getItem = <K extends StoreKey>(key: K) => zustandStore.getState().getItem(key)

export const useItem = <K extends StoreKey>(key: K): StoreData[K] | undefined =>
    zustandStore((state) => {
        const entry = state.data[key]
        if (!entry) return undefined
        if (entry.expireAt && entry.expireAt < Date.now()) {
            state.removeItem(key)
            return undefined
        }
        return entry.value
    })

export const removeItem = <K extends StoreKey>(key: K) => zustandStore.getState().removeItem(key)

export const clearAll = () => zustandStore.getState().clearAll()

export default zustandStore