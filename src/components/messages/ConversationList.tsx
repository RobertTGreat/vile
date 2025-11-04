/**
 * ConversationList Component
 * 
 * Displays a list of all conversations for the current user.
 * Features:
 * - Lists all conversations sorted by most recent message
 * - Shows preview of last message and timestamp
 * - Displays unread message count badge
 * - Click to open conversation in chat window
 * - Real-time updates when new messages arrive
 * - Fetches participant profile information
 * 
 * @param currentUserId - The ID of the currently authenticated user
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useMessaging } from '@/contexts/MessagingContext'
import { useCachedConversations } from '@/hooks/useCachedData'
import { useCache } from '@/lib/cache'
import Avatar from '@/components/ui/Avatar'
import { MessageCircle, Clock } from 'lucide-react'

/**
 * Conversation interface - represents a conversation between two users
 */
interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  updated_at: string
  created_at: string
  // Last message in the conversation (if any)
  last_message: {
    content: string
    created_at: string
    sender_id: string
  } | null
  // Other participant's profile information
  other_user: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  // Count of unread messages in this conversation
  unread_count: number
}

interface ConversationListProps {
  currentUserId: string
}

export default function ConversationList({ currentUserId }: ConversationListProps) {
  // Get messaging context methods
  const { selectConversation, setUnreadCount } = useMessaging()

  // Use cached conversations hook
  const { data: conversations = [], loading: conversationsLoading, refetch: refetchConversations } = useCachedConversations(currentUserId)

  // Cache instance for direct cache updates
  const cache = useCache()

  const supabase = createClient()

  /**
   * Update global unread count when conversations change
   */
  useEffect(() => {
    const totalUnread = conversations?.reduce((sum, conv) => sum + conv.unread_count, 0) ?? 0
    setUnreadCount(totalUnread)
  }, [conversations, setUnreadCount])

  /**
   * Effect hook to set up realtime subscription for cache invalidation
   */
  useEffect(() => {
    // Subscribe to realtime updates for conversations
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user1_id=eq.${currentUserId}`,
        },
        () => {
          // Invalidate conversations cache
          refetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user2_id=eq.${currentUserId}`,
        },
        () => {
          // Invalidate conversations cache
          refetchConversations()
        }
      )
      .subscribe()

    // Subscribe to realtime updates for messages
    // This will update the conversation list when any message is inserted
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Only update if this user is involved in the conversation
          const message = payload.new
          try {
            const { data: conversation } = await supabase
              .from('conversations')
              .select('user1_id, user2_id')
              .eq('id', message.conversation_id)
              .single()

            if (conversation && (conversation.user1_id === currentUserId || conversation.user2_id === currentUserId)) {
              // Invalidate conversations cache when relevant messages arrive
              refetchConversations()
            }
          } catch (error) {
            // If we can't check, just refetch to be safe
            refetchConversations()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Only update if this user is involved in the conversation
          const message = payload.new
          try {
            const { data: conversation } = await supabase
              .from('conversations')
              .select('user1_id, user2_id')
              .eq('id', message.conversation_id)
              .single()

            if (conversation && (conversation.user1_id === currentUserId || conversation.user2_id === currentUserId)) {
              // Invalidate conversations cache when relevant messages are updated
              refetchConversations()
            }
          } catch (error) {
            // If we can't check, just refetch to be safe
            refetchConversations()
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(conversationsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [currentUserId, supabase, refetchConversations])

  /**
   * Format timestamp for display
   * Shows relative time (e.g., "2m ago") or date if older
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
        Loading conversations...
      </div>
    )
  }

  if ((conversations?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <MessageCircle size={48} className="mb-4 opacity-50" />
        <p>No conversations yet</p>
        <p className="text-sm mt-2">Start a conversation with another user!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {conversations?.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => selectConversation(conversation.id)}
          className="flex items-start gap-3 p-4 border-b transition-colors hover:bg-white/10 text-left backdrop-blur-md"
          style={{ borderColor: 'var(--border-glass)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          {/* Avatar */}
          <Avatar
            src={conversation.other_user.avatar_url}
            alt={conversation.other_user.full_name || conversation.other_user.username}
            size="lg"
          />

          {/* Conversation details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {conversation.other_user.full_name || conversation.other_user.username}
              </h3>
              {conversation.last_message && (
                <span className="text-xs flex items-center gap-1 flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={12} />
                  {formatTimestamp(conversation.last_message.created_at)}
                </span>
              )}
            </div>

            {/* Last message preview */}
            {conversation.last_message ? (
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                {conversation.last_message.sender_id === currentUserId && 'You: '}
                {conversation.last_message.content}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                No messages yet
              </p>
            )}
          </div>

          {/* Unread count badge */}
          {conversation.unread_count > 0 && (
            <div className="flex-shrink-0">
              <span
                className="flex items-center justify-center min-w-[20px] h-5 px-2 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: 'rgb(139, 92, 246)' }}
              >
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

