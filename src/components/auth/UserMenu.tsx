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

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassButton from '@/components/ui/GlassButton'
import GlassCard from '@/components/ui/GlassCard'
import { User as UserIcon, LogOut, Settings, FileText } from 'lucide-react'
import Link from 'next/link'

export default function UserMenu() {
  // Current user state
  const [user, setUser] = useState<User | null>(null)
  
  // Menu visibility state
  const [isOpen, setIsOpen] = useState(false)
  
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
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button px-3 py-1.5 hover:bg-white/15 transition-all duration-300 rounded-xl"
      >
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {user.user_metadata?.username || user.email?.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <GlassCard className="absolute right-0 top-full mt-2 w-48 p-2">
          <div className="space-y-1">
            <Link
              href="/my-posts"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <FileText size={16} />
              <span>Profile</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
