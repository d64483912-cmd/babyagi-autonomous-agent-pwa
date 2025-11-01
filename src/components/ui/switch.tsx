import * as React from 'react'
import clsx from 'clsx'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, onCheckedChange, checked, ...props }, ref) => {
  return (
    <label className={clsx('inline-flex items-center cursor-pointer', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div className="w-10 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors relative">
        <div className="absolute left-0.5 top-0.5 h-5 w-5 bg-background rounded-full transition-transform peer-checked:translate-x-4 shadow" />
      </div>
    </label>
  )
})
Switch.displayName = 'Switch'

export default Switch
