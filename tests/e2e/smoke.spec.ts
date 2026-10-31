import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let app: ElectronApplication
let page: Page
let dataDir: string

test.beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'cs-e2e-'))
  // Launch the repo as the app (package.json "main" → out/main/index.js), like `electron .`.
  const args = [join(__dirname, '../..')]
  // CI containers run as root without a desktop keyring.
  if (process.platform === 'linux') args.unshift('--no-sandbox', '--password-store=basic')
  app = await electron.launch({
    args,
    env: {
      ...process.env,
      CS_USER_DATA_DIR: dataDir,
      CS_STUCK_MS: '3000',
      CS_FORCE_CPU: '1',
      CS_E2E: '1',
      NODE_ENV: 'production',
    },
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app?.close()
  rmSync(dataDir, { recursive: true, force: true })
})

test('window is secure and shows the Projects empty state', async () => {
  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const wc = BrowserWindow.getAllWindows()[0]!.webContents
    // @ts-expect-error internal but stable enough for a smoke test
    const p = wc.getLastWebPreferences?.() ?? {}
    return {
      contextIsolation: p.contextIsolation,
      sandbox: p.sandbox,
      nodeIntegration: p.nodeIntegration,
    }
  })
  expect(prefs).toEqual({ contextIsolation: true, sandbox: true, nodeIntegration: false })
  expect(await page.evaluate(() => typeof (globalThis as { require?: unknown }).require)).toBe(
    'undefined',
  )

  await expect(page.getByRole('heading', { name: 'Course projects' })).toBeVisible()
  await expect(page.getByTestId('projects-empty')).toBeVisible()
  await expect(page.getByTestId('breadcrumb')).toHaveText('Projects')
})

test('sample job shows live progress and finishes', async () => {
  await page.getByTestId('start-sample').click()
  const card = page.getByTestId('job-card').first()
  await expect(card).toHaveAttribute('data-status', 'running')
  await expect(card.getByTestId('job-message')).toContainText('Reading sample page')
  await expect(card.getByTestId('job-last-update')).not.toHaveText('—')
  await expect(card).toHaveAttribute('data-status', 'done', { timeout: 20_000 })
})

test('a frozen job turns stuck with a reason, and Retry recovers', async () => {
  await page.getByTestId('start-hang').click()
  const card = page.locator('[data-testid="job-card"]').first()
  await expect(card).toHaveAttribute('data-status', 'running')
  await expect(card).toHaveAttribute('data-status', 'stuck', { timeout: 15_000 })
  await expect(card.getByTestId('job-stuck-reason')).toContainText('No update for')
  await card.getByRole('button', { name: 'Retry' }).click()
  await expect(card).toHaveAttribute('data-status', 'running')
  await card.getByRole('button', { name: 'Stop' }).click()
  await expect(card).toHaveAttribute('data-status', 'cancelled')
})

test('Settings saves the key encrypted and never shows it back', async () => {
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('button', { name: 'Settings' })
    .click()
  await expect(page.getByTestId('breadcrumb')).toHaveText('Settings')
  await expect(page.getByTestId('key-status')).toHaveText(/Not set/)

  const fakeKey = 'sk-ant-test-0123456789abcdWXYZ'
  await page.getByTestId('claude-key-input').fill(fakeKey)
  await page.getByTestId('save-key').click()
  await expect(page.getByTestId('key-status')).toContainText('ends in WXYZ')
  await expect(page.getByTestId('claude-key-input')).toHaveValue('')

  const file = readFileSync(join(dataDir, 'settings.json'), 'utf8')
  expect(file).not.toContain(fakeKey)
  expect(JSON.parse(file).secrets.anthropicApiKey).toBeTruthy()
  expect(await page.content()).not.toContain(fakeKey)

  await expect(page.getByTestId('pc-Graphics card')).toContainText('CPU only', { timeout: 20_000 })
  await expect(page.getByTestId('pc-Python helper')).toContainText('Python 3.')
})

test('Ctrl+K opens the command palette and switches theme', async () => {
  await page.keyboard.press('Control+K')
  await expect(page.getByPlaceholder('Type a command or search…')).toBeVisible()
  await page.keyboard.type('Dark theme')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ path: 'test-results/settings-dark.png' })
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('button', { name: 'Projects' })
    .click()
  await page.screenshot({ path: 'test-results/projects-dark.png' })
})
