import * as React from 'react'
import clsx from 'clsx'

export const Alert: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('relative w-full rounded-lg border p-4 text-foreground', className)} role="alert" {...props} />
)

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('text-sm text-muted-foreground', className)} {...props} />
)

export default Alert
