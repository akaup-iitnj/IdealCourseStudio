/** "12 s", "3 min 05 s", "1 h 02 min". Teacher-friendly, no colons to misread. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${String(s % 60).padStart(2, '0')} s`
  const h = Math.floor(m / 60)
  return `${h} h ${String(m % 60).padStart(2, '0')} min`
}

/** "just now", "4 s ago", "2 min ago". */
export function formatAgo(thenMs: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - thenMs) / 1000))
  if (s < 1) return 'just now'
  if (s < 60) return `${s} s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)} h ago`
}
