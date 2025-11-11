'use client'

/**
 * Header Component
 * 
 * The main navigation header for the application. Features:
 * - Responsive design with mobile navigation menu
 * - User authentication status management
 * - Search functionality
 * - Shopping basket with item count
 * - Create post functionality
 * - Theme-aware glassmorphism styling
 * 
 * Mobile-specific features:
 * - Logo visible on all screen sizes
 * - Centered search bar on mobile
 * - Simplified action buttons (icon-only on mobile)
 * - Create post button in profile dropdown
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import GlassButton from '@/components/ui/GlassButton'
import UserMenu from '@/components/auth/UserMenu'
import { useSearch } from '@/contexts/SearchContext'
import { useBasket } from '@/contexts/BasketContext'
import { useCreatePost } from '@/contexts/CreatePostContext'
import BasketModal from '@/components/basket/BasketModal'
import UniversalCreatePostModal from '@/components/posts/UniversalCreatePostModal'
import MessagePopup from '@/components/messages/MessagePopup'
import { User as UserIcon, Search, ShoppingCart, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onAuth: (mode: 'signin' | 'signup') => void
}

export default function Header({ onAuth }: HeaderProps) {
  // User authentication state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isBasketOpen, setIsBasketOpen] = useState(false)
  
  // Context hooks for global state
  const { searchTerm, setSearchTerm } = useSearch()
  const { getItemCount } = useBasket()
  const { openModal: openCreatePost } = useCreatePost()
  
  // Next.js router for navigation
  const router = useRouter()
  const supabase = createClient()

  /**
   * Effect hook to manage user authentication state
   * - Fetches current user on mount
   * - Subscribes to auth state changes (login/logout)
   * - Unsubscribes on unmount to prevent memory leaks
   */
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

  /**
   * Handle search form submission
   * Navigates to search page with the current search term
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push('/search')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border-glass)' }}>
        <div className="w-full px-3 sm:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between w-full">
            {/* Left: Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2 lg:space-x-3 hover:opacity-80 transition-opacity flex-shrink-0">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg-glass)' }}>
                  <Image 
                    src="/repackedlogo.png" 
                    alt="Repacked Logo" 
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="hidden md:block text-xl lg:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Repacked</h1>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="absolute left-1/2 transform -translate-x-1/2 sm:-translate-x-[40%] md:-translate-x-1/2 hidden sm:block">
              <div className="w-56 sm:w-64 md:w-72 lg:w-80 transition-all duration-300 focus-within:w-64 sm:focus-within:w-72 md:focus-within:w-80 lg:focus-within:w-96">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300" size={20} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 md:py-3 glass-input rounded-xl focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20 text-sm md:text-base"
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Mobile Search Bar - Always visible */}
            <div className="absolute left-1/2 transform -translate-x-1/2 sm:hidden z-10">
              <div className="w-[200px] xs:w-[220px]">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 glass-input rounded-lg focus:outline-none text-sm"
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 lg:space-x-4 flex-shrink-0">
              {/* Basket Button */}
              <button
                onClick={() => setIsBasketOpen(!isBasketOpen)}
                className="relative p-1.5 md:p-2 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0 mr-1 sm:mr-2 md:mr-3 lg:mr-5"
                style={{ color: 'var(--text-primary)' }}
                title="Basket"
              >
                <ShoppingCart size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-purple-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
              
              {loading ? (
                <div className="w-6 h-6 sm:w-7 md:w-8 bg-white/20 rounded-full animate-pulse flex-shrink-0" />
              ) : user ? (
                <div className="flex-shrink-0 mr-1 sm:mr-2 md:mr-3 lg:mr-5">
                  <UserMenu />
                </div>
              ) : (
                <GlassButton
                  variant="ghost"
                  onClick={() => onAuth('signin')}
                  className="p-1.5 sm:p-1.5 md:p-2 flex-shrink-0"
                  title="Sign In"
                >
                  <UserIcon size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" style={{ color: 'var(--text-primary)' }} />
                </GlassButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Shopping basket modal - displays items in user's cart */}
      <BasketModal 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)} 
      />
      
      {/* Universal create post modal - can be opened from anywhere */}
      <UniversalCreatePostModal />
      
      {/* Message popup - appears from bottom right */}
      <MessagePopup />
    </>
  )
}
