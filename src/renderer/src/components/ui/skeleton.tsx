import * as React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--line-soft)_25%,var(--line)_50%,var(--line-soft)_75%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}
