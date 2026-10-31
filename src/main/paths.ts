import { app } from 'electron'
import { join } from 'node:path'

export const APP_NAME = 'Course Studio'

/** %APPDATA%\Course Studio — settings.json lives here. */
export function settingsDir(): string {
  return process.env.CS_USER_DATA_DIR ?? app.getPath('userData')
}

/** %LOCALAPPDATA%\Course Studio — logs and (later) models. Falls back to userData off Windows. */
export function localDataDir(): string {
  if (process.env.CS_USER_DATA_DIR) return process.env.CS_USER_DATA_DIR
  const local = process.env.LOCALAPPDATA
  return local ? join(local, APP_NAME) : app.getPath('userData')
}

export function logsDir(): string {
  return join(localDataDir(), 'logs')
}

export function modelsDir(): string {
  return join(localDataDir(), 'models')
}

/** Folder holding the `cs_py` package: repo `python/` in dev, `resources/python` when installed. */
export function pythonProjectDir(): string {
  return app.isPackaged ? join(process.resourcesPath, 'python') : join(app.getAppPath(), 'python')
}

/** Bundled python-build-standalone runtime (added in M9). */
export function bundledPythonDir(): string {
  return join(process.resourcesPath, 'python-runtime')
}
