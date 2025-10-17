'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassButton from '@/components/ui/GlassButton'
import UserMenu from '@/components/auth/UserMenu'
import ThemeSelector from '@/components/ui/ThemeSelector'
import { useSearch } from '@/contexts/SearchContext'
import { useBasket } from '@/contexts/BasketContext'
import { useCreatePost } from '@/contexts/CreatePostContext'
import BasketModal from '@/components/basket/BasketModal'
import UniversalCreatePostModal from '@/components/posts/UniversalCreatePostModal'
import { ShoppingBag, User as UserIcon, Search, ShoppingCart, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onAuth: (mode: 'signin' | 'signup') => void
}

export default function Header({ onAuth }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBasketOpen, setIsBasketOpen] = useState(false)
  const { searchTerm, setSearchTerm } = useSearch()
  const { getItemCount } = useBasket()
  const { openModal: openCreatePost } = useCreatePost()
  const router = useRouter()
  const supabase = createClient()

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push('/search')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border-glass)' }}>
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass)' }}>
                  <ShoppingBag size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Repacked</h1>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block">
              <div className="w-80 transition-all duration-300 focus-within:w-96">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300" size={20} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 glass-input rounded-xl focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20"
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Mobile Search Button */}
              <Link href="/search" className="sm:hidden">
                <GlassButton className="p-2">
                  <Search size={20} style={{ color: 'var(--text-primary)' }} />
                </GlassButton>
              </Link>

              <ThemeSelector />
              
              {/* Create Post Button */}
              <GlassButton
                onClick={openCreatePost}
                className="flex items-center gap-2 px-3 py-2"
              >
                <Plus size={16} />
                <span className="hidden md:inline">Create Post</span>
              </GlassButton>
              
              {/* Basket Button */}
              <button
                onClick={() => setIsBasketOpen(true)}
                className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-primary)' }}
              >
                <ShoppingCart size={20} />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
              
              {loading ? (
                <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-3">
                  <GlassButton
                    variant="ghost"
                    onClick={() => onAuth('signin')}
                    className="flex items-center space-x-2"
                  >
                    <UserIcon size={18} />
                    <span>Sign In</span>
                  </GlassButton>
                  <GlassButton onClick={() => onAuth('signup')}>
                    Get Started
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <BasketModal 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)} 
      />
      
      <UniversalCreatePostModal />
    </>
  )
}
