/**
 * Comprehensive Caching System
 *
 * Provides in-memory and sessionStorage-based caching with TTL support.
 * Designed to eliminate loading animations on subsequent data fetches.
 *
 * Features:
 * - In-memory cache with expiration times
 * - sessionStorage persistence for longer-term caching
 * - Automatic cache invalidation
 * - Type-safe cache operations
 * - Cache statistics and cleanup
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  persist?: boolean // Whether to persist to sessionStorage
  namespace?: string // Cache namespace for grouping related data
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000 // Clean up every minute

  constructor() {
    // Load persisted cache on initialization
    this.loadPersistedCache()

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.DEFAULT_TTL, persist = false } = options
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    this.memoryCache.set(key, entry)

    if (persist) {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`cache_${key}`, JSON.stringify(entry))
        }
      } catch (error) {
        // sessionStorage might be full or unavailable
        console.warn('Failed to persist cache to sessionStorage:', error)
      }
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      // Also remove from sessionStorage if it exists
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`cache_${key}`)
        }
      } catch (error) {
        // Ignore errors
      }
      return null
    }

    return entry.data
  }

  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.memoryCache.get(key)
    return entry ? (Date.now() - entry.timestamp <= entry.ttl) : false
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`cache_${key}`)
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear()
    try {
      if (typeof window !== 'undefined') {
        // Clear all cache entries from sessionStorage
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            sessionStorage.removeItem(key)
          }
        })
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Clear cache entries by namespace
   */
  clearNamespace(namespace: string): void {
    const keysToDelete: string[] = []

    // Find keys in memory cache
    this.memoryCache.forEach((_, key) => {
      if (key.startsWith(`${namespace}:`)) {
        keysToDelete.push(key)
      }
    })

    // Delete from memory cache
    keysToDelete.forEach(key => this.memoryCache.delete(key))

    // Delete from sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(sessionStorage)
        keys.forEach(key => {
          if (key.startsWith(`cache_${namespace}:`)) {
            sessionStorage.removeItem(key)
          }
        })
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memoryEntries: number; totalSize: number } {
    let totalSize = 0
    this.memoryCache.forEach(entry => {
      totalSize += JSON.stringify(entry).length
    })

    return {
      memoryEntries: this.memoryCache.size,
      totalSize
    }
  }

  /**
   * Load persisted cache from sessionStorage
   */
  private loadPersistedCache(): void {
    try {
      if (typeof window === 'undefined') {
        // sessionStorage not available during SSR
        return
      }

      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const cacheKey = key.replace('cache_', '')
            const entryStr = sessionStorage.getItem(key)
            if (entryStr) {
              const entry = JSON.parse(entryStr)
              // Only load if not expired
              if (Date.now() - entry.timestamp <= entry.ttl) {
                this.memoryCache.set(cacheKey, entry)
              } else {
                // Remove expired entry
                sessionStorage.removeItem(key)
              }
            }
          } catch (error) {
            // Remove corrupted cache entry
            sessionStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      // sessionStorage might not be available
      console.warn('Failed to load persisted cache:', error)
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.memoryCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.memoryCache.delete(key)
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`cache_${key}`)
        }
      } catch (error) {
        // Ignore errors
      }
    })
  }
}

// Create singleton instance
const cacheManager = new CacheManager()

/**
 * Cache utility functions for common use cases
 */
export const Cache = {
  // Generic cache operations
  set: <T>(key: string, data: T, options?: CacheOptions) => cacheManager.set(key, data, options),
  get: <T>(key: string): T | null => cacheManager.get<T>(key),
  has: (key: string): boolean => cacheManager.has(key),
  delete: (key: string) => cacheManager.delete(key),
  clear: () => cacheManager.clear(),
  clearNamespace: (namespace: string) => cacheManager.clearNamespace(namespace),
  getStats: () => cacheManager.getStats(),

  // Specific cache operations for common data types
  messages: {
    set: (conversationId: string, messages: any[]) =>
      cacheManager.set(`messages:${conversationId}`, messages, {
        ttl: 10 * 60 * 1000, // 10 minutes
        persist: true,
        namespace: 'messages'
      }),
    get: (conversationId: string) => cacheManager.get<any[]>(`messages:${conversationId}`),
    invalidate: (conversationId: string) => cacheManager.delete(`messages:${conversationId}`),
    clearAll: () => cacheManager.clearNamespace('messages')
  },

  posts: {
    set: (postId: string, post: any) =>
      cacheManager.set(`posts:${postId}`, post, {
        ttl: 15 * 60 * 1000, // 15 minutes
        persist: true,
        namespace: 'posts'
      }),
    get: (postId: string) => cacheManager.get<any>(`posts:${postId}`),
    invalidate: (postId: string) => cacheManager.delete(`posts:${postId}`),
    clearAll: () => cacheManager.clearNamespace('posts')
  },

  postLists: {
    set: (key: string, posts: any[]) =>
      cacheManager.set(`postLists:${key}`, posts, {
        ttl: 5 * 60 * 1000, // 5 minutes
        persist: false, // Don't persist post lists (they change frequently)
        namespace: 'postLists'
      }),
    get: (key: string) => cacheManager.get<any[]>(`postLists:${key}`),
    invalidate: (key: string) => cacheManager.delete(`postLists:${key}`),
    clearAll: () => cacheManager.clearNamespace('postLists')
  },

  conversations: {
    set: (userId: string, conversations: any[]) =>
      cacheManager.set(`conversations:${userId}`, conversations, {
        ttl: 10 * 60 * 1000, // 10 minutes
        persist: true,
        namespace: 'conversations'
      }),
    get: (userId: string) => cacheManager.get<any[]>(`conversations:${userId}`),
    invalidate: (userId: string) => cacheManager.delete(`conversations:${userId}`),
    clearAll: () => cacheManager.clearNamespace('conversations')
  },

  profiles: {
    set: (userId: string, profile: any) =>
      cacheManager.set(`profiles:${userId}`, profile, {
        ttl: 30 * 60 * 1000, // 30 minutes
        persist: true,
        namespace: 'profiles'
      }),
    get: (userId: string) => cacheManager.get<any>(`profiles:${userId}`),
    invalidate: (userId: string) => cacheManager.delete(`profiles:${userId}`),
    clearAll: () => cacheManager.clearNamespace('profiles')
  },

  avatars: {
    set: (avatarUrl: string, blob: Blob) =>
      cacheManager.set(`avatars:${avatarUrl}`, blob, {
        ttl: 60 * 60 * 1000, // 1 hour for avatars
        persist: false, // Don't persist blobs to sessionStorage
        namespace: 'avatars'
      }),
    get: (avatarUrl: string) => cacheManager.get<Blob>(`avatars:${avatarUrl}`),
    invalidate: (avatarUrl: string) => cacheManager.delete(`avatars:${avatarUrl}`),
    clearAll: () => cacheManager.clearNamespace('avatars')
  }
}

/**
 * React hook for using cache in components
 */
export function useCache() {
  return {
    set: Cache.set,
    get: Cache.get,
    has: Cache.has,
    delete: Cache.delete,
    clear: Cache.clear,
    getStats: Cache.getStats,
    messages: Cache.messages,
    posts: Cache.posts,
    postLists: Cache.postLists,
    conversations: Cache.conversations,
    profiles: Cache.profiles,
    avatars: Cache.avatars
  }
}

export default Cache
