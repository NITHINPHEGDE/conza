import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  ...props
}) {
  const variants = {
    primary: 'bg-accentYellow text-white hover:bg-accentAmber',
    secondary: 'bg-surfaceElevated text-textPrimary hover:bg-border',
    outline: 'border border-border bg-transparent text-textPrimary hover:bg-surfaceElevated',
    danger: 'bg-danger text-white hover:bg-red-600',
    ghost: 'bg-transparent text-textSecondary hover:bg-surfaceElevated hover:text-textPrimary',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
