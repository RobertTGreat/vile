/**
 * ChatWindow Component
 * 
 * Displays an individual conversation with message history and input.
 * Features:
 * - Message history with sender names and timestamps
 * - Real-time message updates via Supabase subscriptions
 * - Auto-scroll to bottom on new messages
 * - Mark messages as read when viewing
 * - Send new messages
 * - Display other participant's profile information
 * - Back button to return to conversation list
 * 
 * @param conversationId - The ID of the conversation to display
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useMessaging } from '@/contexts/MessagingContext'
import { useCachedMessages, useCachedPost } from '@/hooks/useCachedData'
import { useCache } from '@/lib/cache'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import { ArrowLeft, Send, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

/**
 * Message interface - represents a single message in a conversation
 */
interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

/**
 * Participant profile information
 */
interface ParticipantProfile {
  id: string
  username: string
  full_name: string | null
}

/**
 * Post context information (if conversation started from a post)
 */
interface PostContext {
  id: string
  title: string
  price: number | null
  image_urls: string[] | null
}

interface ChatWindowProps {
  conversationId: string
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  // State for other participant's profile
  const [otherUser, setOtherUser] = useState<ParticipantProfile | null>(null)

  // State for post context (if conversation started from a post)
  const [postContext, setPostContext] = useState<PostContext | null>(null)

  // State for current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // State for message input
  const [messageInput, setMessageInput] = useState('')

  // State for sending
  const [sending, setSending] = useState(false)

  // State for tracking if user is near bottom (for smart scrolling)
  const [isNearBottom, setIsNearBottom] = useState(true)

  // State for tracking if user just sent a message (should scroll to bottom)
  const [justSentMessage, setJustSentMessage] = useState(false)

  // Use cached messages hook
  const { data: messages = [], loading: messagesLoading, refetch: refetchMessages, isFromCache } = useCachedMessages(conversationId)

  // Cache instance for direct cache updates
  const cache = useCache()

  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ref for messages container (for scroll detection)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Throttle mark messages as read to prevent spam
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Get messaging context methods
  const { selectConversation } = useMessaging()

  const supabase = createClient()

  /**
   * Check if user is near the bottom of messages
   */
  const checkIsNearBottom = () => {
    if (!messagesContainerRef.current) return true

    const container = messagesContainerRef.current
    const threshold = 100 // pixels from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight

    return distanceFromBottom <= threshold
  }

  /**
   * Handle scroll events to track user's position
   */
  const handleScroll = () => {
    setIsNearBottom(checkIsNearBottom())
  }

  /**
   * Smart scroll to bottom - only scrolls if user is near bottom or just sent a message
   */
  const smartScrollToBottom = (force = false) => {
    if (force || justSentMessage || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setJustSentMessage(false) // Reset after scrolling
    }
  }

  /**
   * Fetch current user ID
   */
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  /**
   * Fetch post context asynchronously to prevent blocking chat display
   */
  const fetchPostContext = async (postId: string) => {
    // Don't fetch if already have context or if currently fetching
    if (postContext || !postId) return

    try {
      // Check cache first
      const cachedPost = cache.posts.get(postId)
      if (cachedPost) {
        setPostContext({
          id: cachedPost.id,
          title: cachedPost.title,
          price: cachedPost.price,
          image_urls: cachedPost.image_urls,
        })
        return
      }

      // Fetch from database if not in cache
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id, title, price, image_urls')
        .eq('id', postId)
        .single()

      if (!postError && post) {
        // Cache the result
        cache.posts.set(postId, post)
        setPostContext({
          id: post.id,
          title: post.title,
          price: post.price,
          image_urls: post.image_urls,
        })
      }
    } catch (error) {
      console.error('Error fetching post context:', error)
    }
  }

  /**
   * Fetch conversation details and participant information
   */
  const fetchConversationDetails = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch conversation to get participant IDs and post context
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('user1_id, user2_id, post_id')
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      // Determine other participant's ID
      const otherUserId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id

      // Fetch other participant's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('id', otherUserId)
        .single()

      if (profileError) throw profileError

      setOtherUser({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
      })

      // Fetch post context asynchronously to prevent blocking chat display
      if (conversation.post_id) {
        fetchPostContext(conversation.post_id)
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error)
    }
  }

  /**
   * Mark messages as read
   * Updates all unread messages in this conversation that were sent by the other user
   */
  const markMessagesAsRead = async () => {
    if (!currentUserId || !otherUser) return

    try {
      // Update all messages that are unread and sent by the other user
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('sender_id', otherUser.id)
        .is('read_at', null)

      if (error) throw error

      // Update cache locally to reflect read status without refetching
      const currentMessages = cache.messages.get(conversationId) || []
      const updatedMessages = currentMessages.map(msg =>
        msg.sender_id === otherUser.id && !msg.read_at
          ? { ...msg, read_at: new Date().toISOString() }
          : msg
      )
      cache.messages.set(conversationId, updatedMessages)
    } catch (error) {
      // Don't log network errors to avoid spam, but still handle them
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage?.includes('NetworkError')) {
        console.error('Error marking messages as read:', error)
      }
    }
  }

  // Stabilize functions to prevent unnecessary re-renders
  const stableFetchConversationDetails = useCallback(fetchConversationDetails, [conversationId, supabase])
  const stableMarkMessagesAsRead = useCallback(markMessagesAsRead, [currentUserId, otherUser, conversationId, cache])

  const throttledMarkAsRead = useCallback(() => {
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current)
    }

    markAsReadTimeoutRef.current = setTimeout(() => {
      stableMarkMessagesAsRead()
    }, 300) // Throttle to 300ms
  }, [stableMarkMessagesAsRead])

  /**
   * Effect hook to fetch data on mount and set up realtime subscription
   */
  useEffect(() => {
    stableFetchConversationDetails()

    // Subscribe to realtime updates for messages in this conversation
    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update cache directly with new message to avoid flickering
          const currentMessages = cache.messages.get(conversationId) || []
          const newMessage = payload.new as Message

          // Only add if not already in cache (prevent duplicates)
          const messageExists = currentMessages.some(msg => msg.id === newMessage.id)
          if (!messageExists) {
            // Sort messages by creation time to maintain order
            const updatedMessages = [...currentMessages, newMessage].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            cache.messages.set(conversationId, updatedMessages)
          }

          // Smart scroll to bottom when new message arrives
          setTimeout(() => smartScrollToBottom(), 100)

          // Mark as read if it's from the other user (throttled to prevent spam)
          if (payload.new.sender_id !== currentUserId) {
            throttledMarkAsRead()
          }
        }
      )
      .subscribe()

    // Mark existing messages as read when opening chat
    if (currentUserId && otherUser) {
      stableMarkMessagesAsRead()
    }

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(messagesChannel)
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current)
      }
    }
  }, [conversationId, currentUserId, otherUser?.id, stableFetchConversationDetails, stableMarkMessagesAsRead, cache, supabase])

  /**
   * Effect hook to handle initial load and scroll behavior
   */
  useEffect(() => {
    // Only scroll on initial load or when user sends a message
    if ((messages?.length ?? 0) > 0) {
      smartScrollToBottom(true) // Force scroll on first load
    }
  }, [messages?.length]) // Only depend on message count, not the entire messages array

  /**
   * Effect hook to add scroll event listeners
   */
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  /**
   * Safety check: if we have cached data but it's empty and we're not loading,
   * it might indicate corrupted cache - refetch to ensure data integrity
   */
  useEffect(() => {
    if (isFromCache && !messagesLoading && (messages?.length ?? 0) === 0) {
      // Wait longer before refetching to avoid conflicts with real-time updates
      const timeout = setTimeout(() => {
        refetchMessages()
      }, 1000) // Increased delay to prevent conflicts
      return () => clearTimeout(timeout)
    }
  }, [isFromCache, messagesLoading, messages?.length, refetchMessages])

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageInput.trim() || !currentUserId || sending) return

    const messageContent = messageInput.trim()
    setSending(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
        })
        .select()
        .single()

      if (error) throw error

      // Update cache immediately to prevent flickering
      const currentMessages = cache.messages.get(conversationId) || []
      const newMessage = data
      // Sort messages by creation time to maintain order
      const updatedMessages = [...currentMessages, newMessage].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      cache.messages.set(conversationId, updatedMessages)

      // Set flag to scroll to bottom and clear input after successful send
      setJustSentMessage(true)
      setMessageInput('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  /**
   * Format timestamp for display
   * Shows time (e.g., "2:30 PM") or date if older
   */
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading messages...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Post Context Box - Shows if conversation started from a post */}
      {postContext && (
        <div className="p-3 border-b backdrop-blur-md flex-shrink-0 animate-in slide-in-from-top-2 duration-300" style={{ borderColor: 'var(--border-glass)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="flex items-center gap-3">
            {/* Post Image */}
            {postContext.image_urls && postContext.image_urls.length > 0 && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={postContext.image_urls[0]}
                  alt={postContext.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Post Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Conversation about:
              </p>
              <Link
                href={`/post/${postContext.id}?from=conversations&conversationId=${conversationId}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <h4 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                  {postContext.title}
                </h4>
                {postContext.price && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      £{postContext.price.toFixed(2)}
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* External Link Icon */}
            <Link
              href={`/post/${postContext.id}?from=conversations&conversationId=${conversationId}`}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {(messages?.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center h-full text-center" style={{ color: 'var(--text-muted)' }}>
            <div>
              <p>No messages yet</p>
              <p className="text-sm mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages?.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 backdrop-blur-md ${
                    isOwnMessage
                      ? 'rounded-br-sm'
                      : 'rounded-bl-sm'
                  }`}
                  style={{
                    backgroundColor: isOwnMessage
                      ? 'rgba(139, 92, 246, 0.4)'
                      : 'rgba(0, 0, 0, 0.2)',
                    border: `1px solid ${isOwnMessage ? 'rgba(139, 92, 246, 0.5)' : 'var(--border-glass)'}`,
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                    {message.content}
                  </p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatMessageTime(message.created_at)}
                    </span>
                    {isOwnMessage && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {message.read_at ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t flex gap-2 flex-shrink-0 backdrop-blur-md"
        style={{ borderColor: 'var(--border-glass)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      >
        <div className="flex-1">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 rounded-xl glass-input focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
            disabled={sending}
          />
        </div>
        <GlassButton
          type="submit"
          disabled={!messageInput.trim() || sending}
          className="px-4"
        >
          {sending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
        </GlassButton>
      </form>
    </div>
  )
}

