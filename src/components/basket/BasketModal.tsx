'use client'

import { useState } from 'react'
import { useBasket } from '@/contexts/BasketContext'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import { X, ShoppingCart, Trash2, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface BasketModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BasketModal({ isOpen, onClose }: BasketModalProps) {
  const { items, removeFromBasket, clearBasket, getTotalPrice, getItemCount } = useBasket()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  if (!isOpen) return null

  const handleCheckout = () => {
    setIsCheckingOut(true)
    // TODO: Implement checkout flow
    setTimeout(() => {
      setIsCheckingOut(false)
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShoppingCart size={24} />
            Basket ({getItemCount()})
          </h2>
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

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
              <ShoppingCart size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Your basket is empty
            </h3>
            <p style={{ color: 'var(--text-muted)' }} className="mb-4">
              Add some items to get started
            </p>
            <Link href="/search">
              <GlassButton onClick={onClose}>
                Browse Items
              </GlassButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-glass)' }}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
                      <ShoppingCart size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    by {item.seller}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign size={14} style={{ color: 'var(--text-primary)' }} />
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/post/${item.id}`}>
                    <GlassButton size="sm" variant="secondary">
                      View
                    </GlassButton>
                  </Link>
                  <button
                    onClick={() => removeFromBasket(item.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4" style={{ borderColor: 'var(--border-glass)' }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total:
                </span>
                <span className="text-xl font-bold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  <DollarSign size={20} />
                  {getTotalPrice().toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3">
                <GlassButton
                  variant="secondary"
                  onClick={clearBasket}
                  className="flex-1"
                >
                  Clear Basket
                </GlassButton>
                <GlassButton
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="flex-1"
                >
                  {isCheckingOut ? 'Processing...' : 'Checkout'}
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
