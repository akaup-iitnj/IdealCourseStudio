import { contextBridge, ipcRenderer } from 'electron'
import type { CourseStudioApi, IpcChannel, IpcEvent } from '../shared/ipc'

// Kept in sync with src/shared/ipc.ts (the preload is sandboxed, so we avoid bundling zod here).
const CHANNELS: readonly IpcChannel[] = [
  'settings:get',
  'settings:setTheme',
  'settings:setSecret',
  'settings:clearSecret',
  'claude:testKey',
  'system:info',
  'jobs:list',
  'jobs:start',
  'jobs:cancel',
  'jobs:retry',
  'jobs:dismiss',
  'shell:openSettingsFolder',
  'mcp:setEnabled',
  'mcp:resetToken',
  'mcp:copySetupCommand',
  'ui:reportRoute',
]
const EVENTS: readonly IpcEvent[] = [
  'jobs:update',
  'jobs:removed',
  'app:navigate',
  'settings:changed',
  'mcp:activity',
]

const api: CourseStudioApi = {
  invoke: ((channel: IpcChannel, ...args: unknown[]) => {
    if (!CHANNELS.includes(channel)) return Promise.reject(new Error(`Unknown channel ${channel}`))
    return ipcRenderer.invoke(channel, ...args)
  }) as CourseStudioApi['invoke'],
  on: (event, listener) => {
    if (!EVENTS.includes(event)) throw new Error(`Unknown event ${event}`)
    const wrapped = (_e: Electron.IpcRendererEvent, payload: unknown): void =>
      listener(payload as never)
    ipcRenderer.on(event, wrapped)
    return () => ipcRenderer.removeListener(event, wrapped)
  },
  platform: process.platform,
}

contextBridge.exposeInMainWorld('cs', api)
