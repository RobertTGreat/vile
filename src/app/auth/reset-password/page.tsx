/**
 * Password Reset Page
 * 
 * Handles password reset flow when user clicks the link from their email.
 * Features:
 * - Validates reset token from URL hash
 * - New password form with confirmation
 * - Password strength validation
 * - Updates password via Supabase
 * - Redirects to home after successful reset
 * 
 * Route: /auth/reset-password
 * 
 * This page is accessed via email link from Supabase password reset.
 * The URL will contain a hash with the access token and type.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  // Router for navigation
  const router = useRouter()
  
  // Form state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI state
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validating, setValidating] = useState(true)
  
  const supabase = createClient()

  /**
   * Effect hook to validate the reset token on mount
   * Supabase automatically handles the hash fragment and sets the session
   * We just need to verify the session exists and is valid
   */
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Wait a moment for Supabase to process the hash fragment
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verify the session exists (Supabase automatically processes the hash)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setError('Failed to validate reset link. Please try again.')
          setValidating(false)
          return
        }

        // Check if URL hash contains recovery token
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')

        if (!session || type !== 'recovery') {
          setError('Invalid or expired reset link. Please request a new password reset.')
          setValidating(false)
          return
        }

        setValidating(false)
      } catch (err: any) {
        setError('Failed to validate reset link. Please try again.')
        setValidating(false)
      }
    }

    validateToken()
  }, [supabase])

  /**
   * Validate password strength
   * Returns true if password meets requirements
   */
  const validatePassword = (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    return minLength && hasUpperCase && hasLowerCase && hasNumber
  }

  /**
   * Get password strength message
   */
  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return ''
    if (!validatePassword(password)) {
      return 'Password must be at least 8 characters with uppercase, lowercase, and number'
    }
    return 'Password strength: Good'
  }

  /**
   * Handle password reset form submission
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validation
      if (!newPassword || !confirmPassword) {
        setError('All fields are required')
        setLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (!validatePassword(newPassword)) {
        setError('Password must be at least 8 characters with uppercase, lowercase, and number')
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to update password')
        setLoading(false)
        return
      }

      // Success
      setSuccess('Password updated successfully! Redirecting...')
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header onAuth={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                <Lock size={24} style={{ color: 'var(--text-primary)' }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Reset Password
              </h1>
            </div>

            {validating ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                Validating reset link...
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl glass-input focus:outline-none"
                      style={{ color: 'var(--text-primary)' }}
                      placeholder="Enter new password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      validatePassword(newPassword) ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {validatePassword(newPassword) ? (
                        <CheckCircle size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {getPasswordStrength(newPassword)}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl glass-input focus:outline-none"
                      style={{ color: 'var(--text-primary)' }}
                      placeholder="Confirm new password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <p className="text-xs mt-1 text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/20 flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/20 flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-400">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <GlassButton
                  type="submit"
                  className="w-full"
                  disabled={loading || !!error}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </GlassButton>

                {/* Back to Login Link */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => router.push('/')}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
                  >
                    Back to Home
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      </main>
    </div>
  )
}

