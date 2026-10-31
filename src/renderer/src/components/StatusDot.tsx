import type { JobStatus } from '@shared/jobs'
import { cn } from '@/lib/utils'

const tone: Record<JobStatus, string> = {
  queued: 'bg-faint text-faint',
  running: 'bg-accent text-accent animate-pulse-dot',
  stuck: 'bg-stuck text-stuck animate-pulse-dot',
  done: 'bg-success-dot text-success-dot',
  failed: 'bg-danger text-danger',
  cancelled: 'bg-faint text-faint',
}

export function StatusDot({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-full', tone[status], className)}
    />
  )
}
