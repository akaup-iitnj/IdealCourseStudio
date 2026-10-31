import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { IPC_CHANNELS, IPC_EVENTS } from './ipc'

describe('IPC contract', () => {
  it('preload allow-list matches the contract exactly', () => {
    const preload = readFileSync(join(__dirname, '../preload/index.ts'), 'utf8')
    const listed = [...preload.matchAll(/'([a-z]+:[A-Za-z]+)'/g)].map((m) => m[1])
    expect(new Set(listed)).toEqual(new Set([...IPC_CHANNELS, ...IPC_EVENTS]))
  })
})
