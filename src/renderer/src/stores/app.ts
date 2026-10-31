import { create } from 'zustand'
import type { JobSnapshot, StartJobRequest } from '@shared/jobs'
import type { PublicSettings, Theme } from '@shared/settings'
import type { SystemInfo } from '@shared/system'
import { api } from '@/lib/api'

export type { Route } from '@shared/ipc'
import type { Route } from '@shared/ipc'

interface AppState {
  route: Route
  paletteOpen: boolean
  settings: PublicSettings | null
  system: SystemInfo | null
  jobs: Record<string, JobSnapshot>
  jobOrder: string[]
  /** Last Claude Code (MCP) tool call, for the title-bar indicator. */
  mcpActivity: { tool: string; at: number } | null

  navigate: (route: Route) => void
  setPaletteOpen: (open: boolean) => void
  init: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  setSettings: (s: PublicSettings) => void
  loadSystem: () => Promise<void>
  startJob: (req: StartJobRequest) => Promise<void>
  cancelJob: (id: string) => Promise<void>
  retryJob: (id: string) => Promise<void>
  dismissJob: (id: string) => Promise<void>
  removeJob: (id: string) => void
  upsertJob: (job: JobSnapshot) => void
}

export const useApp = create<AppState>((set, get) => ({
  route: 'projects',
  paletteOpen: false,
  settings: null,
  system: null,
  jobs: {},
  jobOrder: [],
  mcpActivity: null,

  navigate: (route) => {
    set({ route, paletteOpen: false })
    void api.invoke('ui:reportRoute', route)
  },
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  init: async () => {
    const [settings, jobs] = await Promise.all([
      api.invoke('settings:get'),
      api.invoke('jobs:list'),
    ])
    set({ settings })
    jobs.forEach(get().upsertJob)
    api.on('jobs:update', get().upsertJob)
    api.on('jobs:removed', get().removeJob)
    api.on('app:navigate', (route) => set({ route, paletteOpen: false }))
    api.on('settings:changed', (settings) => set({ settings }))
    api.on('mcp:activity', (mcpActivity) => set({ mcpActivity }))
    void get().loadSystem()
  },

  setTheme: async (theme) => {
    // Optimistic: flip immediately, then confirm.
    const prev = get().settings
    if (prev) set({ settings: { ...prev, theme } })
    set({ settings: await api.invoke('settings:setTheme', theme) })
  },
  setSettings: (settings) => set({ settings }),

  loadSystem: async () => {
    set({ system: await api.invoke('system:info') })
  },

  startJob: async (req) => {
    get().upsertJob(await api.invoke('jobs:start', req))
  },
  cancelJob: async (id) => api.invoke('jobs:cancel', id),
  retryJob: async (id) => {
    get().upsertJob(await api.invoke('jobs:retry', id))
  },
  dismissJob: async (id) => {
    await api.invoke('jobs:dismiss', id)
    get().removeJob(id)
  },
  removeJob: (id) =>
    set((s) => {
      const jobs = { ...s.jobs }
      delete jobs[id]
      return { jobs, jobOrder: s.jobOrder.filter((j) => j !== id) }
    }),
  upsertJob: (job) =>
    set((s) => ({
      jobs: { ...s.jobs, [job.id]: job },
      jobOrder: s.jobOrder.includes(job.id) ? s.jobOrder : [job.id, ...s.jobOrder],
    })),
}))
