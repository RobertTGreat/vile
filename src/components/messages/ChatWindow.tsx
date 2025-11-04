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

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useMessaging } from '@/contexts/MessagingContext'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import { ArrowLeft, Send, Loader2, ExternalLink, DollarSign } from 'lucide-react'
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
  // State for messages in this conversation
  const [messages, setMessages] = useState<Message[]>([])
  
  // State for other participant's profile
  const [otherUser, setOtherUser] = useState<ParticipantProfile | null>(null)
  
  // State for post context (if conversation started from a post)
  const [postContext, setPostContext] = useState<PostContext | null>(null)
  
  // State for current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // State for message input
  const [messageInput, setMessageInput] = useState('')
  
  // State for loading and sending
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Ref for messages container (for scroll detection)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Get messaging context methods
  const { selectConversation } = useMessaging()
  
  const supabase = createClient()

  /**
   * Scroll to bottom of messages
   * Used when new messages arrive or component mounts
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

      // Fetch post context if conversation was started from a post
      if (conversation.post_id) {
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('id, title, price, image_urls')
          .eq('id', conversation.post_id)
          .single()

        if (!postError && post) {
          setPostContext({
            id: post.id,
            title: post.title,
            price: post.price,
            image_urls: post.image_urls,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error)
    }
  }

  /**
   * Fetch all messages in this conversation
   */
  const fetchMessages = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
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

      // Refresh messages to show updated read status
      fetchMessages()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  /**
   * Effect hook to fetch data on mount and set up realtime subscription
   */
  useEffect(() => {
    fetchConversationDetails()
    fetchMessages()

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
          // Add new message to state
          setMessages((prev) => [...prev, payload.new as Message])
          
          // Scroll to bottom when new message arrives
          setTimeout(scrollToBottom, 100)
          
          // Mark as read if it's from the other user
          if (payload.new.sender_id !== currentUserId) {
            markMessagesAsRead()
          }
        }
      )
      .subscribe()

    // Mark existing messages as read when opening chat
    if (currentUserId && otherUser) {
      markMessagesAsRead()
    }

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(messagesChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, otherUser?.id])

  /**
   * Effect hook to scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!messageInput.trim() || !currentUserId || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageInput.trim(),
        })

      if (error) throw error

      // Clear input after successful send
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading messages...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button and participant info */}
      <div className="flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-glass)' }}>
          <button
            onClick={() => selectConversation(null)}
            className="p-1 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-glass-hover)' }}
            >
              <span style={{ color: 'var(--text-primary)' }}>
                {otherUser?.username.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {otherUser?.full_name || otherUser?.username || 'Unknown User'}
              </h3>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                @{otherUser?.username || 'unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Post Context Box - Shows if conversation started from a post */}
        {postContext && (
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-glass)', backgroundColor: 'var(--bg-glass)' }}>
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
                  href={`/post/${postContext.id}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <h4 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                    {postContext.title}
                  </h4>
                  {postContext.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {postContext.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </Link>
              </div>

              {/* External Link Icon */}
              <Link
                href={`/post/${postContext.id}`}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center" style={{ color: 'var(--text-muted)' }}>
            <div>
              <p>No messages yet</p>
              <p className="text-sm mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'rounded-br-sm'
                      : 'rounded-bl-sm'
                  }`}
                  style={{
                    backgroundColor: isOwnMessage
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'var(--bg-glass)',
                    border: `1px solid ${isOwnMessage ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-glass)'}`,
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
        className="p-4 border-t flex gap-2 flex-shrink-0"
        style={{ borderColor: 'var(--border-glass)' }}
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

