'use client'

/**
 * Home Page Component
 * 
 * The main landing page of the Repacked marketplace application.
 * 
 * Features:
 * - Hero section with app branding
 * - Displays recent marketplace posts
 * - Integrated authentication modal
 * - Responsive navigation header
 * 
 * Layout:
 * - Header (navigation bar)
 * - Hero section (title and tagline)
 * - Recent posts feed
 * - Auth modal (conditionally rendered)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import RecentPosts from '@/components/posts/RecentPosts'
import AuthModal from '@/components/auth/AuthModal'

export default function Home() {
  // State to control authentication modal visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  
  // State to track which auth mode is active (sign in or sign up)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  /**
   * Handle authentication action from header
   * Opens the auth modal with the specified mode
   * 
   * @param mode - Either 'signin' or 'signup'
   */
  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  return (
    <div className="min-h-screen">
      {/* Main navigation header */}
      <Header onAuth={handleAuth} />
      
      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Repacked
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
            Buy and sell with style.
          </p>
        </div>

        {/* Recent posts feed */}
        <RecentPosts />
      </main>

      {/* Authentication modal - conditionally rendered */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  )
}
