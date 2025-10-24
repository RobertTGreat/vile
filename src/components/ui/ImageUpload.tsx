'use client'

/**
 * ImageUpload Component
 * 
 * Drag-and-drop image upload component with compression and Supabase storage integration.
 * 
 * Features:
 * - Drag and drop file upload
 * - Image compression before upload
 * - Multiple file support
 * - Progress indication
 * - Image preview with delete option
 * - Supabase storage integration
 * - Maximum file size/limit enforcement
 * 
 * Usage:
 * <ImageUpload
 *   onUploadComplete={(urls) => console.log(urls)}
 *   maxFiles={5}
 * />
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { storageService, UploadResult } from '@/lib/supabase-storage'
import { createClient } from '@/lib/supabase-client'
import GlassButton from './GlassButton'

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void  // Callback with uploaded image URLs
  maxFiles?: number                             // Maximum number of files allowed
  className?: string                            // Additional CSS classes
}

export default function ImageUpload({ onUploadComplete, maxFiles = 5, className = '' }: ImageUploadProps) {
  // State for uploaded images
  const [uploadedImages, setUploadedImages] = useState<UploadResult[]>([])
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const supabase = createClient()

  /**
   * Upload files to Supabase storage
   * Handles authentication and upload process
   * 
   * @param files - Array of File objects to upload
   */
  const uploadToSupabase = async (files: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Upload files to Supabase storage
      const uploadResults = await storageService.uploadMultipleImages(files, user.id)
      
      setUploadedImages(prev => [...prev, ...uploadResults])
      onUploadComplete([...uploadedImages, ...uploadResults].map(result => result.url))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  /**
   * Compress image file before upload
   * Reduces file size while maintaining acceptable quality
   * 
   * @param file - Image file to compress
   * @returns Compressed File object
   */
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      quality: 0.8, // Image quality (0-1)
    }

    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('Image compression failed:', error)
      return file // Return original file if compression fails
    }
  }

  /**
   * Handle file drop from dropzone
   * Compresses images before uploading
   * 
   * @param acceptedFiles - Files accepted by dropzone
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    try {
      // Compress images before upload
      const compressedFiles = await Promise.all(
        acceptedFiles.map(file => compressImage(file))
      )

      // Upload compressed files
      await uploadToSupabase(compressedFiles)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }, [uploadedImages])

  // Configure dropzone with file acceptance and limits
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxFiles - uploadedImages.length,
    disabled: isUploading || uploadedImages.length >= maxFiles
  })

  /**
   * Remove image from upload list
   * Deletes from storage and updates state
   * 
   * @param index - Index of image to remove
   */
  const removeImage = async (index: number) => {
    const imageToRemove = uploadedImages[index]
    
    try {
      // Delete from Supabase storage
      await storageService.deleteImage(imageToRemove.path)
      
      // Update local state
      const newImages = uploadedImages.filter((_, i) => i !== index)
      setUploadedImages(newImages)
      onUploadComplete(newImages.map(result => result.url))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image: ' + (error as Error).message)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-purple-400 bg-purple-500/10' : 'border-white/20 hover:border-white/40'}
          ${isUploading || uploadedImages.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ 
          borderColor: isDragActive ? 'var(--border-glass)' : 'var(--border-glass)',
          backgroundColor: isDragActive ? 'var(--bg-glass-hover)' : 'transparent'
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Uploading... {uploadProgress}%
              </p>
            </>
          ) : (
            <>
              <Upload size={32} style={{ color: 'var(--text-muted)' }} />
              <div>
                <p style={{ color: 'var(--text-primary)' }}>
                  {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                </p>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                  or click to select files
                </p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                  Max {maxFiles} files, up to 4MB each
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedImages.map((result, index) => (
            <div key={index} className="relative group">
              <img
                src={result.url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
