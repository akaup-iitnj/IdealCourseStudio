import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { app } from 'electron'
import { bundledPythonDir, pythonProjectDir } from './paths'

export interface PythonCommand {
  command: string
  /** Arguments before the tool name, e.g. `['-m', 'cs_py']`. */
  prefix: string[]
  env: NodeJS.ProcessEnv
  /** Plain description for Settings → This PC. */
  how: string
}

let cached: PythonCommand | null | undefined

function works(command: string, args: string[]): boolean {
  try {
    const r = spawnSync(command, args, { timeout: 15_000, windowsHide: true, encoding: 'utf8' })
    return r.status === 0
  } catch {
    return false
  }
}

function baseEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  }
}

function withPythonPath(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const dir = pythonProjectDir()
  return { ...env, PYTHONPATH: env.PYTHONPATH ? `${dir}${delimiter}${env.PYTHONPATH}` : dir }
}

/**
 * Find a way to run `python -m cs_py`. Order:
 * 1. CS_PYTHON override (tests, troubleshooting)
 * 2. Bundled runtime in resources/python-runtime (installed app, M9)
 * 3. `uv run` against the repo's python/ project (development)
 * 4. A Python already on this PC (py -3 / python3 / python)
 */
export function resolvePython(): PythonCommand | null {
  if (cached !== undefined) return cached
  cached = findPython()
  return cached
}

function findPython(): PythonCommand | null {
  const env = baseEnv()
  const override = process.env.CS_PYTHON
  if (override) {
    return {
      command: override,
      prefix: ['-m', 'cs_py'],
      env: withPythonPath(env),
      how: `CS_PYTHON (${override})`,
    }
  }

  if (app.isPackaged) {
    const exe =
      process.platform === 'win32'
        ? join(bundledPythonDir(), 'python.exe')
        : join(bundledPythonDir(), 'bin', 'python3')
    if (existsSync(exe)) {
      return {
        command: exe,
        prefix: ['-m', 'cs_py'],
        env: withPythonPath(env),
        how: 'Bundled with Course Studio',
      }
    }
  }

  if (!app.isPackaged && works('uv', ['--version'])) {
    return {
      command: 'uv',
      prefix: ['run', '--quiet', '--project', pythonProjectDir(), 'python', '-m', 'cs_py'],
      env,
      how: 'uv (development)',
    }
  }

  const candidates: [string, string[]][] =
    process.platform === 'win32'
      ? [
          ['py', ['-3']],
          ['python', []],
          ['python3', []],
        ]
      : [
          ['python3', []],
          ['python', []],
        ]
  for (const [cmd, pre] of candidates) {
    if (works(cmd, [...pre, '-c', 'import sys; assert sys.version_info >= (3, 10)'])) {
      return {
        command: cmd,
        prefix: [...pre, '-m', 'cs_py'],
        env: withPythonPath(env),
        how: `Python on this PC (${cmd})`,
      }
    }
  }
  return null
}

/** For tests. */
export function resetPythonCache(): void {
  cached = undefined
}
