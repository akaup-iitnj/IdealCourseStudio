import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { logsDir } from './paths'

let ready: Promise<void> | null = null

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Redact anything that looks like an API key before it can reach a log file. */
export function redact(text: string): string {
  return text.replace(/sk-ant-[A-Za-z0-9_-]{8,}/g, 'sk-ant-***')
}

/** Technical log file. The UI never shows these lines; teachers get plain English instead. */
export async function log(scope: string, message: string): Promise<void> {
  try {
    ready ??= mkdir(logsDir(), { recursive: true }).then(() => undefined)
    await ready
    const line = `${new Date().toISOString()} [${scope}] ${redact(message)}\n`
    await appendFile(join(logsDir(), `course-studio-${today()}.log`), line, 'utf8')
  } catch {
    // Logging must never crash the app.
  }
}

/** Last `lines` lines of today's log file, for diagnostics (already redacted when written). */
export async function tailLog(lines: number): Promise<string> {
  try {
    const { readFile } = await import('node:fs/promises')
    const text = await readFile(join(logsDir(), `course-studio-${today()}.log`), 'utf8')
    return text
      .split('\n')
      .slice(-lines - 1)
      .join('\n')
      .trim()
  } catch {
    return ''
  }
}
