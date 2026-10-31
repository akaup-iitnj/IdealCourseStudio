import type { CourseStudioApi } from '@shared/ipc'

/** Typed bridge to the main process. The only way the renderer talks to the system. */
export const api: CourseStudioApi = window.cs

const params = new URLSearchParams(window.location.search)
export const chromeMode: 'mica' | 'solid' = params.get('chrome') === 'mica' ? 'mica' : 'solid'
export const platform = params.get('platform') ?? api?.platform ?? 'win32'
