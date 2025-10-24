'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import GlassTextarea from '@/components/ui/GlassTextarea'
import GlassSelect from '@/components/ui/GlassSelect'
import ImageUpload from '@/components/ui/ImageUpload'
import { X, Save, Plus, XCircle, Trash2 } from 'lucide-react'

interface Post {
  id: string
  title: string
  description: string
  price: number | null
  condition: string | null
  category: string | null
  location: string | null
  image_urls: string[] | null
  created_at: string
  is_sold: boolean
  post_tags: Array<{
    tags: {
      id: string
      name: string
      color: string
    }
  }>
}

interface EditPostModalProps {
  post: Post | null
  isOpen: boolean
  onClose: () => void
  onPostUpdated: () => void
}

export default function EditPostModal({ post, isOpen, onClose, onPostUpdated }: EditPostModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category: '',
    location: '',
    image_urls: [] as string[]
  })
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string, color: string}>>([])
  const [selectedTags, setSelectedTags] = useState<Array<{id: string, name: string, color: string}>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    const getTags = async () => {
      const { data } = await supabase.from('tags').select('*')
      if (data) setAvailableTags(data)
    }

    if (isOpen && post) {
      getUser()
      getTags()
      
      // Reset form state and populate with post data
      setEditForm({
        title: post.title,
        description: post.description,
        price: post.price?.toString() || '',
        condition: post.condition || '',
        category: post.category || '',
        location: post.location || '',
        image_urls: post.image_urls ? [...post.image_urls] : []
      })
      setSelectedTags(post.post_tags.map(pt => pt.tags))
      setError('')
    } else if (!isOpen) {
      // Reset form when modal closes
      setEditForm({
        title: '',
        description: '',
        price: '',
        condition: '',
        category: '',
        location: '',
        image_urls: []
      })
      setSelectedTags([])
      setError('')
    }
  }, [isOpen, post?.id, supabase])

  const handleSaveEdit = async () => {
    if (!post || !user) return

    setLoading(true)
    setError('')

    try {
      // Update post
      const { error: postError } = await supabase
        .from('posts')
        .update({
          title: editForm.title,
          description: editForm.description,
          price: editForm.price ? parseFloat(editForm.price) : null,
          condition: editForm.condition || null,
          category: editForm.category || null,
          location: editForm.location || null,
          image_urls: editForm.image_urls.length > 0 ? editForm.image_urls : null,
        })
        .eq('id', post.id)

      if (postError) throw postError

      // Update tags
      const { error: deleteTagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', post.id)

      if (deleteTagsError) throw deleteTagsError

      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          post_id: post.id,
          tag_id: tag.id
        }))

        const { error: insertTagsError } = await supabase
          .from('post_tags')
          .insert(tagInserts)

        if (insertTagsError) throw insertTagsError
      }

      onPostUpdated()
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = (urls: string[]) => {
    setEditForm(prev => ({ 
      ...prev, 
      image_urls: [...prev.image_urls, ...urls] 
    }))
  }

  const addTag = (tag: {id: string, name: string, color: string}) => {
    setSelectedTags(prev => {
      if (!prev.find(t => t.id === tag.id)) {
        return [...prev, tag]
      }
      return prev
    })
  }

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId))
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Post</h2>
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

        <div className="space-y-4">
          <GlassInput
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            placeholder="What are you selling?"
            required
          />

          <GlassTextarea
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
            placeholder="Describe your item..."
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Price"
              type="number"
              step="0.01"
              value={editForm.price}
              onChange={(e) => setEditForm({...editForm, price: e.target.value})}
              placeholder="0.00"
            />

            <GlassSelect
              label="Condition"
              value={editForm.condition || ''}
              onChange={(value) => setEditForm({...editForm, condition: value})}
              placeholder="Select condition"
              options={[
                { value: '', label: 'Any' },
                { value: 'new', label: 'New' },
                { value: 'like_new', label: 'Like New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Category"
              value={editForm.category}
              onChange={(e) => setEditForm({...editForm, category: e.target.value})}
              placeholder="e.g., Electronics, Clothing"
            />

            <GlassInput
              label="Location"
              value={editForm.location}
              onChange={(e) => setEditForm({...editForm, location: e.target.value})}
              placeholder="City, State"
            />
          </div>

          {/* Current Images */}
          {editForm.image_urls.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {editForm.image_urls.map((url, index) => (
                  <div key={`current-image-${index}`} className="relative group">
                    <img
                      src={url}
                      alt={`Current ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Add More Images
            </label>
            <ImageUpload
              onUploadComplete={handleImageUpload}
              maxFiles={5 - editForm.image_urls.length}
              className="mb-4"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tag, index) => (
                <span
                  key={`selected-${tag.id}-${index}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="hover:bg-black/20 rounded-full p-0.5"
                  >
                    <XCircle size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter(tag => !selectedTags.find(t => t.id === tag.id))
                .map((tag, index) => (
                  <button
                    key={`available-${tag.id}-${index}`}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors"
                    style={{ borderColor: 'var(--border-glass)', color: tag.color }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--bg-glass-hover)'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <Plus size={14} />
                    {tag.name}
                  </button>
                ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <GlassButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleSaveEdit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
