// components/ui/input.tsx — Reusable Input component
'use client'

import { forwardRef, useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?:  string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-1.5 relative">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>

        <div className="relative group">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={[
              'w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none',
              'placeholder:text-gray-400',
              'transition-all duration-150',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              error
                ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
                : 'border-gray-200 bg-white hover:border-gray-300',
              isPassword ? 'pr-12' : '',
              type === 'date' 
                ? 'cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:cursor-pointer [&::-webkit-datetime-edit-fields-wrapper]:cursor-pointer [&::-webkit-datetime-edit-text]:cursor-pointer [&::-webkit-datetime-edit-month-field]:cursor-pointer [&::-webkit-datetime-edit-day-field]:cursor-pointer [&::-webkit-datetime-edit-year-field]:cursor-pointer' 
                : '',
              className,
            ].join(' ')}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-0 bottom-0 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors z-10 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
                  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
                  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-500 flex items-center gap-1">
            <span aria-hidden>⚠</span> {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
