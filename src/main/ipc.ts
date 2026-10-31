import { clipboard, ipcMain, shell, type WebContents } from 'electron'
import { dirname } from 'node:path'
import {
  ipcContract,
  type IpcChannel,
  type IpcInput,
  type IpcOutput,
  type Route,
} from '@shared/ipc'
import type { PublicSettings } from '@shared/settings'
import { testClaudeKey } from './claude'
import type { JobRunner } from './jobs/runner'
import { log } from './log'
import type { SettingsStore } from './settings'
import { systemInfo } from './system'

type Handlers = { [C in IpcChannel]: (input: IpcInput<C>) => Promise<IpcOutput<C>> | IpcOutput<C> }

export function registerIpc(deps: {
  settings: SettingsStore
  jobs: JobRunner
  applyTheme: () => void
  isTrustedSender: (sender: WebContents) => boolean
  publicSettings: () => PublicSettings
  setRoute: (route: Route) => void
  mcp: {
    setEnabled: (on: boolean) => Promise<void>
    resetToken: () => Promise<void>
    setupCommand: () => Promise<string>
  }
}): void {
  const { settings, jobs } = deps
  const handlers: Handlers = {
    'settings:get': () => deps.publicSettings(),
    'settings:setTheme': async (theme) => {
      await settings.setTheme(theme)
      deps.applyTheme()
      return deps.publicSettings()
    },
    'settings:setSecret': async ({ name, value }) => {
      await settings.setSecret(name, value)
      return deps.publicSettings()
    },
    'settings:clearSecret': async (name) => {
      await settings.clearSecret(name)
      return deps.publicSettings()
    },
    'claude:testKey': ({ value }) =>
      testClaudeKey(value?.trim() || settings.getSecret('anthropicApiKey')),
    'system:info': () => systemInfo(),
    'jobs:list': () => jobs.list(),
    'jobs:start': (req) => jobs.start(req),
    'jobs:cancel': (id) => jobs.cancel(id),
    'jobs:retry': (id) => jobs.retry(id),
    'jobs:dismiss': (id) => jobs.dismiss(id),
    'shell:openSettingsFolder': async () => {
      await shell.openPath(dirname(settings.path))
    },
    'mcp:setEnabled': async (on) => {
      await deps.mcp.setEnabled(on)
      return deps.publicSettings()
    },
    'mcp:resetToken': async () => {
      await deps.mcp.resetToken()
      return deps.publicSettings()
    },
    'mcp:copySetupCommand': async () => {
      clipboard.writeText(await deps.mcp.setupCommand())
    },
    'ui:reportRoute': (route) => deps.setRoute(route),
  }

  for (const channel of Object.keys(ipcContract) as IpcChannel[]) {
    const { input, output } = ipcContract[channel]
    ipcMain.handle(channel, async (event, raw) => {
      if (!deps.isTrustedSender(event.sender)) throw new Error('Blocked')
      const parsed = input.safeParse(raw)
      if (!parsed.success) {
        void log('ipc', `bad input on ${channel}: ${parsed.error.message}`)
        throw new Error('The app sent an unexpected request.')
      }
      try {
        const handler = handlers[channel] as (i: unknown) => unknown
        return output.parse(await handler(parsed.data))
      } catch (err) {
        void log('ipc', `${channel} failed: ${err instanceof Error ? err.stack : String(err)}`)
        // Only plain-English messages cross to the renderer; the cause stays in the log file.
        // eslint-disable-next-line preserve-caught-error
        throw new Error(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }
}
