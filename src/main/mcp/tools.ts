import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { RouteSchema } from '@shared/ipc'
import type { JobSnapshot } from '@shared/jobs'
import { ThemeSchema } from '@shared/settings'
import type { AppBridge } from './bridge'

type ToolResult = {
  content: ({ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string })[]
  isError?: boolean
}

const json = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
})
const fail = (message: string): ToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
})

/** Job snapshot without the full log, for lists. */
function brief(j: JobSnapshot) {
  const { log, ...rest } = j
  return { ...rest, logLines: log.length }
}

/** All tool names, for tests and docs. */
export const TOOL_NAMES = [
  'get_app_state',
  'navigate',
  'screenshot',
  'set_theme',
  'get_system_info',
  'test_claude_key',
  'list_jobs',
  'get_job',
  'start_sample_job',
  'cancel_job',
  'retry_job',
  'dismiss_job',
  'read_log',
] as const

export function registerTools(
  server: McpServer,
  app: AppBridge,
  onCall: (tool: string) => void,
): void {
  const wrap =
    <A>(name: string, fn: (args: A) => Promise<ToolResult> | ToolResult) =>
    async (args: A): Promise<ToolResult> => {
      onCall(name)
      try {
        return await fn(args)
      } catch (err) {
        return fail(err instanceof Error ? err.message : String(err))
      }
    }

  server.registerTool(
    'get_app_state',
    {
      title: 'Get app state',
      description:
        'Current screen, theme, whether a Claude key is saved (never the key itself), MCP status, and a summary of every background job.',
      annotations: { readOnlyHint: true },
    },
    wrap('get_app_state', () => {
      const s = app.settings()
      return json({
        version: app.version,
        screen: app.route(),
        theme: s.theme,
        claudeKeySaved: s.secrets.anthropicApiKey.set,
        encryptionAvailable: s.encryptionAvailable,
        jobs: app.jobs.list().map(brief),
      })
    }),
  )

  server.registerTool(
    'navigate',
    {
      title: 'Show a screen',
      description: 'Switch the app window to a screen.',
      inputSchema: { screen: RouteSchema },
    },
    wrap('navigate', ({ screen }: { screen: z.infer<typeof RouteSchema> }) => {
      app.navigate(screen)
      return json({ ok: true, screen })
    }),
  )

  server.registerTool(
    'screenshot',
    {
      title: 'Screenshot the app',
      description: 'PNG of the Course Studio window as the instructor sees it right now.',
      annotations: { readOnlyHint: true },
    },
    wrap('screenshot', async () => {
      const png = await app.screenshot()
      if (!png) return fail('The app window is not open.')
      return { content: [{ type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] }
    }),
  )

  server.registerTool(
    'set_theme',
    {
      title: 'Set theme',
      description: 'Light, dark, or follow Windows.',
      inputSchema: { theme: ThemeSchema },
    },
    wrap('set_theme', async ({ theme }: { theme: z.infer<typeof ThemeSchema> }) => {
      await app.setTheme(theme)
      return json({ ok: true, theme })
    }),
  )

  server.registerTool(
    'get_system_info',
    {
      title: 'This PC',
      description:
        'OS, CPU, RAM, GPU (and how it was detected) and how the Python helper is found.',
      annotations: { readOnlyHint: true },
    },
    wrap('get_system_info', async () => json(await app.systemInfo())),
  )

  server.registerTool(
    'test_claude_key',
    {
      title: 'Test the saved Claude key',
      description:
        'Makes one tiny Haiku call with the saved key. Returns ok and a plain-English message, never the key.',
      annotations: { openWorldHint: true },
    },
    wrap('test_claude_key', async () => json(await app.testClaudeKey())),
  )

  server.registerTool(
    'list_jobs',
    {
      title: 'List background jobs',
      description:
        'Every job with status (queued, running, stuck, done, failed, cancelled), step, page of total, timings and stuck reason.',
      annotations: { readOnlyHint: true },
    },
    wrap('list_jobs', () => json(app.jobs.list().map(brief))),
  )

  server.registerTool(
    'get_job',
    {
      title: 'Get one job',
      description: 'Full snapshot of one job including its plain-English activity log.',
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    wrap('get_job', ({ id }: { id: string }) => {
      const job = app.jobs.list().find((j) => j.id === id)
      return job ? json(job) : fail(`No job with id ${id}.`)
    }),
  )

  server.registerTool(
    'start_sample_job',
    {
      title: 'Start the sample job',
      description:
        'Starts the fake progress job. hang=true makes it go silent after 3 pages so the stuck state shows.',
      inputSchema: {
        hang: z.boolean().optional(),
        seconds: z.number().int().min(1).max(600).optional(),
      },
    },
    wrap('start_sample_job', ({ hang, seconds }: { hang?: boolean; seconds?: number }) =>
      json(brief(app.jobs.start({ kind: 'hello', hang, seconds }))),
    ),
  )

  server.registerTool(
    'cancel_job',
    {
      title: 'Stop a job',
      description: 'Stops a running or stuck job.',
      inputSchema: { id: z.string() },
    },
    wrap('cancel_job', ({ id }: { id: string }) => {
      app.jobs.cancel(id)
      return json({ ok: true })
    }),
  )

  server.registerTool(
    'retry_job',
    {
      title: 'Retry a job',
      description: 'Restarts a stuck or failed job.',
      inputSchema: { id: z.string() },
    },
    wrap('retry_job', ({ id }: { id: string }) => json(brief(app.jobs.retry(id)))),
  )

  server.registerTool(
    'dismiss_job',
    {
      title: 'Dismiss a job',
      description: 'Removes a job card (stops it first if needed).',
      inputSchema: { id: z.string() },
    },
    wrap('dismiss_job', ({ id }: { id: string }) => {
      app.jobs.dismiss(id)
      return json({ ok: true })
    }),
  )

  server.registerTool(
    'read_log',
    {
      title: 'Read the technical log',
      description:
        "Last lines of today's log file (API keys are redacted). Useful for diagnosing failed jobs.",
      inputSchema: { lines: z.number().int().min(1).max(2000).optional() },
      annotations: { readOnlyHint: true },
    },
    wrap('read_log', async ({ lines }: { lines?: number }) => ({
      content: [{ type: 'text', text: (await app.readLog(lines ?? 200)) || '(log is empty)' }],
    })),
  )
}
