'use client'

/**
 * BasketModal Component
 * 
 * Shopping cart modal that displays items added to the basket.
 * Slide-out panel showing cart contents and checkout options.
 * 
 * Features:
 * - Display basket items with thumbnails
 * - Remove individual items
 * - Clear entire cart
 * - Calculate total price
 * - Empty state with call-to-action
 * - Checkout button (placeholder for future implementation)
 * 
 * Usage:
 * <BasketModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBasket } from '@/contexts/BasketContext'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import { X, ShoppingCart, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

interface BasketModalProps {
  isOpen: boolean    // Controls modal visibility
  onClose: () => void  // Close modal callback
}

export default function BasketModal({ isOpen, onClose }: BasketModalProps) {
  // Get basket state and methods from context
  const { items, removeFromBasket, clearBasket, getTotalPrice, getItemCount } = useBasket()
  const router = useRouter()

  // Don't render if modal is closed
  if (!isOpen) return null

  /**
   * Handle checkout process
   * Navigates to checkout page
   */
  const handleCheckout = () => {
    onClose()
    router.push('/checkout')
  }

  return (
    <div className="fixed top-[72px] right-5 w-full sm:w-96 z-30">
      <GlassCard
        className="rounded-l-2xl w-full flex flex-col overflow-hidden max-h-[calc(100vh-4rem)] backdrop-blur-md border"
        style={{
          backgroundColor: 'var(--bg-glass)',
          borderColor: 'var(--border-glass)'
        }}
      >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b backdrop-blur-md" style={{ borderColor: 'var(--border-glass)', backgroundColor: 'var(--bg-glass)' }}>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ShoppingCart size={18} />
              <span>Cart</span>
              {getItemCount() > 0 && (
                <span className="text-xs font-normal px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
                  {getItemCount()}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center backdrop-blur-md border" style={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border-glass)' }}>
                  <ShoppingCart size={20} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Your cart is empty
                </h3>
                <p style={{ color: 'var(--text-muted)' }} className="mb-6 text-sm">
                  Add some items to get started
                </p>
                <Link href="/search">
                  <GlassButton onClick={onClose} className="w-full">
                    Browse Items
                  </GlassButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl backdrop-blur-md border"
                    style={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border-glass)' }}
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass)' }}>
                          <ShoppingCart size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                        by {item.seller}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          £{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Link href={`/post/${item.id}`}>
                        <GlassButton size="sm" variant="secondary" className="p-1">
                          <Eye size={12} />
                        </GlassButton>
                      </Link>
                      <button
                        onClick={() => removeFromBasket(item.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 backdrop-blur-md" style={{ borderColor: 'var(--border-glass)', backgroundColor: 'var(--bg-glass)' }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total:
                </span>
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  £{getTotalPrice().toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <GlassButton
                  onClick={handleCheckout}
                  className="w-full"
                >
                  Checkout
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={clearBasket}
                  className="w-full"
                >
                  Clear Cart
                </GlassButton>
              </div>
            </div>
          )}
      </GlassCard>
    </div>
  )
}
