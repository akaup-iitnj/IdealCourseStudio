import { ipcMain, shell, type WebContents } from 'electron'
import { dirname } from 'node:path'
import { ipcContract, type IpcChannel, type IpcInput, type IpcOutput } from '@shared/ipc'
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
}): void {
  const { settings, jobs } = deps
  const handlers: Handlers = {
    'settings:get': () => settings.toPublic(),
    'settings:setTheme': async (theme) => {
      await settings.setTheme(theme)
      deps.applyTheme()
      return settings.toPublic()
    },
    'settings:setSecret': async ({ name, value }) => {
      await settings.setSecret(name, value)
      return settings.toPublic()
    },
    'settings:clearSecret': async (name) => {
      await settings.clearSecret(name)
      return settings.toPublic()
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
