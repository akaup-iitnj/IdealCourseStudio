import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { CommandPalette } from '@/components/CommandPalette'
import { Sidebar } from '@/components/Sidebar'
import { TitleBar } from '@/components/TitleBar'
import { chromeMode } from '@/lib/api'
import { useDarkMode } from '@/lib/hooks'
import { ProjectsScreen } from '@/screens/Projects'
import { SettingsScreen } from '@/screens/Settings'
import { useApp } from '@/stores/app'

export function App() {
  const route = useApp((s) => s.route)
  const theme = useApp((s) => s.settings?.theme ?? 'system')
  const dark = useDarkMode(theme)

  useEffect(() => {
    void useApp.getState().init()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    document.documentElement.classList.toggle('mica', chromeMode === 'mica')
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full flex-col">
        <TitleBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          {/* Content sits on a solid canvas with a rounded corner, like Windows 11 apps; Mica shows around it. */}
          <main className="min-w-0 flex-1 overflow-hidden rounded-tl-[12px] border-t border-l border-line bg-canvas">
            <div className="h-full overflow-y-auto" data-testid="scroll-root">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={route}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
                  className="mx-auto w-full max-w-[1280px] px-10 py-9"
                >
                  {route === 'projects' ? <ProjectsScreen /> : <SettingsScreen />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <CommandPalette />
      <Toaster
        position="bottom-right"
        theme={dark ? 'dark' : 'light'}
        toastOptions={{
          className: 'font-sans !rounded-[10px] !border-line !bg-surface !text-ink !shadow-pop',
        }}
      />
    </MotionConfig>
  )
}
