import { z } from 'zod'

/**
 * JSON Lines protocol spoken by every `cs_py` tool on stdout. One object per line.
 * `msg` is always plain English for the instructor; technical detail goes to the log file.
 */
export const JobLineSchema = z.object({
  type: z.enum(['progress', 'log', 'result', 'error']),
  step: z.string().optional(),
  chapter: z.union([z.string(), z.number()]).optional(),
  page: z.number().optional(),
  of: z.number().optional(),
  msg: z.string().default(''),
  data: z.unknown().optional(),
})
export type JobLine = z.infer<typeof JobLineSchema>

export const JobStatusSchema = z.enum(['queued', 'running', 'stuck', 'done', 'failed', 'cancelled'])
export type JobStatus = z.infer<typeof JobStatusSchema>

export const JobKindSchema = z.enum(['hello'])
export type JobKind = z.infer<typeof JobKindSchema>

export const JobLogEntrySchema = z.object({
  at: z.number(),
  level: z.enum(['info', 'error']),
  msg: z.string(),
})
export type JobLogEntry = z.infer<typeof JobLogEntrySchema>

/** What the renderer sees about a job. Never contains secrets or raw stack traces. */
export const JobSnapshotSchema = z.object({
  id: z.string(),
  kind: JobKindSchema,
  title: z.string(),
  status: JobStatusSchema,
  step: z.string().nullable(),
  chapter: z.string().nullable(),
  page: z.number().nullable(),
  of: z.number().nullable(),
  message: z.string(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
  lastLineAt: z.number().nullable(),
  /** Seconds left, from measured pace. Null when we can't honestly estimate yet. */
  etaSeconds: z.number().nullable(),
  stuckReason: z.string().nullable(),
  log: z.array(JobLogEntrySchema),
  result: z.unknown().optional(),
})
export type JobSnapshot = z.infer<typeof JobSnapshotSchema>

export const StartJobRequestSchema = z.object({
  kind: JobKindSchema,
  /** Test hook for the fake job: go silent after a few lines so the stuck state shows. */
  hang: z.boolean().optional(),
  seconds: z.number().int().min(1).max(600).optional(),
})
export type StartJobRequest = z.infer<typeof StartJobRequestSchema>

/** A job is marked stuck after this long without a line from the helper. */
export const STUCK_AFTER_MS = 60_000
/** Helpers promise a line at least this often while working. */
export const HEARTBEAT_MS = 5_000

/**
 * Parse one stdout line. Non-JSON or invalid lines become a log line rather than crashing the job,
 * so a stray `print()` in a helper never breaks progress.
 */
export function parseJobLine(raw: string): JobLine | null {
  const line = raw.trim()
  if (!line) return null
  try {
    const parsed = JobLineSchema.safeParse(JSON.parse(line))
    if (parsed.success) return parsed.data
  } catch {
    // fall through
  }
  return { type: 'log', msg: line }
}

/**
 * Honest time-left estimate from measured pace: elapsed / done * remaining.
 * Returns null until at least one unit is done, so we never show a made-up number.
 */
export function estimateSecondsLeft(
  startedAt: number,
  now: number,
  page: number | null,
  of: number | null,
): number | null {
  if (page == null || of == null || of <= 0 || page <= 0) return null
  const done = Math.min(page, of)
  const elapsed = (now - startedAt) / 1000
  if (elapsed <= 0) return null
  return Math.max(0, Math.round((elapsed / done) * (of - done)))
}
