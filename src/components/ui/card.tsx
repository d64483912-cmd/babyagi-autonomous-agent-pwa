import * as React from 'react'
import clsx from 'clsx'

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
)

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('flex flex-col space-y-1.5 p-6', className)} {...props} />
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={clsx('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={clsx('text-sm text-muted-foreground', className)} {...props} />
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('p-6 pt-0', className)} {...props} />
)

export default Card
