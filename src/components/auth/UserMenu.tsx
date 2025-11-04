'use client'

/**
 * UserMenu Component
 * 
 * Dropdown menu for authenticated users. Displays user options and profile actions.
 * 
 * Features:
 * - User profile display
 * - Quick access to My Posts
 * - Settings link
 * - Sign out functionality
 * - Dropdown menu with hover effects
 * 
 * Usage:
 * <UserMenu />
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassButton from '@/components/ui/GlassButton'
import { User as UserIcon, LogOut, Settings, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { useCreatePost } from '@/contexts/CreatePostContext'

export default function UserMenu() {
  // Current user state
  const [user, setUser] = useState<User | null>(null)
  
  // Menu visibility state
  const [isOpen, setIsOpen] = useState(false)
  
  // Ref for button position
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Create post context
  const { openModal: openCreatePost } = useCreatePost()
  
  const supabase = createClient()

  /**
   * Effect to manage user authentication state
   * Subscribes to auth changes and updates user state
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
  }, [supabase.auth])

  /**
   * Handle user sign out
   * Signs out current user and closes menu
   */
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
  }

  // Don't render if no user is logged in
  if (!user) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button px-2 sm:px-3 py-1.5 hover:bg-white/15 transition-all duration-300 rounded-xl flex-shrink-0 max-w-[80px] sm:max-w-none"
      >
        <span className="font-medium text-xs sm:text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {user.user_metadata?.username || user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-10 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed top-[72px] right-5 w-48 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-md border"
            style={{
              backgroundColor: 'var(--bg-glass)',
              borderColor: 'var(--border-glass)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <div className="p-2 space-y-1">
              {/* Create Post and Settings - Icon only, side by side */}
              <div className="flex gap-1 mb-1">
                {/* Create Post Button */}
                <button
                  onClick={() => {
                    openCreatePost()
                    setIsOpen(false)
                  }}
                  className="flex-1 flex items-center justify-center p-2 rounded-lg transition-all group"
                  style={{ 
                    color: 'rgb(196, 181, 253)',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(139, 92, 246, 0.25)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(139, 92, 246, 0.15)'
                  }}
                  title="Create Post"
                >
                  <Plus size={18} style={{ color: 'rgb(196, 181, 253)' }} />
                </button>
                
                {/* Settings Link */}
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.color = 'var(--text-primary)'
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-glass-hover)'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.color = 'var(--text-muted)'
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }}
                  title="Settings"
                >
                  <Settings size={18} />
                </Link>
              </div>
              
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = 'var(--text-primary)'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-glass-hover)'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = 'var(--text-muted)'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <FileText size={16} />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = 'var(--text-primary)'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-glass-hover)'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = 'var(--text-muted)'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
