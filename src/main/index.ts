import {
  app,
  BrowserWindow,
  nativeTheme,
  safeStorage,
  session,
  shell,
  type WebContents,
} from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { JobRunner } from './jobs/runner'
import { registerIpc } from './ipc'
import { log } from './log'
import { APP_NAME } from './paths'
import { SettingsStore } from './settings'
import { CHROME, TITLE_BAR_HEIGHT } from './theme'

app.setName(APP_NAME)
if (process.platform === 'win32') app.setAppUserModelId('edu.idealinstitute.coursestudio')

let mainWindow: BrowserWindow | null = null
const settings = new SettingsStore()

function chrome() {
  return nativeTheme.shouldUseDarkColors ? CHROME.dark : CHROME.light
}

function applyTheme(): void {
  nativeTheme.themeSource = settings.theme
}

function updateChrome(): void {
  if (!mainWindow) return
  const c = chrome()
  if (process.platform !== 'darwin') {
    mainWindow.setTitleBarOverlay?.({
      color: c.overlay,
      symbolColor: c.symbol,
      height: TITLE_BAR_HEIGHT,
    })
  }
  if (!isMica()) mainWindow.setBackgroundColor(c.background)
}

/** Mica only on Windows 11 (build 22000+). Elsewhere we paint a solid background. */
function isMica(): boolean {
  if (process.platform !== 'win32') return false
  const build = Number(process.getSystemVersion().split('.')[2] ?? 0)
  return build >= 22000
}

function createWindow(): void {
  const c = chrome()
  const mica = isMica()
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: APP_NAME,
    backgroundColor: mica ? '#00000000' : c.background,
    ...(mica ? { backgroundMaterial: 'mica' as const } : {}),
    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin'
      ? { titleBarOverlay: { color: c.overlay, symbolColor: c.symbol, height: TITLE_BAR_HEIGHT } }
      : { trafficLightPosition: { x: 14, y: 12 } }),
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => (mainWindow = null))

  // Never navigate away or open new windows inside the app; real links go to the browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault())

  // The renderer reads ?chrome= to know whether Mica shows through (transparent chrome) or not.
  const query = { chrome: mica ? 'mica' : 'solid', platform: process.platform }
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    const url = new URL(process.env.ELECTRON_RENDERER_URL)
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
    void mainWindow.loadURL(url.toString())
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { query })
  }
}

function isTrustedSender(sender: WebContents): boolean {
  return mainWindow != null && sender === mainWindow.webContents
}

const jobs = new JobRunner({
  stuckAfterMs: process.env.CS_STUCK_MS ? Number(process.env.CS_STUCK_MS) : undefined,
  onUpdate: (snapshot) => mainWindow?.webContents.send('jobs:update', snapshot),
})

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow?.isMinimized()) mainWindow.restore()
    mainWindow?.focus()
  })

  void app.whenReady().then(async () => {
    // Linux CI containers have no keyring. Only for automated tests, never on Windows.
    if (process.platform === 'linux' && process.env.CS_E2E === '1') {
      safeStorage.setUsePlainTextEncryption?.(true)
    }
    await settings.load()
    applyTheme()
    nativeTheme.on('updated', updateChrome)

    // Deny every permission request (camera, notifications, ...) until a feature needs one.
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))

    registerIpc({ settings, jobs, applyTheme, isTrustedSender })
    createWindow()
    void log(
      'app',
      `started ${app.getVersion()} on ${process.platform} ${process.getSystemVersion()}`,
    )

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('before-quit', () => jobs.dispose())
app.on('window-all-closed', () => {
  jobs.dispose()
  if (process.platform !== 'darwin') app.quit()
})
