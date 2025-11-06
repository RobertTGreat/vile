/**
 * React Hook for Cached Data Fetching
 *
 * Provides a convenient way to fetch data with automatic caching,
 * preventing loading animations on subsequent loads.
 *
 * Features:
 * - Automatic cache checking and fallback to API
 * - Loading state management
 * - Error handling
 * - Cache invalidation support
 * - Type safety
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCache } from '@/lib/cache'

interface UseCachedDataOptions<T> {
  cacheKey: string
  fetcher: () => Promise<T>
  enabled?: boolean
  cacheTime?: number
  persist?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseCachedDataReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isFromCache: boolean
  refetch: () => Promise<void>
  invalidate: () => void
}

/**
 * Hook for fetching data with automatic caching
 *
 * @param options Configuration options
 * @returns Object with data, loading state, and cache status
 */
export function useCachedData<T>({
  cacheKey,
  fetcher,
  enabled = true,
  cacheTime,
  persist,
  onSuccess,
  onError
}: UseCachedDataOptions<T>): UseCachedDataReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const cache = useCache()

  // Fetch data function
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      // Check cache first (unless forcing refresh)
      if (!force) {
        const cachedData = cache.get<T>(cacheKey)
        if (cachedData !== null) {
          setData(cachedData)
          setIsFromCache(true)
          setLoading(false)
          onSuccess?.(cachedData)
          return
        }
      }

      // Fetch from API
      setIsFromCache(false)
      const freshData = await fetcher()

      // Cache the result
      cache.set(cacheKey, freshData, {
        ttl: cacheTime,
        persist
      })

      setData(freshData)
      onSuccess?.(freshData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [cacheKey, fetcher, enabled, cacheTime, persist, onSuccess, onError, cache])

  // Refetch function (forces API call)
  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // Invalidate cache
  const invalidate = useCallback(() => {
    cache.delete(cacheKey)
  }, [cacheKey, cache])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    isFromCache,
    refetch,
    invalidate
  }
}

/**
 * Hook specifically for cached messages in a conversation
 */
export function useCachedMessages(conversationId: string, enabled = true) {
  const cache = useCache()

  return useCachedData({
    cacheKey: `messages:${conversationId}`,
    fetcher: async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled,
    cacheTime: 10 * 60 * 1000, // 10 minutes
    persist: true,
    onSuccess: (messages) => {
      // Cache using the messages namespace
      cache.messages.set(conversationId, messages)
    }
  })
}

/**
 * Hook specifically for cached post data
 */
export function useCachedPost(postId: string, enabled = true) {
  const cache = useCache()

  return useCachedData({
    cacheKey: `posts:${postId}`,
    fetcher: async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user_id,
          profiles!user_id (username, full_name, id),
          post_tags (
            tags (name, color)
          )
        `)
        .eq('id', postId)
        .single()

      if (error) throw error
      return data
    },
    enabled,
    cacheTime: 15 * 60 * 1000, // 15 minutes
    persist: true,
    onSuccess: (post) => {
      // Cache using the posts namespace
      cache.posts.set(postId, post)
    }
  })
}

/**
 * Hook specifically for cached conversations
 */
export function useCachedConversations(userId: string, enabled = true) {
  const cache = useCache()

  return useCachedData({
    cacheKey: `conversations:${userId}`,
    fetcher: async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      // Fetch conversations where user is a participant
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (conversationsError) throw conversationsError

      // For each conversation, fetch the last message and unread count
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Determine the other user's ID
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id

          // Fetch other user's profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', otherUserId)
            .single()

          // Fetch last message in conversation
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Count unread messages (messages not sent by current user and not read)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .is('read_at', null)

          return {
            ...conv,
            last_message: lastMessageData || null,
            other_user: {
              id: otherUserId,
              username: profileData?.username || 'Unknown',
              full_name: profileData?.full_name || null,
              avatar_url: profileData?.avatar_url || null,
            },
            unread_count: unreadCount || 0,
          }
        })
      )

      return conversationsWithDetails
    },
    enabled,
    cacheTime: 10 * 60 * 1000, // 10 minutes
    persist: true,
    onSuccess: (conversations) => {
      // Cache using the conversations namespace
      cache.conversations.set(userId, conversations)
    }
  })
}

/**
 * Hook specifically for cached user profiles
 */
export function useCachedProfile(userId: string, enabled = true) {
  const cache = useCache()

  return useCachedData({
    cacheKey: `profiles:${userId}`,
    fetcher: async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled,
    cacheTime: 30 * 60 * 1000, // 30 minutes
    persist: true,
    onSuccess: (profile) => {
      // Cache using the profiles namespace
      cache.profiles.set(userId, profile)
    }
  })
}

/**
 * Hook for cached avatar images
 * Loads and caches avatar images from the avatars bucket
 */
export function useCachedAvatar(avatarUrl: string | null, enabled = true) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cache = useCache()
  // Use ref to store cache methods to avoid dependency issues
  const cacheRef = useRef(cache)
  cacheRef.current = cache
  
  // Use ref to track current imageUrl for cleanup
  const imageUrlRef = useRef<string | null>(null)
  imageUrlRef.current = imageUrl

  useEffect(() => {
    if (!avatarUrl || !enabled) {
      // Cleanup previous image URL if exists
      if (imageUrlRef.current && imageUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrlRef.current)
      }
      setImageUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    const loadAvatar = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        const cachedBlob = cacheRef.current.avatars.get(avatarUrl)
        if (cachedBlob) {
          const objectUrl = URL.createObjectURL(cachedBlob)
          setImageUrl(objectUrl)
          setLoading(false)
          return
        }

        // Fetch from Supabase Storage
        const response = await fetch(avatarUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch avatar: ${response.status}`)
        }

        const blob = await response.blob()

        // Cache the blob
        cacheRef.current.avatars.set(avatarUrl, blob)

        // Create object URL for display
        const objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        console.error('Error loading avatar:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAvatar()

    // Cleanup function to revoke object URLs
    return () => {
      if (imageUrlRef.current && imageUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrlRef.current)
      }
    }
  }, [avatarUrl, enabled])

  return { imageUrl, loading, error }
}
