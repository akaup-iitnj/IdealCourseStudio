import { motion } from 'motion/react'
import { FolderOpen, Settings } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'
import { useApp, type Route } from '@/stores/app'

const NAV: { route: Route; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { route: 'projects', label: 'Projects', icon: FolderOpen },
  { route: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const route = useApp((s) => s.route)
  const navigate = useApp((s) => s.navigate)
  const running = useApp((s) => Object.values(s.jobs).filter((j) => j.status === 'running').length)
  const stuck = useApp((s) => Object.values(s.jobs).filter((j) => j.status === 'stuck').length)
  return (
    <nav className="flex w-[208px] shrink-0 flex-col gap-0.5 px-2.5 pt-2 pb-3" aria-label="Main">
      {NAV.map(({ route: r, label, icon: Icon }) => {
        const active = r === route
        return (
          <button
            key={r}
            onClick={() => navigate(r)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-[13.5px] font-medium transition-colors',
              active ? 'text-ink' : 'text-muted hover:bg-ink/5 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-[7px] bg-surface shadow-card ring-1 ring-line"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </button>
        )
      })}

      <div className="mt-auto flex flex-col gap-1 px-2.5 text-xs text-muted">
        {(running > 0 || stuck > 0) && (
          <div className="flex items-center gap-2" data-testid="sidebar-jobs">
            <span
              className={cn(
                'size-2 rounded-full animate-pulse-dot',
                stuck ? 'bg-stuck text-stuck' : 'bg-accent text-accent',
              )}
            />
            {stuck ? `${stuck} job needs attention` : `${running} job running`}
          </div>
        )}
        <span className="font-mono text-[11px] text-faint">Build 0 · M0</span>
      </div>
    </nav>
  )
}
