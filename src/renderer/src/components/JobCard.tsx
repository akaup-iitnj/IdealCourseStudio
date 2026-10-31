import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, CircleCheck, RotateCcw, Square, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import type { JobSnapshot } from '@shared/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/StatusDot'
import { formatAgo, formatDuration } from '@/lib/format'
import { useNow } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useApp } from '@/stores/app'

const STATUS_LABEL: Record<JobSnapshot['status'], string> = {
  queued: 'Waiting',
  running: 'Working',
  stuck: 'Stuck',
  done: 'Done',
  failed: 'Stopped with a problem',
  cancelled: 'Stopped',
}

const STATUS_TONE = {
  queued: 'neutral',
  running: 'live',
  stuck: 'stuck',
  done: 'done',
  failed: 'danger',
  cancelled: 'neutral',
} as const

/**
 * Honest live progress: step, item, elapsed, time left (only once measurable), last update N s ago,
 * and an orange stuck state with the reason after 60 s of silence.
 */
export function JobCard({ job }: { job: JobSnapshot }) {
  const now = useNow(1000)
  const [showLog, setShowLog] = useState(false)
  const { cancelJob, retryJob, dismissJob } = useApp.getState()
  const live = job.status === 'running' || job.status === 'stuck'
  const end = job.finishedAt ?? now
  const elapsed = job.startedAt ? (end - job.startedAt) / 1000 : 0
  const pct = job.page != null && job.of ? Math.min(100, (job.page / job.of) * 100) : null
  const stuck = job.status === 'stuck'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      data-testid="job-card"
      data-status={job.status}
    >
      <Card className={cn('overflow-hidden transition-colors', stuck && 'border-stuck/60')}>
        <div className="flex items-start gap-3 px-5 pt-4">
          <StatusDot status={job.status} className="mt-1.5" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{job.title}</span>
              <Badge tone={STATUS_TONE[job.status]} data-testid="job-status">
                {STATUS_LABEL[job.status]}
              </Badge>
            </div>
            <span className="truncate text-[13px] text-muted" data-testid="job-message">
              {job.message}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {live && (
              <Button size="sm" variant="ghost" onClick={() => void cancelJob(job.id)}>
                <Square /> Stop
              </Button>
            )}
            {!live && (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Dismiss"
                onClick={() => void dismissJob(job.id)}
              >
                <X />
              </Button>
            )}
          </div>
        </div>

        {/* Real progress only: no bar until the helper tells us page N of M. */}
        <div className="px-5 pt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
            {pct != null ? (
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  stuck ? 'bg-stuck' : job.status === 'done' ? 'bg-success-dot' : 'bg-accent',
                )}
                initial={false}
                animate={{ width: `${job.status === 'done' ? 100 : pct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 24 }}
              />
            ) : live ? (
              <div className="animate-shimmer h-full w-full bg-[linear-gradient(90deg,transparent_25%,color-mix(in_srgb,var(--accent)_35%,transparent)_50%,transparent_75%)] bg-[length:200%_100%]" />
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-5 pt-3 pb-4 text-[12.5px] sm:grid-cols-5">
          <Meta label="Step" value={job.step ?? '—'} />
          <Meta
            label="Item"
            value={
              job.page != null && job.of != null
                ? `${job.chapter ? `${job.chapter} · ` : ''}${job.page} of ${job.of}`
                : (job.chapter ?? '—')
            }
            mono
          />
          <Meta label="Elapsed" value={formatDuration(elapsed)} mono />
          <Meta
            label="Time left"
            value={
              job.status === 'done'
                ? 'None'
                : live && job.etaSeconds != null && !stuck
                  ? `about ${formatDuration(job.etaSeconds)}`
                  : live
                    ? 'Measuring…'
                    : '—'
            }
            mono
          />
          <Meta
            label="Last update"
            value={job.lastLineAt ? formatAgo(job.lastLineAt, live ? now : end) : '—'}
            mono
            warn={stuck}
            testId="job-last-update"
          />
        </dl>

        <AnimatePresence initial={false}>
          {stuck && job.stuckReason && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-5 mb-4 flex items-start gap-3 rounded-[10px] bg-stuck-soft px-4 py-3 text-stuck-ink">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-semibold">This looks stuck</span>
                  <span className="text-[13px]" data-testid="job-stuck-reason">
                    {job.stuckReason}
                  </span>
                </div>
                <Button size="sm" variant="warning" onClick={() => void retryJob(job.id)}>
                  <RotateCcw /> Retry
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {job.status === 'failed' && (
          <div className="mx-5 mb-4 flex items-center gap-3 rounded-[10px] bg-danger-soft px-4 py-3 text-danger">
            <TriangleAlert className="size-4 shrink-0" />
            <span className="flex-1 text-[13px]">{job.message}</span>
            <Button size="sm" variant="secondary" onClick={() => void retryJob(job.id)}>
              <RotateCcw /> Try again
            </Button>
          </div>
        )}

        <button
          onClick={() => setShowLog((v) => !v)}
          className="flex w-full items-center gap-2 border-t border-line-soft px-5 py-2.5 text-[12.5px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-expanded={showLog}
        >
          <ChevronDown className={cn('size-3.5 transition-transform', showLog && 'rotate-180')} />
          Activity ({job.log.length})
          {job.status === 'done' && <CircleCheck className="ml-auto size-4 text-success-dot" />}
        </button>
        <AnimatePresence initial={false}>
          {showLog && (
            <motion.ol
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="selectable max-h-48 overflow-y-auto bg-surface-2 font-mono text-[12px]"
            >
              {[...job.log].reverse().map((entry, i) => (
                <li
                  key={`${entry.at}-${i}`}
                  className={cn(
                    'flex gap-3 px-5 py-1',
                    entry.level === 'error' && 'text-stuck-ink',
                  )}
                >
                  <span className="text-faint tabular">
                    {new Date(entry.at).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span>{entry.msg}</span>
                </li>
              ))}
            </motion.ol>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

function Meta({
  label,
  value,
  mono,
  warn,
  testId,
}: {
  label: string
  value: string
  mono?: boolean
  warn?: boolean
  testId?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11.5px] font-medium text-faint">{label}</dt>
      <dd
        data-testid={testId}
        className={cn(
          'truncate tabular',
          mono && 'font-mono text-[12px]',
          warn && 'font-semibold text-stuck',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
