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
 * - Hamburger menu that expands/collapses
 * - Centered search bar on mobile
 * - Create post button moved to mobile menu
 * - Simplified action buttons (icon-only on mobile)
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
import { ShoppingBag, User as UserIcon, Search, ShoppingCart, Plus, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeSelector from '@/components/ui/ThemeSelector'

interface HeaderProps {
  onAuth: (mode: 'signin' | 'signup') => void
}

export default function Header({ onAuth }: HeaderProps) {
  // User authentication state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Modal and menu states
  const [isBasketOpen, setIsBasketOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
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
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Left: Logo and Mobile Menu */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-primary)' }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link href="/" className="hidden md:flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass)' }}>
                  <ShoppingBag size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Repacked</h1>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="absolute left-1/2 transform -translate-x-1/2 sm:-translate-x-[40%] md:-translate-x-1/2 hidden sm:block">
              <div className="w-64 sm:w-80 transition-all duration-300 focus-within:w-72 sm:focus-within:w-96">
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

            {/* Mobile Search Bar - Centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2 sm:hidden">
              <div className="w-[180px]">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 glass-input rounded-lg focus:outline-none text-sm"
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              {/* Theme Switcher */}
              <ThemeSelector />
              {/* Create Post Button - Icon Only */}
              <GlassButton
                onClick={openCreatePost}
                className="hidden sm:flex p-2"
                title="Create Post"
              >
                <Plus size={20} style={{ color: 'var(--text-primary)' }} />
              </GlassButton>
              
              {/* Basket Button */}
              <button
                onClick={() => setIsBasketOpen(true)}
                className="relative p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-primary)' }}
                title="Basket"
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
                <GlassButton
                  variant="ghost"
                  onClick={() => onAuth('signin')}
                  className="p-2"
                  title="Sign In"
                >
                  <UserIcon size={20} style={{ color: 'var(--text-primary)' }} />
                </GlassButton>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu - Only visible on mobile devices (md:hidden) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'var(--border-glass)' }}>
            <div className="px-4 py-4 space-y-3">
              {/* User Actions - Display when user is NOT logged in */}
              {!loading && !user && (
                <div className="flex flex-col gap-3">
                  {/* Theme Switcher */}
                  <ThemeSelector />
                  <div className="flex gap-3">
                    <GlassButton
                      onClick={() => {
                        onAuth('signin')
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex-1 justify-center"
                    >
                      Sign In
                    </GlassButton>
                    <GlassButton
                      onClick={() => {
                        openCreatePost()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex-1 justify-center flex items-center gap-2"
                    >
                      <Plus size={18} />
                      <span>Create Post</span>
                    </GlassButton>
                  </div>
                  <GlassButton
                    onClick={() => {
                      onAuth('signup')
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-center"
                  >
                    Get Started
                  </GlassButton>
                </div>
              )}

              {/* User Links - Display when user IS logged in */}
              {user && (
                <div className="flex flex-col space-y-2">
                  {/* Theme Switcher */}
                  <ThemeSelector />
                  {/* Create Post button with icon */}
                  <GlassButton
                    onClick={() => {
                      openCreatePost()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-center"
                  >
                    <Plus size={18} className="mr-2" />
                    Create Post
                  </GlassButton>
                  {/* Link to user's posts page */}
                  <Link href="/my-posts" onClick={() => setIsMobileMenuOpen(false)}>
                    <GlassButton variant="ghost" className="w-full justify-start">
                      My Posts
                    </GlassButton>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Shopping basket modal - displays items in user's cart */}
      <BasketModal 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)} 
      />
      
      {/* Universal create post modal - can be opened from anywhere */}
      <UniversalCreatePostModal />
    </>
  )
}
