import { z } from 'zod'

export const ThemeSchema = z.enum(['system', 'light', 'dark'])
export type Theme = z.infer<typeof ThemeSchema>

/** Secrets the app can store. Values never leave the main process. */
export const SecretNameSchema = z.enum(['anthropicApiKey'])
export type SecretName = z.infer<typeof SecretNameSchema>

/** On-disk settings file (%APPDATA%\Course Studio\settings.json). Secrets are safeStorage-encrypted base64. */
export const SettingsFileSchema = z.object({
  version: z.literal(1).default(1),
  theme: ThemeSchema.default('system'),
  secrets: z.partialRecord(SecretNameSchema, z.string()).default({}),
})
export type SettingsFile = z.infer<typeof SettingsFileSchema>

/** What the renderer is allowed to know about a secret. */
export const SecretStatusSchema = z.object({
  set: z.boolean(),
  /** Last 4 characters only, for recognition. */
  hint: z.string().nullable(),
})
export type SecretStatus = z.infer<typeof SecretStatusSchema>

export const PublicSettingsSchema = z.object({
  theme: ThemeSchema,
  secrets: z.record(SecretNameSchema, SecretStatusSchema),
  settingsPath: z.string(),
  encryptionAvailable: z.boolean(),
})
export type PublicSettings = z.infer<typeof PublicSettingsSchema>

export function secretHint(value: string): string | null {
  const v = value.trim()
  return v.length >= 8 ? v.slice(-4) : null
}
