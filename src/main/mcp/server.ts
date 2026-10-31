import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { McpStatus } from '@shared/settings'
import { log } from '../log'
import type { AppBridge } from './bridge'
import { registerTools } from './tools'

export const MCP_HOST = '127.0.0.1'
const MAX_BODY = 1024 * 1024

export interface McpControllerOptions {
  bridge: AppBridge
  getToken: () => Promise<string>
  onActivity: (tool: string) => void
}

/**
 * Local MCP server (Streamable HTTP) so Claude Code can drive the app.
 * - Listens on 127.0.0.1 only, never the network.
 * - Every request needs `Authorization: Bearer <token>`; the token lives encrypted in settings.json.
 * - Host header must be 127.0.0.1/localhost and browser Origins are refused (DNS-rebinding guard).
 * - Stateless: a fresh MCP server per request, so nothing leaks between clients.
 */
export class McpController {
  private http: Server | null = null
  private port = 0
  private lastError: string | null = null

  constructor(private readonly opts: McpControllerOptions) {}

  status(enabled: boolean): McpStatus {
    return {
      enabled,
      running: this.http !== null,
      url: `http://${MCP_HOST}:${this.port || '…'}/mcp`,
      error: this.lastError,
    }
  }

  setupCommandFor(token: string): string {
    return setupCommand(this.url, token)
  }

  get url(): string {
    return `http://${MCP_HOST}:${this.port}/mcp`
  }

  async start(port: number): Promise<void> {
    if (this.http && this.port === port) return
    await this.stop()
    this.lastError = null
    const server = createServer((req, res) => void this.handle(req, res))
    await new Promise<void>((resolve) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        this.lastError =
          err.code === 'EADDRINUSE'
            ? `Port ${port} is already used by another program.`
            : 'The Claude Code connection could not start. Details are in the log file.'
        void log('mcp', `listen failed on ${port}: ${err.message}`)
        resolve()
      })
      server.listen(port, MCP_HOST, () => {
        this.http = server
        this.port = (server.address() as { port: number }).port
        void log('mcp', `listening on ${this.url}`)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    const s = this.http
    this.http = null
    if (!s) return
    s.closeAllConnections?.()
    await new Promise<void>((r) => s.close(() => r()))
    void log('mcp', 'stopped')
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url ?? '/', `http://${MCP_HOST}`)
      if (url.pathname !== '/mcp') return send(res, 404, 'Not found')

      const host = (req.headers.host ?? '').replace(/:\d+$/, '')
      if (host !== MCP_HOST && host !== 'localhost') return send(res, 403, 'Bad host')
      if (req.headers.origin) return send(res, 403, 'Browser requests are not allowed')

      const token = await this.opts.getToken()
      const auth = req.headers.authorization ?? ''
      if (!safeEqual(auth, `Bearer ${token}`)) return send(res, 401, 'Missing or wrong token')

      if (req.method !== 'POST') {
        // Stateless server: no SSE stream or session to delete.
        res.setHeader('Allow', 'POST')
        return send(res, 405, 'Use POST')
      }

      const body = await readJson(req)
      const server = new McpServer(
        { name: 'course-studio', title: 'Course Studio', version: this.opts.bridge.version },
        {
          instructions:
            'Controls the Course Studio desktop app on this PC. Call get_app_state first, use screenshot to see the window. Secrets and Canvas publishing are never available here.',
        },
      )
      registerTools(server, this.opts.bridge, (tool) => {
        void log('mcp', `tool ${tool}`)
        this.opts.onActivity(tool)
      })
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      })
      res.on('close', () => {
        void transport.close()
        void server.close()
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, body)
    } catch (err) {
      void log('mcp', `request failed: ${err instanceof Error ? err.stack : String(err)}`)
      if (!res.headersSent) send(res, 400, 'Bad request')
    }
  }
}

function send(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(message)
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('Body too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined)
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

/** The command an instructor pastes into a terminal to connect Claude Code. */
export function setupCommand(url: string, token: string): string {
  return `claude mcp add --transport http --scope user course-studio ${url} --header "Authorization: Bearer ${token}"`
}
