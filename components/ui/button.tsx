// components/ui/button.tsx — Reusable Button component
'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500 shadow-sm',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 focus-visible:ring-indigo-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm',
}

const SIZES = {
  sm: 'px-3 py-2 text-xs rounded-lg',
  md: 'px-5 py-3 text-sm rounded-xl',
  lg: 'px-6 py-4 text-base rounded-xl',
}

export default function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        fullWidth ? 'w-full' : '',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg
          aria-hidden
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
