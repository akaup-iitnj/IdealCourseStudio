import * as React from 'react'
import { cn } from '@/lib/utils'

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn('text-[13px] font-semibold text-ink', className)}
      {...props}
    />
  )
}
