/**
 * GlassTextarea Component
 * 
 * A styled textarea component with glassmorphism effect.
 * Used for multi-line text input throughout the application.
 * 
 * Features:
 * - Optional label
 * - Error message display
 * - Glassmorphism styling
 * - Ref forwarding for form libraries
 * - Non-resizable by default
 * - Smooth transitions
 * - Theme-aware styling
 * 
 * Usage:
 * <GlassTextarea
 *   label="Description"
 *   placeholder="Enter description"
 *   rows={4}
 *   error={errors.description}
 * />
 */

import { TextareaHTMLAttributes, forwardRef } from 'react'

interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string    // Label text above textarea
  error?: string    // Error message to display
}

/**
 * GlassTextarea component with forwardRef for form libraries
 * Supports all standard HTML textarea attributes
 */
const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {/* Optional label */}
        {label && (
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        
        {/* Textarea field */}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 glass-input rounded-xl focus:outline-none
            transition-all duration-300 resize-none
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

GlassTextarea.displayName = 'GlassTextarea'

export default GlassTextarea
