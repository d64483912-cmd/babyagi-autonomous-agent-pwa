import * as React from 'react'
import clsx from 'clsx'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variant === 'default' && 'bg-primary text-primary-foreground border-transparent',
      variant === 'secondary' && 'bg-secondary text-secondary-foreground border-transparent',
      variant === 'outline' && 'border-border text-foreground',
      variant === 'destructive' && 'bg-red-600 text-white border-transparent',
      className
    )}
    {...props}
  />
)

export default Badge
