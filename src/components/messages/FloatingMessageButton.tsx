/**
 * FloatingMessageButton Component
 * 
 * A floating button positioned at the bottom right of the screen
 * that opens the messaging popup. Shows unread message count badge.
 * 
 * Features:
 * - Fixed position bottom right
 * - Icon-only design
 * - Unread count badge
 * - Only visible when user is logged in
 * - Smooth animations
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import { useMessaging } from '@/contexts/MessagingContext'
import { MessageCircle } from 'lucide-react'

export default function FloatingMessageButton() {
  // Current user state
  const [user, setUser] = useState<User | null>(null)
  
  // Get messaging context
  const { openMessaging, unreadCount } = useMessaging()
  
  const supabase = createClient()

  /**
   * Effect hook to fetch current user on mount
   * and subscribe to auth state changes
   */
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Don't render if user is not logged in
  if (!user) return null

  return (
    <button
      onClick={openMessaging}
      className="fixed bottom-4 right-4 z-30 p-4 rounded-full glass-card shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
      style={{ 
        color: 'var(--text-primary)',
        backgroundColor: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
      }}
      title="Messages"
      aria-label="Open messages"
    >
      <div className="relative">
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-semibold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </button>
  )
}

