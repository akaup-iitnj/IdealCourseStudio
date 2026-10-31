import type { CourseStudioApi } from '../shared/ipc'

declare global {
  interface Window {
    cs: CourseStudioApi
  }
}

export {}
