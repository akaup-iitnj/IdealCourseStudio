import { safeStorage } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  SettingsFileSchema,
  secretHint,
  type PublicSettings,
  type SecretName,
  type SettingsFile,
  type Theme,
} from '@shared/settings'
import { log } from './log'
import { settingsDir } from './paths'

const SECRET_NAMES: SecretName[] = ['anthropicApiKey']

/**
 * %APPDATA%\Course Studio\settings.json. Secrets are encrypted with Electron safeStorage (DPAPI on
 * Windows) and stored as base64. Decrypted values only ever exist inside the main process.
 */
export class SettingsStore {
  private data: SettingsFile = SettingsFileSchema.parse({})
  readonly path = join(settingsDir(), 'settings.json')

  async load(): Promise<void> {
    try {
      const raw = JSON.parse(await readFile(this.path, 'utf8'))
      const parsed = SettingsFileSchema.safeParse(raw)
      if (parsed.success) this.data = parsed.data
      else
        void log(
          'settings',
          `settings.json did not match schema; using defaults: ${parsed.error.message}`,
        )
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        void log('settings', `could not read settings.json: ${(err as Error).message}`)
      }
    }
  }

  get theme(): Theme {
    return this.data.theme
  }

  async setTheme(theme: Theme): Promise<void> {
    this.data.theme = theme
    await this.save()
  }

  encryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async setSecret(name: SecretName, value: string): Promise<void> {
    const v = value.trim()
    if (!v) return this.clearSecret(name)
    if (!this.encryptionAvailable()) {
      throw new Error('This PC cannot encrypt saved keys right now, so the key was not saved.')
    }
    this.data.secrets[name] = safeStorage.encryptString(v).toString('base64')
    await this.save()
  }

  async clearSecret(name: SecretName): Promise<void> {
    delete this.data.secrets[name]
    await this.save()
  }

  /** Main process only. Never send the return value over IPC. */
  getSecret(name: SecretName): string | null {
    const enc = this.data.secrets[name]
    if (!enc) return null
    try {
      return safeStorage.decryptString(Buffer.from(enc, 'base64'))
    } catch (err) {
      void log('settings', `could not decrypt ${name}: ${(err as Error).message}`)
      return null
    }
  }

  toPublic(): PublicSettings {
    const secrets = Object.fromEntries(
      SECRET_NAMES.map((name) => {
        const v = this.getSecret(name)
        return [name, { set: v != null, hint: v ? secretHint(v) : null }]
      }),
    ) as PublicSettings['secrets']
    return {
      theme: this.data.theme,
      secrets,
      settingsPath: this.path,
      encryptionAvailable: this.encryptionAvailable(),
    }
  }

  private async save(): Promise<void> {
    await mkdir(settingsDir(), { recursive: true })
    const tmp = `${this.path}.tmp`
    await writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8')
    await rename(tmp, this.path)
  }
}
