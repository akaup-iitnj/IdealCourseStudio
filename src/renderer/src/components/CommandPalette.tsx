import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { FolderOpen, Moon, Play, Settings, Sun, TriangleAlert, Monitor } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useApp } from '@/stores/app'

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen)
  const setOpen = useApp((s) => s.setPaletteOpen)
  const navigate = useApp((s) => s.navigate)
  const setTheme = useApp((s) => s.setTheme)
  const startJob = useApp((s) => s.startJob)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useApp.getState().paletteOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const run = (fn: () => unknown) => () => {
    setOpen(false)
    void fn()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[14vh] dark:bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            className="w-[560px] max-w-[92vw] overflow-hidden rounded-[14px] border border-line bg-surface shadow-pop"
          >
            <Command label="Command palette" loop>
              <Command.Input
                autoFocus
                placeholder="Type a command or search…"
                className="h-12 w-full border-b border-line bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-faint"
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              />
              <Command.List className="max-h-[340px] overflow-y-auto p-1.5">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
                  Nothing matches that.
                </Command.Empty>
                <Group heading="Go to">
                  <Item icon={<FolderOpen />} onSelect={run(() => navigate('projects'))}>
                    Projects
                  </Item>
                  <Item icon={<Settings />} onSelect={run(() => navigate('settings'))}>
                    Settings
                  </Item>
                </Group>
                <Group heading="Appearance">
                  <Item icon={<Sun />} onSelect={run(() => setTheme('light'))}>
                    Light theme
                  </Item>
                  <Item icon={<Moon />} onSelect={run(() => setTheme('dark'))}>
                    Dark theme
                  </Item>
                  <Item icon={<Monitor />} onSelect={run(() => setTheme('system'))}>
                    Match Windows theme
                  </Item>
                </Group>
                <Group heading="Try it">
                  <Item icon={<Play />} onSelect={run(() => startJob({ kind: 'hello' }))}>
                    Run the sample job
                  </Item>
                  <Item
                    icon={<TriangleAlert />}
                    onSelect={run(() => startJob({ kind: 'hello', hang: true }))}
                  >
                    Run a sample job that freezes
                  </Item>
                </Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-faint"
    >
      {children}
    </Command.Group>
  )
}

function Item({
  icon,
  children,
  onSelect,
}: {
  icon: ReactNode
  children: ReactNode
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[13.5px] text-ink data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-ink [&_svg]:size-4 [&_svg]:text-muted data-[selected=true]:[&_svg]:text-accent-ink"
    >
      {icon}
      {children}
    </Command.Item>
  )
}
