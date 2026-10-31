import { describe, expect, it } from 'vitest'
import { formatAgo, formatDuration } from './format'

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(0)).toBe('0 s')
    expect(formatDuration(59.4)).toBe('59 s')
    expect(formatDuration(185)).toBe('3 min 05 s')
    expect(formatDuration(3720)).toBe('1 h 02 min')
  })
})

describe('formatAgo', () => {
  it('reads naturally', () => {
    expect(formatAgo(1000, 1500)).toBe('just now')
    expect(formatAgo(0, 4000)).toBe('4 s ago')
    expect(formatAgo(0, 125_000)).toBe('2 min ago')
  })
})
