import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import { parseJobLine, type JobSnapshot, type StartJobRequest } from '@shared/jobs'
import { log } from '../log'
import { resolvePython } from '../python'
import { JobTracker } from './tracker'

interface JobEntry {
  tracker: JobTracker
  request: StartJobRequest
  child: ChildProcess | null
  stderrTail: string[]
}

const TITLES: Record<StartJobRequest['kind'], string> = {
  hello: 'Sample job',
}

export interface JobRunnerOptions {
  stuckAfterMs?: number
  tickMs?: number
  now?: () => number
  onUpdate: (snapshot: JobSnapshot) => void
}

/**
 * Spawns `cs_py` helpers, reads JSON Lines from stdout, and keeps a tracker per job.
 * A 1 s clock marks silent jobs as stuck. (Persisting jobs to project.json arrives with projects in M1/M6.)
 */
export class JobRunner {
  private jobs = new Map<string, JobEntry>()
  private timer: NodeJS.Timeout
  private readonly now: () => number

  constructor(private readonly opts: JobRunnerOptions) {
    this.now = opts.now ?? Date.now
    this.timer = setInterval(() => this.tickAll(), opts.tickMs ?? 1000)
    this.timer.unref?.()
  }

  list(): JobSnapshot[] {
    return [...this.jobs.values()].map((j) => j.tracker.snapshot)
  }

  start(request: StartJobRequest): JobSnapshot {
    const id = randomUUID()
    const tracker = new JobTracker(id, request.kind, TITLES[request.kind], this.opts.stuckAfterMs)
    const entry: JobEntry = { tracker, request, child: null, stderrTail: [] }
    this.jobs.set(id, entry)
    this.launch(entry)
    return tracker.snapshot
  }

  retry(id: string): JobSnapshot {
    const entry = this.mustGet(id)
    this.kill(entry)
    const fresh = new JobTracker(
      id,
      entry.request.kind,
      TITLES[entry.request.kind],
      this.opts.stuckAfterMs,
    )
    entry.tracker = fresh
    entry.stderrTail = []
    this.launch({ ...entry, request: { ...entry.request, hang: false } })
    return fresh.snapshot
  }

  cancel(id: string): void {
    const entry = this.mustGet(id)
    if (entry.tracker.isFinished()) return
    entry.tracker.finish(this.now(), 'cancelled', 'Stopped')
    this.kill(entry)
    this.emit(entry)
  }

  dismiss(id: string): void {
    const entry = this.jobs.get(id)
    if (!entry) return
    this.kill(entry)
    this.jobs.delete(id)
  }

  dispose(): void {
    clearInterval(this.timer)
    for (const e of this.jobs.values()) this.kill(e)
  }

  private launch(entry: JobEntry): void {
    const { tracker, request } = entry
    this.jobs.set(tracker.snapshot.id, entry)
    const py = resolvePython()
    tracker.start(this.now())
    if (!py) {
      tracker.finish(
        this.now(),
        'failed',
        'Course Studio could not find its Python helper on this PC. Reinstalling the app should fix this.',
      )
      this.emit(entry)
      return
    }
    const args = [...py.prefix, request.kind]
    if (request.seconds) args.push('--seconds', String(request.seconds))
    if (request.hang) args.push('--hang')
    void log('jobs', `start ${tracker.snapshot.id}: ${py.command} ${args.join(' ')}`)

    const child = spawn(py.command, args, {
      env: { ...py.env, CS_PARENT_WATCHDOG: '1' },
      windowsHide: true,
      // stdin stays open as a lifeline: when the app exits, the helper sees EOF and quits.
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    entry.child = child
    this.emit(entry)

    createInterface({ input: child.stdout! }).on('line', (raw) => {
      if (entry.child !== child) return
      const parsed = parseJobLine(raw)
      if (parsed && tracker.applyLine(parsed, this.now())) this.emit(entry)
    })
    createInterface({ input: child.stderr! }).on('line', (raw) => {
      void log('python', raw)
      entry.stderrTail.push(raw)
      if (entry.stderrTail.length > 20) entry.stderrTail.shift()
    })
    child.on('error', (err) => {
      void log('jobs', `spawn error ${tracker.snapshot.id}: ${err.message}`)
      if (entry.child !== child) return
      tracker.finish(
        this.now(),
        'failed',
        'The helper program could not start. Details are in the log file.',
      )
      this.emit(entry)
    })
    child.on('close', (code) => {
      if (entry.child !== child) return
      entry.child = null
      if (tracker.isFinished()) return
      if (code === 0) {
        tracker.finish(this.now(), 'done', tracker.snapshot.message || 'Finished')
      } else {
        void log('jobs', `exit ${code} ${tracker.snapshot.id}\n${entry.stderrTail.join('\n')}`)
        tracker.finish(
          this.now(),
          'failed',
          'The helper stopped unexpectedly. Details are in the log file.',
        )
      }
      this.emit(entry)
    })
  }

  private kill(entry: JobEntry): void {
    const child = entry.child
    entry.child = null
    if (child && child.exitCode === null) child.kill()
  }

  private tickAll(): void {
    const now = this.now()
    for (const e of this.jobs.values()) if (e.tracker.tick(now)) this.emit(e)
  }

  private emit(entry: JobEntry): void {
    this.opts.onUpdate(entry.tracker.snapshot)
  }

  private mustGet(id: string): JobEntry {
    const e = this.jobs.get(id)
    if (!e) throw new Error('That job no longer exists.')
    return e
  }
}
