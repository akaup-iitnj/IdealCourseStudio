import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  ChevronDown,
  Cpu,
  FileText,
  KeyRound,
  Play,
  Plug,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { JobCard } from '@/components/JobCard'
import { cn } from '@/lib/utils'
import { useApp } from '@/stores/app'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 32 } },
}

export function ProjectsScreen() {
  const settings = useApp((s) => s.settings)
  const system = useApp((s) => s.system)
  const navigate = useApp((s) => s.navigate)
  const startJob = useApp((s) => s.startJob)
  const jobOrder = useApp((s) => s.jobOrder)
  const jobs = useApp((s) => s.jobs)

  const keySet = settings?.secrets.anthropicApiKey.set ?? false

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-7">
      <motion.div variants={rise} className="flex flex-wrap items-end gap-4">
        <div className="flex flex-[1_1_400px] flex-col gap-1.5">
          <span className="eyebrow">This PC</span>
          <h1 className="text-[26px] font-[650] tracking-[-0.01em]">Course projects</h1>
          <p className="max-w-[62ch] text-muted">
            Each project is one textbook, kept in its own folder on this PC and published into your
            existing Canvas course.
          </p>
        </div>
        <CreateCourseMenu />
      </motion.div>

      <motion.div variants={rise} className="flex flex-wrap gap-4">
        <StatusTile
          tone={keySet ? 'ok' : 'warn'}
          icon={<KeyRound />}
          title={keySet ? 'Claude key saved' : 'Claude key not set'}
          detail={
            keySet
              ? `Ends in ${settings?.secrets.anthropicApiKey.hint ?? '····'}`
              : 'Needed for chapters and planning · Settings'
          }
          onClick={() => navigate('settings')}
          loading={!settings}
        />
        <StatusTile
          tone="idle"
          icon={<Plug />}
          title="Canvas not connected"
          detail="Arrives in Build 3"
        />
        <StatusTile
          tone={system?.gpu?.available ? 'ok' : 'idle'}
          icon={<Cpu />}
          title={
            !system
              ? 'Checking this PC…'
              : system.gpu?.available
                ? (system.gpu.name ?? 'Graphics card found')
                : 'CPU only'
          }
          detail={
            !system
              ? ' '
              : system.gpu?.available
                ? `${system.gpu.vramGb ?? '?'} GB · faster PDF conversion`
                : 'Works fine, just slower on big books'
          }
          onClick={() => navigate('settings')}
          loading={!system}
        />
      </motion.div>

      <motion.div variants={rise}>
        <Card
          className="flex flex-col items-center gap-4 px-8 py-14 text-center"
          data-testid="projects-empty"
        >
          <EmptyIllustration />
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px] font-[650]">No projects yet</h2>
            <p className="max-w-[46ch] text-muted">
              Start with one textbook PDF. Course Studio finds the chapters, fits them into your
              weeks, and builds a folder for each week.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => toast('Uploading a textbook arrives in the next step (M1).')}
          >
            <BookOpen /> Create using textbook
          </Button>
        </Card>
      </motion.div>

      <motion.section variants={rise} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-col">
            <h2 className="text-[17px] font-[650]">Background work</h2>
            <span className="text-[13px] text-muted">
              Try the progress card with a sample job. The frozen one turns orange after 60 seconds
              of silence.
            </span>
          </div>
          <Button onClick={() => void startJob({ kind: 'hello' })} data-testid="start-sample">
            <Play /> Run sample job
          </Button>
          <Button
            onClick={() => void startJob({ kind: 'hello', hang: true })}
            data-testid="start-hang"
          >
            <TriangleAlert /> Run one that freezes
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {jobOrder.map((id) => jobs[id] && <JobCard key={id} job={jobs[id]} />)}
          </AnimatePresence>
          {jobOrder.length === 0 && (
            <div className="rounded-card border border-dashed border-line px-5 py-6 text-center text-[13px] text-muted">
              Nothing running.
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}

function CreateCourseMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button variant="primary" size="lg" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Create Course <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            style={{ transformOrigin: 'top right' }}
            className="absolute top-[52px] right-0 z-20 flex w-[340px] flex-col gap-0.5 rounded-card border border-line bg-surface p-1.5 shadow-pop"
            role="menu"
          >
            <button
              role="menuitem"
              className="flex gap-3 rounded-[8px] p-3 text-left transition-colors hover:bg-accent-soft"
              onClick={() => {
                setOpen(false)
                toast('Uploading a textbook arrives in the next step (M1).')
              }}
            >
              <FileText className="mt-0.5 size-5 text-accent" />
              <span className="flex flex-col gap-0.5">
                <strong className="font-semibold">Create using textbook</strong>
                <span className="text-[13px] text-muted">
                  Upload one PDF. It becomes a new project on this PC.
                </span>
              </span>
            </button>
            <div className="flex gap-3 rounded-[8px] p-3 text-muted" aria-disabled>
              <Sparkles className="mt-0.5 size-5" />
              <span className="flex flex-col gap-0.5">
                <strong className="font-semibold">Create using prompt</strong>
                <span className="text-[13px]">Not in this version</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatusTile({
  tone,
  icon,
  title,
  detail,
  onClick,
  loading,
}: {
  tone: 'ok' | 'warn' | 'idle'
  icon: ReactNode
  title: string
  detail: string
  onClick?: () => void
  loading?: boolean
}) {
  const dot = { ok: 'bg-success-dot', warn: 'bg-stuck', idle: 'bg-faint/60' }[tone]
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex flex-[1_1_260px] items-center gap-3.5 rounded-card border border-line bg-surface px-5 py-4 text-left shadow-card transition-[border-color,transform]',
        onClick && 'hover:-translate-y-px hover:border-control-line',
      )}
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-[9px] bg-ink/5 text-muted [&_svg]:size-[18px]">
        {icon}
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface',
            dot,
          )}
        />
      </span>
      {loading ? (
        <span className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-44" />
        </span>
      ) : (
        <span className="flex min-w-0 flex-col">
          <strong className="truncate font-semibold">{title}</strong>
          <span className="truncate text-[13px] text-muted">{detail}</span>
        </span>
      )}
    </Comp>
  )
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 120 84" className="h-[84px] w-[120px]" aria-hidden>
      <motion.g
        initial={{ rotate: -8, x: 6 }}
        animate={{ rotate: -10, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <rect
          x="22"
          y="14"
          width="44"
          height="58"
          rx="5"
          fill="var(--accent-soft)"
          stroke="var(--line)"
        />
      </motion.g>
      <motion.g
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <rect
          x="42"
          y="8"
          width="48"
          height="64"
          rx="6"
          fill="var(--surface)"
          stroke="var(--control-line)"
        />
        <path
          d="M51 22h30M51 31h30M51 40h20"
          stroke="var(--line)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="51" y="50" width="16" height="12" rx="2" fill="var(--accent)" opacity=".85" />
      </motion.g>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 16 }}
        style={{ transformOrigin: '92px 66px' }}
      >
        <circle cx="92" cy="66" r="11" fill="var(--accent)" />
        <path d="M92 61v10M87 66h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </motion.g>
    </svg>
  )
}
