import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white shadow-card hover:bg-accent-hover',
        secondary:
          'border border-control-line bg-surface text-ink shadow-card hover:bg-surface-2 hover:border-faint',
        ghost: 'text-ink hover:bg-ink/6',
        subtle: 'bg-ink/5 text-ink hover:bg-ink/9',
        warning: 'bg-stuck text-white hover:brightness-110',
        danger: 'text-danger hover:bg-danger-soft',
      },
      size: {
        sm: 'h-8 rounded-[7px] px-3 text-[13px]',
        md: 'h-9 rounded-control px-3.5 text-[13.5px]',
        lg: 'h-11 rounded-control px-[18px] text-sm',
        icon: 'size-8 rounded-[7px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants }
