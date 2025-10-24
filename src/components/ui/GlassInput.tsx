/**
 * GlassInput Component
 * 
 * A styled input field component with glassmorphism effect.
 * Used for form inputs throughout the application.
 * 
 * Features:
 * - Optional label
 * - Error message display
 * - Glassmorphism styling
 * - Ref forwarding for form libraries
 * - Smooth transitions
 * - Theme-aware styling
 * 
 * Usage:
 * <GlassInput
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 */

import { InputHTMLAttributes, forwardRef } from 'react'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string    // Label text above input
  error?: string    // Error message to display
}

/**
 * GlassInput component with forwardRef for form libraries
 * Supports all standard HTML input attributes
 */
const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {/* Optional label */}
        {label && (
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        
        {/* Input field */}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 glass-input rounded-xl focus:outline-none
            transition-all duration-300
            ${error ? 'border-red-400/50 focus:ring-red-400/50' : ''}
            ${className}
          `}
          {...props}
        />
        
        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

export default GlassInput
