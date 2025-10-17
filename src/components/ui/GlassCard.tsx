import { ReactNode, forwardRef } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', onClick }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          glass-card rounded-2xl shadow-xl
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export default GlassCard
