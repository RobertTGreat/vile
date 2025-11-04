'use client'

/**
 * ProfileEditModal Component
 * 
 * Modal for editing user profile information including:
 * - Username
 * - Full name
 * - Profile picture (avatar)
 * 
 * Features:
 * - Profile picture upload with preview
 * - Username validation
 * - Full name editing
 * - Image compression before upload
 * - Delete old avatar when uploading new one
 * 
 * Usage:
 * <ProfileEditModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onProfileUpdated={handleProfileUpdated}
 * />
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import { useDropzone } from 'react-dropzone'
import { Upload, X, User as UserIcon, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { storageService } from '@/lib/supabase-storage'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdated: () => void
}

interface ProfileData {
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function ProfileEditModal({ isOpen, onClose, onProfileUpdated }: ProfileEditModalProps) {
  // Form state
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  const [error, setError] = useState('')
  const [oldAvatarPath, setOldAvatarPath] = useState<string | null>(null)
  
  const supabase = createClient()

  /**
   * Fetch current profile data when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    } else {
      // Reset form when modal closes
      setUsername('')
      setFullName('')
      setAvatarUrl(null)
      setAvatarFile(null)
      setAvatarPreview(null)
      setOldAvatarPath(null)
      setError('')
    }
  }, [isOpen])

  /**
   * Fetch user profile from database
   */
  const fetchProfile = async () => {
    setFetchingProfile(true)
    setError('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      setUsername(data?.username || '')
      setFullName(data?.full_name || '')
      setAvatarUrl(data?.avatar_url || null)
      setAvatarPreview(data?.avatar_url || '/defaultPFP.png')
      
      // Extract path from avatar_url if it exists
      // Supabase storage URLs format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
      if (data?.avatar_url) {
        try {
          const url = new URL(data.avatar_url)
          const pathParts = url.pathname.split('/')
          const avatarsIndex = pathParts.findIndex(part => part === 'avatars')
          if (avatarsIndex !== -1 && avatarsIndex < pathParts.length - 1) {
            // Get everything after 'avatars' in the path
            const path = pathParts.slice(avatarsIndex + 1).join('/')
            setOldAvatarPath(path)
          }
        } catch {
          // If URL parsing fails, we'll just upload without deleting old one
          console.warn('Could not extract path from avatar URL')
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load profile')
    } finally {
      setFetchingProfile(false)
    }
  }

  /**
   * Compress image file before upload
   */
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5, // Smaller for profile pictures
      maxWidthOrHeight: 512, // Profile pictures don't need to be huge
      useWebWorker: true,
      quality: 0.8,
    }

    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('Image compression failed:', error)
      return file
    }
  }

  /**
   * Handle file drop from dropzone
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // Compress image
      const compressedFile = await compressImage(file)
      setAvatarFile(compressedFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
      
      setError('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  /**
   * Remove selected avatar
   */
  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(avatarUrl || '/defaultPFP.png')
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      let finalAvatarUrl = avatarUrl

      // Upload new avatar if one was selected
      if (avatarFile) {
        // Delete old avatar if it exists
        if (oldAvatarPath) {
          try {
            await storageService.deleteAvatar(oldAvatarPath)
          } catch (deleteError) {
            // Non-fatal error, continue with upload
            console.warn('Failed to delete old avatar:', deleteError)
          }
        }

        // Upload new avatar
        const uploadResult = await storageService.uploadAvatar(avatarFile, user.id)
        finalAvatarUrl = uploadResult.url
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || null,
          full_name: fullName.trim() || null,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      onProfileUpdated()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Don't render if modal is closed
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" style={{ backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}>
        <div className="flex items-center justify-between p-4 -m-6 mb-6 border-b backdrop-blur-md" style={{ borderColor: 'var(--border-glass)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={24} />
          </button>
        </div>

        {fetchingProfile ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-primary)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Profile Picture
              </label>
              
              {/* Current/Preview Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20">
                  <img
                    src={avatarPreview || '/defaultPFP.png'}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  {avatarFile ? (
                    <div className="flex items-center gap-2">
                      <GlassButton
                        type="button"
                        variant="secondary"
                        onClick={handleRemoveAvatar}
                        className="text-sm"
                      >
                        Remove
                      </GlassButton>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className="cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-colors hover:bg-white/5"
                      style={{ borderColor: isDragActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}
                    >
                      <input {...getInputProps()} />
                      <Upload size={20} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Username Input */}
            <GlassInput
              label="Username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
            />

            {/* Full Name Input */}
            <GlassInput
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
            />

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-400/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </GlassButton>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  )
}

