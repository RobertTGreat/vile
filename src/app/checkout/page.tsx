/**
 * Checkout Page
 * 
 * Checkout page for completing purchases from the shopping basket.
 * Features:
 * - Display all basket items with details
 * - Shipping information form (pre-fills from profile if available)
 * - Order summary with total price
 * - Place order functionality (placeholder for payment integration)
 * - Responsive design with glassmorphism styling
 * 
 * Route: /checkout
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { safeGetUser } from '@/lib/auth-utils'
import { User } from '@supabase/supabase-js'
import { useBasket, BasketItem } from '@/contexts/BasketContext'
import Header from '@/components/layout/Header'
import GlassCard from '@/components/ui/GlassCard'
import GlassButton from '@/components/ui/GlassButton'
import GlassInput from '@/components/ui/GlassInput'
import GlassTextarea from '@/components/ui/GlassTextarea'
import { 
  ShoppingCart, 
  Truck, 
  ArrowLeft,
  Package,
  CreditCard,
  CheckCircle,
  AlertCircle,
  X,
  Eye
} from 'lucide-react'
import Link from 'next/link'

/**
 * Shipping information interface
 */
interface ShippingInfo {
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Get basket state and methods
  const { items, getTotalPrice, clearBasket } = useBasket()
  
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  })
  
  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({})
  
  // Order processing state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')

  /**
   * Effect to fetch user and pre-fill shipping information
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await safeGetUser(supabase)
        setUser(currentUser)
        
        if (currentUser) {
          // Pre-fill email from user account
          setShippingInfo(prev => ({
            ...prev,
            email: currentUser.email || '',
          }))
          
          // Fetch profile data for shipping details
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country')
            .eq('id', currentUser.id)
            .single()
          
          if (profileData) {
            setShippingInfo(prev => ({
              ...prev,
              full_name: profileData.full_name || '',
              address: profileData.shipping_address || '',
              city: profileData.shipping_city || '',
              state: profileData.shipping_state || '',
              postal_code: profileData.shipping_postal_code || '',
              country: profileData.shipping_country || '',
            }))
          }
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  /**
   * Redirect to home if basket is empty
   */
  useEffect(() => {
    if (!loading && items.length === 0 && !orderSuccess) {
      router.push('/')
    }
  }, [items.length, loading, orderSuccess, router])

  /**
   * Validate shipping form
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingInfo, string>> = {}
    
    if (!shippingInfo.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    
    if (!shippingInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!shippingInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (!shippingInfo.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    if (!shippingInfo.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    if (!shippingInfo.state.trim()) {
      newErrors.state = 'State/Province is required'
    }
    
    if (!shippingInfo.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required'
    }
    
    if (!shippingInfo.country.trim()) {
      newErrors.country = 'Country is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  /**
   * Handle place order
   */
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return
    }

    setIsPlacingOrder(true)
    setOrderError('')

    try {
      // TODO: Integrate with payment processor (Stripe, PayPal, etc.)
      // TODO: Create order record in database
      // TODO: Send confirmation email
      
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear basket after successful order
      clearBasket()
      
      setOrderSuccess(true)
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header onAuth={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center" style={{ color: 'var(--text-muted)' }}>
            Loading checkout...
          </div>
        </main>
      </div>
    )
  }

  // Show success message after order is placed
  if (orderSuccess) {
    return (
      <div className="min-h-screen">
        <Header onAuth={() => {}} />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-500/20 border border-green-400/30">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Order Placed Successfully!
            </h1>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Thank you for your purchase. You will receive a confirmation email shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <GlassButton className="w-full sm:w-auto">
                  Continue Shopping
                </GlassButton>
              </Link>
              <Link href="/profile">
                <GlassButton variant="secondary" className="w-full sm:w-auto">
                  View Orders
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        </main>
      </div>
    )
  }

  // Redirect if basket is empty
  if (items.length === 0) {
    return null
  }

  const subtotal = getTotalPrice()
  const shipping: number = 0 // TODO: Calculate shipping based on location
  const total = subtotal + shipping

  return (
    <div className="min-h-screen">
      <Header onAuth={() => {}} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
            Back to Shopping
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Checkout
          </h1>
        </div>

        {/* Error Message */}
        {orderError && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-400/20 flex items-start gap-2">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{orderError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items & Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                  <ShoppingCart size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Order Items ({items.length})
                </h2>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-xl backdrop-blur-md border"
                    style={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border-glass)' }}
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass)' }}>
                          <Package size={20} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        by {item.seller}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          £{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* View Link */}
                    <Link href={`/post/${item.id}`}>
                      <GlassButton size="sm" variant="secondary" className="p-2">
                        <Eye size={16} />
                      </GlassButton>
                    </Link>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Shipping Information */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                  <Truck size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Shipping Information
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassInput
                    label="Full Name"
                    type="text"
                    value={shippingInfo.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    error={errors.full_name}
                    required
                  />
                  <GlassInput
                    label="Email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    error={errors.email}
                    required
                  />
                </div>

                <GlassInput
                  label="Phone Number"
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  error={errors.phone}
                  required
                />

                <GlassTextarea
                  label="Street Address"
                  value={shippingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your street address"
                  rows={3}
                  error={errors.address}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassInput
                    label="City"
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    error={errors.city}
                    required
                  />
                  <GlassInput
                    label="State/Province"
                    type="text"
                    value={shippingInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State or Province"
                    error={errors.state}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassInput
                    label="Postal Code"
                    type="text"
                    value={shippingInfo.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="Postal Code"
                    error={errors.postal_code}
                    required
                  />
                  <GlassInput
                    label="Country"
                    type="text"
                    value={shippingInfo.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                    error={errors.country}
                    required
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-glass-hover)' }}>
                  <CreditCard size={24} style={{ color: 'var(--text-primary)' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    £{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>Shipping</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {shipping === 0 ? 'Free' : `£${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t pt-4" style={{ borderColor: 'var(--border-glass)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Total
                    </span>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      £{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <GlassButton
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || items.length === 0}
                className="w-full"
                size="lg"
              >
                {isPlacingOrder ? 'Processing...' : 'Place Order'}
              </GlassButton>

              <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </p>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}

