import { forwardRef, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-warm-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full px-3 py-2.5 rounded-lg border bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow',
            error
              ? 'border-danger-400 focus:ring-danger-400'
              : 'border-warm-200 focus:ring-primary-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
