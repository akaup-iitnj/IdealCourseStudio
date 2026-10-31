import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      spellCheck={false}
      className={cn(
        'h-11 w-full min-w-0 rounded-control border border-control-line bg-surface px-3 text-sm text-ink transition-[border-color,box-shadow] placeholder:text-faint',
        'focus-visible:border-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/20',
        'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-faint',
        className,
      )}
      {...props}
    />
  )
}
