import * as React from 'react'
import clsx from 'clsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          variant === 'link' && 'text-primary underline-offset-4 hover:underline',
          size === 'sm' && 'h-8 px-3',
          size === 'md' && 'h-9 px-4',
          size === 'lg' && 'h-10 px-6',
          size === 'icon' && 'h-9 w-9',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export default Button
