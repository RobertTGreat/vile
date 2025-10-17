import { createClient } from '@/lib/supabase-client'

export interface UploadResult {
  url: string
  path: string
}

export class SupabaseStorageService {
  private supabase = createClient()
  private bucketName = 'post-images'

  async uploadImage(file: File, userId: string): Promise<UploadResult> {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName)

    return {
      url: publicUrl,
      path: data.path
    }
  }

  async uploadMultipleImages(files: File[], userId: string): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, userId))
    return Promise.all(uploadPromises)
  }

  async deleteImage(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  async deleteMultipleImages(paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove(paths)

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }
}

export const storageService = new SupabaseStorageService()
