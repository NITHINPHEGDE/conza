import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-textSecondary mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all ${error ? 'border-danger focus:ring-danger/50 focus:border-danger' : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
