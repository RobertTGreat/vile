'use client'

/**
 * Search Page Component
 * 
 * The search/browse page for exploring marketplace items.
 * Allows users to search, filter, and sort through available posts.
 * 
 * Features:
 * - Search functionality via SearchContext
 * - Post filtering and sorting
 * - Create post modal (requires authentication)
 * - Authentication modal for non-logged-in users
 * - Real-time search updates
 * 
 * Layout:
 * - Header with navigation
 * - SearchPostList component with filters
 * - Modals for create post and auth
 */

import { useState, useEffect } from 'react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import SearchPostList from '@/components/posts/SearchPostList'
import CreatePostModal from '@/components/posts/CreatePostModal'
import AuthModal from '@/components/auth/AuthModal'

export default function SearchPage() {
  // Modal state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  // User state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  /**
   * Effect to manage user authentication state
   * Subscribes to auth changes for real-time updates
   */
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  /**
   * Handle create post action
   * Opens create post modal if authenticated, otherwise opens auth modal
   */
  const handleCreatePost = () => {
    if (user) {
      setIsCreatePostOpen(true)
    } else {
      setIsAuthOpen(true)
      setAuthMode('signin')
    }
  }

  /**
   * Handle post creation completion
   * Refreshes the page to show the new post
   */
  const handlePostCreated = () => {
    setIsCreatePostOpen(false)
    // Refresh the post list
    window.location.reload()
  }

  /**
   * Handle authentication action from header
   * Opens auth modal with specified mode
   * 
   * @param mode - 'signin' or 'signup'
   */
  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  return (
    <div className="min-h-screen">
      <Header onAuth={handleAuth} />
      
      <main className="container mx-auto px-4 py-8">
        <SearchPostList onCreatePost={handleCreatePost} isAuthenticated={!!user} />
      </main>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  )
}
