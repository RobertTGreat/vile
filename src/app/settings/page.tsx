/**
 * Settings Page
 * 
 * User settings page for managing account and shipping details.
 * Features:
 * - Email change with confirmation
 * - Password update
 * - Shipping details (address, city, state, postal code, country)
 * - Form validation and error handling
 * - Glassmorphism styling consistent with app theme
 * 
 * Route: /settings
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import GlassTextarea from '@/components/ui/GlassTextarea'
import { 
  Mail, 
  Lock, 
  Truck,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Save,
  Palette
} from 'lucide-react'
import ThemeSelector from '@/components/ui/ThemeSelector'
import Link from 'next/link'

/**
 * Profile data structure
 */
interface ProfileData {
  username: string | null
  full_name: string | null
  location: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_postal_code: string | null
  shipping_country: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    username: null,
    full_name: null,
    location: null,
    shipping_address: null,
    shipping_city: null,
    shipping_state: null,
    shipping_postal_code: null,
    shipping_country: null,
  })

  // Email state
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showEmailChange, setShowEmailChange] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState<'account' | 'shipping'>('account')

  /**
   * Effect to fetch user and profile data on mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/')
          return
        }

        setUser(user)
        setEmail(user.email || '')

        // Fetch profile data (only shipping fields)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        if (profileData) {
          setProfile({
            username: null,
            full_name: null,
            location: null,
            shipping_address: profileData.shipping_address || null,
            shipping_city: profileData.shipping_city || null,
            shipping_state: profileData.shipping_state || null,
            shipping_postal_code: profileData.shipping_postal_code || null,
            shipping_country: profileData.shipping_country || null,
          })
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return minLength && hasUpperCase && hasLowerCase && hasNumber
  }


  /**
   * Handle shipping details update
   */
  const handleUpdateShipping = async () => {
    if (!user) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          shipping_address: profile.shipping_address || null,
          shipping_city: profile.shipping_city || null,
          shipping_state: profile.shipping_state || null,
          shipping_postal_code: profile.shipping_postal_code || null,
          shipping_country: profile.shipping_country || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Shipping details updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update shipping details')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Handle email change request
   */
  const handleChangeEmail = async () => {
    if (!user || !newEmail) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (newEmail === email) {
        setError('New email must be different from current email')
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (updateError) throw updateError

      setSuccess('Email change requested! Please check your email to confirm the new address.')
      setNewEmail('')
      setShowEmailChange(false)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(err.message || 'Failed to change email')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Handle password update
   */
  const handleUpdatePassword = async () => {
    if (!user) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('All fields are required')
        setSaving(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match')
        setSaving(false)
        return
      }

      if (!validatePassword(newPassword)) {
        setError('Password must be at least 8 characters with uppercase, lowercase, and number')
        setSaving(false)
        return
      }

      if (currentPassword === newPassword) {
        setError('New password must be different from current password')
        setSaving(false)
        return
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (signInError) {
        setError('Current password is incorrect')
        setSaving(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header onAuth={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>
            Loading settings...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header onAuth={() => {}} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-4 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-400/20 flex items-start gap-2">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-400/20 flex items-start gap-2">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveSection('account')}
            className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeSection === 'account' ? 'glass-button' : ''
            }`}
            style={{
              color: activeSection === 'account' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Lock size={16} className="inline mr-2" />
            Account
          </button>
          <button
            onClick={() => setActiveSection('shipping')}
            className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeSection === 'shipping' ? 'glass-button' : ''
            }`}
            style={{
              color: activeSection === 'shipping' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Truck size={16} className="inline mr-2" />
            Shipping
          </button>
        </div>

        {/* Appearance Section */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
              <Palette size={24} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Appearance
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Theme
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Choose between light and dark mode
              </p>
            </div>
            <ThemeSelector />
          </div>
        </GlassCard>

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-6">
            {/* Email Change */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                  <Mail size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </h2>
              </div>

              <div className="space-y-4">
                <GlassInput
                  label="Current Email"
                  type="email"
                  value={email}
                  disabled
                />

                {!showEmailChange ? (
                  <GlassButton
                    onClick={() => setShowEmailChange(true)}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Change Email
                  </GlassButton>
                ) : (
                  <>
                    <GlassInput
                      label="New Email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                    />
                    <div className="flex gap-3">
                      <GlassButton
                        onClick={handleChangeEmail}
                        disabled={saving || !newEmail}
                        className="flex-1"
                      >
                        {saving ? 'Sending...' : 'Request Change'}
                      </GlassButton>
                      <GlassButton
                        onClick={() => {
                          setShowEmailChange(false)
                          setNewEmail('')
                        }}
                        variant="secondary"
                        className="flex-1"
                        disabled={saving}
                      >
                        Cancel
                      </GlassButton>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>

            {/* Password Change */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                  <Lock size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Password
                </h2>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl glass-input focus:outline-none"
                      style={{ color: 'var(--text-primary)' }}
                      placeholder="Enter current password"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

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
                      disabled={saving}
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
                      Password must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  )}
                </div>

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
                      disabled={saving}
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

                <GlassButton
                  type="submit"
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full sm:w-auto"
                >
                  <Save size={16} className="inline mr-2" />
                  {saving ? 'Updating...' : 'Update Password'}
                </GlassButton>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Shipping Section */}
        {activeSection === 'shipping' && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                <Truck size={24} style={{ color: 'var(--text-primary)' }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Shipping Details
              </h2>
            </div>

            <div className="space-y-4">
              <GlassTextarea
                label="Street Address"
                value={profile.shipping_address || ''}
                onChange={(e) => setProfile({ ...profile, shipping_address: e.target.value })}
                placeholder="Enter your street address"
                rows={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassInput
                  label="City"
                  type="text"
                  value={profile.shipping_city || ''}
                  onChange={(e) => setProfile({ ...profile, shipping_city: e.target.value })}
                  placeholder="City"
                />

                <GlassInput
                  label="State/Province"
                  type="text"
                  value={profile.shipping_state || ''}
                  onChange={(e) => setProfile({ ...profile, shipping_state: e.target.value })}
                  placeholder="State or Province"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassInput
                  label="Postal Code"
                  type="text"
                  value={profile.shipping_postal_code || ''}
                  onChange={(e) => setProfile({ ...profile, shipping_postal_code: e.target.value })}
                  placeholder="Postal Code"
                />

                <GlassInput
                  label="Country"
                  type="text"
                  value={profile.shipping_country || ''}
                  onChange={(e) => setProfile({ ...profile, shipping_country: e.target.value })}
                  placeholder="Country"
                />
              </div>

              <GlassButton
                onClick={handleUpdateShipping}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <Save size={16} className="inline mr-2" />
                {saving ? 'Saving...' : 'Save Shipping Details'}
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  )
}

