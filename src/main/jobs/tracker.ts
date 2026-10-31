import {
  STUCK_AFTER_MS,
  estimateSecondsLeft,
  type JobKind,
  type JobLine,
  type JobSnapshot,
} from '@shared/jobs'

const MAX_LOG = 200

/**
 * Pure state for one job: feed it lines and clock ticks, read a snapshot.
 * No I/O here so it is easy to test; the runner owns the child process.
 */
export class JobTracker {
  private s: JobSnapshot

  constructor(
    id: string,
    kind: JobKind,
    title: string,
    private readonly stuckAfterMs = STUCK_AFTER_MS,
  ) {
    this.s = {
      id,
      kind,
      title,
      status: 'queued',
      step: null,
      chapter: null,
      page: null,
      of: null,
      message: 'Waiting to start',
      startedAt: null,
      finishedAt: null,
      lastLineAt: null,
      etaSeconds: null,
      stuckReason: null,
      log: [],
    }
  }

  get snapshot(): JobSnapshot {
    return { ...this.s, log: [...this.s.log] }
  }

  get status(): JobSnapshot['status'] {
    return this.s.status
  }

  start(now: number): void {
    this.s = {
      ...this.s,
      status: 'running',
      startedAt: now,
      lastLineAt: now,
      finishedAt: null,
      stuckReason: null,
      message: 'Starting',
      step: null,
      page: null,
      of: null,
      etaSeconds: null,
    }
    this.addLog(now, 'info', 'Started')
  }

  /** Apply one protocol line. Returns true if the snapshot changed. */
  applyLine(line: JobLine, now: number): boolean {
    if (this.isFinished()) return false
    const wasStuck = this.s.status === 'stuck'
    this.s.lastLineAt = now
    if (wasStuck) {
      this.s.status = 'running'
      this.s.stuckReason = null
      this.addLog(now, 'info', 'Working again')
    }
    if (line.step !== undefined) this.s.step = line.step
    if (line.chapter !== undefined) this.s.chapter = String(line.chapter)
    if (line.page !== undefined) this.s.page = line.page
    if (line.of !== undefined) this.s.of = line.of

    switch (line.type) {
      case 'progress':
        if (line.msg) this.s.message = line.msg
        break
      case 'log':
        if (line.msg) this.addLog(now, 'info', line.msg)
        break
      case 'result':
        this.s.result = line.data
        if (line.msg) this.s.message = line.msg
        if (line.msg) this.addLog(now, 'info', line.msg)
        break
      case 'error':
        this.s.message = line.msg || 'Something went wrong'
        this.addLog(now, 'error', this.s.message)
        break
    }
    this.s.etaSeconds =
      this.s.startedAt == null
        ? null
        : estimateSecondsLeft(this.s.startedAt, now, this.s.page, this.s.of)
    return true
  }

  /** Clock tick. Marks the job stuck after the silence limit. Returns true if it changed. */
  tick(now: number): boolean {
    if (this.s.status !== 'running' || this.s.lastLineAt == null) return false
    const silentMs = now - this.s.lastLineAt
    if (silentMs < this.stuckAfterMs) return false
    const secs = Math.round(silentMs / 1000)
    const where = [this.s.step, this.s.chapter && `chapter ${this.s.chapter}`]
      .filter(Boolean)
      .join(', ')
    this.s.status = 'stuck'
    this.s.stuckReason = `No update for ${secs} seconds${where ? ` while on: ${where}` : ''}. The helper may be frozen or waiting on something.`
    this.addLog(now, 'error', this.s.stuckReason)
    return true
  }

  finish(now: number, outcome: 'done' | 'failed' | 'cancelled', message?: string): void {
    if (this.isFinished()) return
    this.s.status = outcome
    this.s.finishedAt = now
    this.s.etaSeconds = outcome === 'done' ? 0 : null
    this.s.stuckReason = null
    if (message) this.s.message = message
    this.addLog(now, outcome === 'failed' ? 'error' : 'info', message ?? outcome)
  }

  isFinished(): boolean {
    return ['done', 'failed', 'cancelled'].includes(this.s.status)
  }

  private addLog(at: number, level: 'info' | 'error', msg: string): void {
    this.s.log.push({ at, level, msg })
    if (this.s.log.length > MAX_LOG) this.s.log.splice(0, this.s.log.length - MAX_LOG)
  }
}
