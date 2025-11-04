/**
 * GlassCard Component
 * 
 * A container component with glassmorphism styling.
 * Used to wrap content sections throughout the application.
 * 
 * Features:
 * - Glassmorphism background and border
 * - Optional click handler
 * - Ref forwarding support
 * - Custom className support
 * - Rounded corners and shadow
 * 
 * Usage:
 * <GlassCard className="p-6">
 *   Content here
 * </GlassCard>
 */

import { ReactNode, forwardRef } from 'react'

interface GlassCardProps {
  children: ReactNode      // Card content
  className?: string       // Additional CSS classes
  onClick?: () => void     // Optional click handler
  style?: React.CSSProperties // Optional inline styles
}

/**
 * GlassCard component with forwardRef for ref access
 * Renders a div with glassmorphism styling
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', onClick, style }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          glass-card rounded-2xl shadow-xl
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
        style={style}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export default GlassCard
