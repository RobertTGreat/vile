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
import { X, Mail, Lock, User, ArrowLeft } from 'lucide-react'

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
  const [success, setSuccess] = useState('')
  
  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const supabase = createClient()

  /**
   * Reset form state when modal closes or mode changes
   */
  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setFullName('')
    setError('')
    setSuccess('')
    setResetEmail('')
    setShowPasswordReset(false)
  }

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
    setSuccess('')

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
        setSuccess('Check your email for the confirmation link!')
        setTimeout(() => {
          resetForm()
          onClose()
        }, 3000)
      } else {
        // User login flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        resetForm()
        onClose()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle password reset request
   * Sends password reset email to user
   * 
   * @param e - Form submit event
   */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!resetEmail) {
        setError('Please enter your email address')
        setResetLoading(false)
        return
      }

      // Send password reset email
      // The redirectTo URL must match one configured in Supabase dashboard
      // Go to Authentication > URL Configuration > Redirect URLs and add:
      // http://localhost:3000/auth/reset-password (for development)
      // https://yourdomain.com/auth/reset-password (for production)
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess('Password reset email sent! Check your inbox for instructions.')
      
      // Reset form and close after delay
      setTimeout(() => {
        setShowPasswordReset(false)
        setResetEmail('')
        setSuccess('')
      }, 3000)
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email')
    } finally {
      setResetLoading(false)
    }
  }

  // Don't render if modal is closed
  if (!isOpen) return null

  // Password reset view
  if (showPasswordReset) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <GlassCard className="w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowPasswordReset(false)
                  setResetEmail('')
                  setError('')
                  setSuccess('')
                }}
                className="p-1 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Reset Password
              </h2>
            </div>
            <button
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <GlassInput
                label="Email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-500/10 border border-green-400/20 rounded-lg p-3">
                {success}
              </div>
            )}

            <GlassButton
              type="submit"
              className="w-full"
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={() => {
              resetForm()
              onClose()
            }}
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
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm transition-colors hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-500/10 border border-green-400/20 rounded-lg p-3">
              {success}
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
