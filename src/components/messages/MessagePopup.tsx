/**
 * MessagePopup Component
 * 
 * Main messaging interface that appears as a popup from the bottom right of the screen.
 * Features:
 * - Animated slide-in/out from bottom right
 * - Conversation list view (default)
 * - Individual chat window view
 * - Real-time message updates via Supabase subscriptions
 * - Glassmorphism styling consistent with app theme
 * - Responsive design for mobile and desktop
 * 
 * Usage:
 * Controlled by MessagingContext - opens/closes based on context state.
 * Renders either ConversationList or ChatWindow based on selectedConversationId.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassCard from '@/components/ui/GlassCard'
import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'
import { useMessaging } from '@/contexts/MessagingContext'
import { X } from 'lucide-react'

export default function MessagePopup() {
  // Get messaging state from context
  const { isOpen, closeMessaging, selectedConversationId } = useMessaging()
  
  // Current authenticated user state
  const [user, setUser] = useState<User | null>(null)
  
  const supabase = createClient()

  /**
   * Effect hook to fetch current user on mount
   * Only necessary if we need user info in this component
   */
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Don't render if popup is closed
  if (!isOpen) return null

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <>
      {/* Popup container - positioned bottom right */}
      <div
        className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[400px] md:w-[480px] h-[600px] max-h-[calc(100vh-8rem)] transition-all duration-300 ease-out"
        style={{
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(100%) scale(0.95)',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <GlassCard className="h-full flex flex-col overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-glass)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Messages
            </h2>
            <button
              onClick={closeMessaging}
              className="p-1 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
              aria-label="Close messages"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content area - shows either conversation list or chat window */}
          <div className="flex-1 overflow-hidden">
            {selectedConversationId ? (
              <ChatWindow conversationId={selectedConversationId} />
            ) : (
              <ConversationList currentUserId={user.id} />
            )}
          </div>
        </GlassCard>
      </div>
    </>
  )
}

