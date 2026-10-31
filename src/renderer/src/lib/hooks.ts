import { useEffect, useState } from 'react'

/** Current time, re-rendering every `intervalMs`. Drives "last update N s ago". */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

/**
 * Resolved dark mode: the saved choice wins; "system" follows Windows. (Main also sets
 * nativeTheme.themeSource so native chrome and the media query agree.)
 */
export function useDarkMode(theme: 'system' | 'light' | 'dark' = 'system'): boolean {
  const systemDark = useSystemDark()
  return theme === 'dark' || (theme === 'system' && systemDark)
}

function useSystemDark(): boolean {
  const query = '(prefers-color-scheme: dark)'
  const [dark, setDark] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = (): void => setDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return dark
}
