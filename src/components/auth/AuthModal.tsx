'use client'

/**
 * AuthModal Component
 * 
 * Authentication modal for user sign in and sign up.
 * Handles both registration and login functionality.
 * 
 * Features:
 * - Dual mode: sign in or sign up
 * - Form validation
 * - Error handling
 * - Loading states
 * - Social auth placeholders (expandable)
 * - Password requirements
 * - Email confirmation flow
 * 
 * Usage:
 * <AuthModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   mode="signin"
 *   onModeChange={setMode}
 * />
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import { X, Mail, Lock, User } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean                    // Controls modal visibility
  onClose: () => void                // Close modal callback
  mode: 'signin' | 'signup'          // Current auth mode
  onModeChange: (mode: 'signin' | 'signup') => void  // Switch mode callback
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  /**
   * Handle authentication form submission
   * Handles both sign in and sign up flows
   * 
   * @param e - Form submit event
   */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        // User registration flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: fullName,
            }
          }
        })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      } else {
        // User login flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onClose()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Don't render if modal is closed
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <GlassInput
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
              <GlassInput
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </>
          )}
          
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          
          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <GlassButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Loading...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </GlassButton>
        </form>

        <div className="mt-6">
          {mode === 'signin' ? (
            <div className="space-y-3">
              <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                Don't have an account?
              </p>
              <GlassButton
                onClick={() => onModeChange('signup')}
                className="w-full"
                variant="secondary"
              >
                Get Started
              </GlassButton>
            </div>
          ) : (
            <div className="text-center">
              <p style={{ color: 'var(--text-muted)' }}>
                Already have an account?
              </p>
              <button
                onClick={() => onModeChange('signin')}
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
