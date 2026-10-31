import { spawn } from 'node:child_process'
import { cpus, release, totalmem, version } from 'node:os'
import { createInterface } from 'node:readline'
import { app } from 'electron'
import { GpuInfoSchema, type GpuInfo, type SystemInfo } from '@shared/system'
import { parseJobLine } from '@shared/jobs'
import { log } from './log'
import { resolvePython } from './python'

let gpuCache: Promise<{ gpu: GpuInfo | null; version: string | null }> | null = null

/** Ask `cs_py gpu` (torch first, then nvidia-smi). Cached for the session. */
function probePython(): Promise<{ gpu: GpuInfo | null; version: string | null }> {
  gpuCache ??= new Promise((resolve) => {
    const py = resolvePython()
    if (!py) return resolve({ gpu: null, version: null })
    const child = spawn(py.command, [...py.prefix, 'gpu'], { env: py.env, windowsHide: true })
    let out: { gpu: GpuInfo | null; version: string | null } = { gpu: null, version: null }
    const timer = setTimeout(() => child.kill(), 30_000)
    createInterface({ input: child.stdout }).on('line', (raw) => {
      const line = parseJobLine(raw)
      if (line?.type !== 'result') return
      const data = line.data as { gpu?: unknown; python?: string }
      const gpu = GpuInfoSchema.safeParse(data?.gpu)
      out = { gpu: gpu.success ? gpu.data : null, version: data?.python ?? null }
    })
    child.stderr.on('data', (d) => void log('python', String(d)))
    child.on('error', () => resolve(out))
    child.on('close', () => {
      clearTimeout(timer)
      resolve(out)
    })
  })
  return gpuCache
}

export async function systemInfo(): Promise<SystemInfo> {
  const py = resolvePython()
  const probe = await probePython()
  const cpuList = cpus()
  const osName =
    process.platform === 'win32'
      ? `Windows ${Number(release().split('.')[2] ?? 0) >= 22000 ? '11' : '10'} (${release()})`
      : `${version()} (${release()})`
  return {
    os: osName,
    cpu: cpuList[0]?.model.trim() ?? 'Unknown',
    cores: cpuList.length,
    ramGb: Math.round(totalmem() / 1024 ** 3),
    appVersion: app.getVersion(),
    python:
      py && probe.version
        ? { ok: true, version: probe.version, how: py.how }
        : { ok: false, reason: py ? 'Python helper did not answer.' : 'Python helper not found.' },
    gpu: probe.gpu,
  }
}
