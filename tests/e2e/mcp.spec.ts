import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 39391
const TOKEN = 'test-token-123'
const URL_ = new URL(`http://127.0.0.1:${PORT}/mcp`)

let app: ElectronApplication
let page: Page
let dataDir: string

type CallResult = Awaited<ReturnType<Client['callTool']>>
const text = (r: CallResult): string => (r.content as { text: string }[])[0]!.text

function connect(token = TOKEN) {
  const client = new Client({ name: 'e2e', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(URL_, {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  })
  return { client, ready: client.connect(transport) }
}

test.beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'cs-mcp-'))
  const args = [join(__dirname, '../..')]
  if (process.platform === 'linux') args.unshift('--no-sandbox', '--password-store=basic')
  app = await electron.launch({
    args,
    env: {
      ...process.env,
      CS_USER_DATA_DIR: dataDir,
      CS_STUCK_MS: '3000',
      CS_E2E: '1',
      CS_MCP: '1',
      CS_MCP_PORT: String(PORT),
      CS_MCP_TOKEN: TOKEN,
    },
  })
  page = await app.firstWindow()
  await expect(page.getByRole('heading', { name: 'Course projects' })).toBeVisible()
})

test.afterAll(async () => {
  await app?.close()
  rmSync(dataDir, { recursive: true, force: true })
})

test('refuses requests without the token', async () => {
  const res = await fetch(URL_, {
    method: 'POST',
    body: '{}',
    headers: { 'Content-Type': 'application/json' },
  })
  expect(res.status).toBe(401)
  const { ready } = connect('wrong')
  await expect(ready).rejects.toThrow()
})

test('Claude Code can see and drive the app', async () => {
  const { client, ready } = connect()
  await ready
  const tools = (await client.listTools()).tools.map((t) => t.name)
  expect(tools).toEqual(
    expect.arrayContaining(['get_app_state', 'screenshot', 'start_sample_job', 'navigate']),
  )
  expect(tools.join(' ')).not.toMatch(/secret|key_value|canvas/i)

  const state = JSON.parse(text(await client.callTool({ name: 'get_app_state' })))
  expect(state.screen).toBe('projects')
  expect(state.claudeKeySaved).toBe(false)

  // Start a job over MCP and watch the window update.
  await client.callTool({ name: 'start_sample_job', arguments: { seconds: 2 } })
  await expect(page.getByTestId('job-card').first()).toHaveAttribute('data-status', 'done', {
    timeout: 15_000,
  })
  await expect(page.getByTestId('mcp-indicator')).toBeVisible()

  await client.callTool({ name: 'navigate', arguments: { screen: 'settings' } })
  await expect(page.getByTestId('breadcrumb')).toHaveText('Settings')

  await client.callTool({ name: 'set_theme', arguments: { theme: 'dark' } })
  await expect(page.locator('html')).toHaveClass(/dark/)

  const shot = await client.callTool({ name: 'screenshot' })
  const img = (shot.content as { type: string; data?: string }[])[0]!
  expect(img.type).toBe('image')
  expect(Buffer.from(img.data!, 'base64').subarray(1, 4).toString()).toBe('PNG')

  const jobs = JSON.parse(text(await client.callTool({ name: 'list_jobs' })))
  await client.callTool({ name: 'dismiss_job', arguments: { id: jobs[0].id } })
  await expect(page.getByTestId('job-card')).toHaveCount(0)
  await client.close()
})
