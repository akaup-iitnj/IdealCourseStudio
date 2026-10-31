import { ChevronRight, MessageSquare, Search } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { platform } from '@/lib/api'
import { useNow } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useApp, type Route } from '@/stores/app'

const LABELS: Record<Route, string> = { projects: 'Projects', settings: 'Settings' }

/**
 * 40 px custom title bar. The native min/max/close buttons are drawn by Windows (titleBarOverlay);
 * we leave room for them using the Window Controls Overlay env() variables.
 */
export function TitleBar() {
  const route = useApp((s) => s.route)
  const navigate = useApp((s) => s.navigate)
  const openPalette = useApp((s) => s.setPaletteOpen)
  return (
    <header
      className={cn(
        'drag relative z-30 flex h-10 shrink-0 items-center gap-3 text-[13px]',
        platform === 'darwin' ? 'pl-20' : 'pl-3.5',
      )}
      style={{
        paddingRight:
          platform === 'darwin'
            ? 12
            : 'calc(100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, calc(100vw - 138px)) + 8px)',
      }}
    >
      <button
        onClick={() => navigate('projects')}
        className="no-drag flex items-center gap-2 rounded-md px-1 py-0.5 font-semibold"
        aria-label="Course Studio home"
      >
        <AppMark />
        <span>Course Studio</span>
      </button>
      <ChevronRight className="size-3.5 text-faint" aria-hidden />
      <span className="font-medium text-muted" data-testid="breadcrumb">
        {LABELS[route]}
      </span>

      <div className="flex flex-1 justify-center">
        <button
          onClick={() => openPalette(true)}
          className="no-drag flex h-7 w-full max-w-[380px] items-center gap-2 rounded-[7px] border border-line bg-surface/70 px-2.5 text-muted transition-colors hover:border-control-line hover:bg-surface"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1 text-left">Search or jump to…</span>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </button>
      </div>

      <ClaudeCodeIndicator />

      <button
        disabled
        title="Chat arrives in Build 4"
        className="no-drag flex h-8 items-center gap-1.5 rounded-md px-2.5 font-medium text-ink opacity-50"
      >
        <MessageSquare className="size-4" aria-hidden />
        Chat
      </button>
    </header>
  )
}

/** Shows for 20 s after each Claude Code tool call, so the instructor knows the app is being driven. */
function ClaudeCodeIndicator() {
  const activity = useApp((s) => s.mcpActivity)
  const now = useNow(1000)
  if (!activity || now - activity.at > 20_000) return null
  return (
    <span
      className="no-drag flex h-7 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 text-xs font-semibold text-accent-ink"
      title={`Last action: ${activity.tool}`}
      data-testid="mcp-indicator"
    >
      <span className="size-2 rounded-full bg-accent text-accent animate-pulse-dot" />
      Claude Code
    </span>
  )
}

export function AppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('size-[18px]', className)} aria-hidden>
      <rect width="20" height="20" rx="5" fill="var(--accent)" />
      <path
        d="M5 6.5h6M5 10h10M5 13.5h7.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
