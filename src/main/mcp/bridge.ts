import type { Route } from '@shared/ipc'
import type { JobSnapshot, StartJobRequest } from '@shared/jobs'
import type { PublicSettings, Theme } from '@shared/settings'
import type { SystemInfo } from '@shared/system'
import type { KeyTestResult } from '@shared/ipc'

/**
 * Everything an MCP client may do to the app. Deliberately narrow: no reading or writing secrets,
 * no publishing to Canvas, no raw filesystem access. New features add a method here and a tool in tools.ts.
 */
export interface AppBridge {
  version: string
  route(): Route
  navigate(route: Route): void
  settings(): PublicSettings
  setTheme(theme: Theme): Promise<void>
  systemInfo(): Promise<SystemInfo>
  testClaudeKey(): Promise<KeyTestResult>
  jobs: {
    list(): JobSnapshot[]
    start(req: StartJobRequest): JobSnapshot
    cancel(id: string): void
    retry(id: string): JobSnapshot
    dismiss(id: string): void
  }
  /** PNG of the app window, or null when no window is open. */
  screenshot(): Promise<Buffer | null>
  /** Last N lines of today's technical log (keys already redacted). */
  readLog(lines: number): Promise<string>
}
