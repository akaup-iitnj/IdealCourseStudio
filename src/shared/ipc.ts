import { z } from 'zod'
import { JobSnapshotSchema, StartJobRequestSchema } from './jobs'
import { PublicSettingsSchema, ThemeSchema, UserSecretNameSchema } from './settings'
import { SystemInfoSchema } from './system'

/**
 * The IPC contract. Every request the renderer can make, with zod schemas for input and output.
 * Main validates input before handling; the preload exposes exactly these, nothing else.
 */
export const KeyTestResultSchema = z.object({
  ok: z.boolean(),
  /** Plain-English result for the instructor. */
  message: z.string(),
})
export type KeyTestResult = z.infer<typeof KeyTestResultSchema>

export const RouteSchema = z.enum(['projects', 'settings'])
export type Route = z.infer<typeof RouteSchema>

export const McpActivitySchema = z.object({ tool: z.string(), at: z.number() })
export type McpActivity = z.infer<typeof McpActivitySchema>

export const ipcContract = {
  'settings:get': { input: z.void(), output: PublicSettingsSchema },
  'settings:setTheme': { input: ThemeSchema, output: PublicSettingsSchema },
  'settings:setSecret': {
    input: z.object({ name: UserSecretNameSchema, value: z.string().max(500) }),
    output: PublicSettingsSchema,
  },
  'settings:clearSecret': { input: UserSecretNameSchema, output: PublicSettingsSchema },
  'claude:testKey': {
    /** Optional unsaved key to test; otherwise the saved key is used. */
    input: z.object({ value: z.string().max(500).optional() }),
    output: KeyTestResultSchema,
  },
  'system:info': { input: z.void(), output: SystemInfoSchema },
  'jobs:list': { input: z.void(), output: z.array(JobSnapshotSchema) },
  'jobs:start': { input: StartJobRequestSchema, output: JobSnapshotSchema },
  'jobs:cancel': { input: z.string(), output: z.void() },
  'jobs:retry': { input: z.string(), output: JobSnapshotSchema },
  'jobs:dismiss': { input: z.string(), output: z.void() },
  'shell:openSettingsFolder': { input: z.void(), output: z.void() },
  'mcp:setEnabled': { input: z.boolean(), output: PublicSettingsSchema },
  'mcp:resetToken': { input: z.void(), output: PublicSettingsSchema },
  /** Copies the `claude mcp add ...` command (with the token) to the clipboard. The token never reaches the renderer. */
  'mcp:copySetupCommand': { input: z.void(), output: z.void() },
  /** Renderer tells main which screen is showing, so MCP clients can read it. */
  'ui:reportRoute': { input: RouteSchema, output: z.void() },
} as const

export type IpcContract = typeof ipcContract
export type IpcChannel = keyof IpcContract
export type IpcInput<C extends IpcChannel> = z.input<IpcContract[C]['input']>
export type IpcOutput<C extends IpcChannel> = z.output<IpcContract[C]['output']>

/** Events main pushes to the renderer. */
export const ipcEvents = {
  'jobs:update': JobSnapshotSchema,
  'jobs:removed': z.string(),
  /** Main asks the renderer to show a screen (used by MCP). */
  'app:navigate': RouteSchema,
  /** Settings changed outside the renderer (e.g. by an MCP tool). */
  'settings:changed': PublicSettingsSchema,
  /** A Claude Code tool call just happened. */
  'mcp:activity': McpActivitySchema,
} as const
export type IpcEvent = keyof typeof ipcEvents
export type IpcEventPayload<E extends IpcEvent> = z.output<(typeof ipcEvents)[E]>

/** The API object the preload puts on `window.cs`. */
export interface CourseStudioApi {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: IpcInput<C> extends void ? [] : [IpcInput<C>]
  ): Promise<IpcOutput<C>>
  on<E extends IpcEvent>(event: E, listener: (payload: IpcEventPayload<E>) => void): () => void
  platform: 'win32' | 'darwin' | 'linux' | string
}

export const IPC_CHANNELS = Object.keys(ipcContract) as IpcChannel[]
export const IPC_EVENTS = Object.keys(ipcEvents) as IpcEvent[]
