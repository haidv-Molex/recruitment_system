import { describe, it, expect, beforeEach } from 'vitest'
import { setItem, getItem, removeItem, clearAll } from '../zustandStore'

describe('zustandStore tests', () => {
    beforeEach(() => {
        clearAll()
    })

    it('should set and get values correctly', () => {
        setItem('userId', 123)
        expect(getItem('userId')).toBe(123)

        setItem('theme', 'dark')
        expect(getItem('theme')).toBe('dark')
    })

    it('should remove items correctly', () => {
        setItem('userId', 123)
        removeItem('userId')
        expect(getItem('userId')).toBeUndefined()
    })

    it('should respect TTL expiration', async () => {
        setItem('userName', 'TestUser', 50)
        expect(getItem('userName')).toBe('TestUser')

        await new Promise((resolve) => setTimeout(resolve, 60))

        expect(getItem('userName')).toBeUndefined()
    })
})
