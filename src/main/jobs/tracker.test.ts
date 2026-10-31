import { describe, expect, it } from 'vitest'
import { parseJobLine, estimateSecondsLeft } from '@shared/jobs'
import { JobTracker } from './tracker'

const line = (s: object) => parseJobLine(JSON.stringify(s))!

describe('parseJobLine', () => {
  it('parses protocol lines', () => {
    expect(line({ type: 'progress', step: 'Cutting', page: 2, of: 10, msg: 'Hi' })).toMatchObject({
      type: 'progress',
      page: 2,
    })
  })
  it('turns stray output into a log line instead of failing', () => {
    expect(parseJobLine('Traceback (most recent call last):')).toEqual({
      type: 'log',
      msg: 'Traceback (most recent call last):',
    })
    expect(parseJobLine('{"type":"nope"}')).toMatchObject({ type: 'log' })
  })
  it('ignores blank lines', () => {
    expect(parseJobLine('   ')).toBeNull()
  })
})

describe('estimateSecondsLeft', () => {
  it('is null until something is done', () => {
    expect(estimateSecondsLeft(0, 5000, 0, 10)).toBeNull()
    expect(estimateSecondsLeft(0, 5000, null, null)).toBeNull()
  })
  it('extrapolates from measured pace', () => {
    expect(estimateSecondsLeft(0, 10_000, 2, 10)).toBe(40)
  })
})

describe('JobTracker', () => {
  it('tracks progress and finishes', () => {
    const t = new JobTracker('1', 'hello', 'Sample job', 60_000)
    t.start(0)
    t.applyLine(
      line({ type: 'progress', step: 'Counting', page: 5, of: 10, msg: 'Page 5 of 10' }),
      5000,
    )
    expect(t.snapshot).toMatchObject({ status: 'running', page: 5, of: 10, etaSeconds: 5 })
    t.finish(10_000, 'done', 'All done')
    expect(t.snapshot).toMatchObject({ status: 'done', etaSeconds: 0, message: 'All done' })
  })

  it('goes stuck after the silence limit, with a reason, and recovers on the next line', () => {
    const t = new JobTracker('1', 'hello', 'Sample job', 60_000)
    t.start(0)
    t.applyLine(line({ type: 'progress', step: 'Reading pictures', chapter: 3, msg: 'x' }), 1000)
    expect(t.tick(60_000)).toBe(false)
    expect(t.tick(61_000)).toBe(true)
    const s = t.snapshot
    expect(s.status).toBe('stuck')
    expect(s.stuckReason).toContain('60 seconds')
    expect(s.stuckReason).toContain('Reading pictures, chapter 3')
    t.applyLine(line({ type: 'progress', msg: 'back' }), 62_000)
    expect(t.snapshot.status).toBe('running')
    expect(t.snapshot.stuckReason).toBeNull()
  })

  it('ignores lines after finishing', () => {
    const t = new JobTracker('1', 'hello', 'Sample job')
    t.start(0)
    t.finish(1, 'cancelled')
    expect(t.applyLine(line({ type: 'progress', msg: 'late' }), 2)).toBe(false)
  })
})
