import { z } from 'zod'

export const ThemeSchema = z.enum(['system', 'light', 'dark'])
export type Theme = z.infer<typeof ThemeSchema>

/** Secrets the app can store. Values never leave the main process. */
export const SecretNameSchema = z.enum(['anthropicApiKey', 'mcpToken'])
export type SecretName = z.infer<typeof SecretNameSchema>

/** Secrets the renderer may set or clear (the MCP token is managed by main only). */
export const UserSecretNameSchema = z.enum(['anthropicApiKey'])

/** On-disk settings file (%APPDATA%\Course Studio\settings.json). Secrets are safeStorage-encrypted base64. */
export const SettingsFileSchema = z.object({
  version: z.literal(1).default(1),
  theme: ThemeSchema.default('system'),
  /** Local MCP server so Claude Code can drive the app. Off until the instructor turns it on. */
  mcp: z
    .object({
      enabled: z.boolean().default(false),
      port: z.number().int().min(1024).max(65535).default(39217),
    })
    .default({ enabled: false, port: 39217 }),
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

export const McpStatusSchema = z.object({
  enabled: z.boolean(),
  running: z.boolean(),
  url: z.string(),
  /** Plain-English problem, e.g. the port is taken. */
  error: z.string().nullable(),
})
export type McpStatus = z.infer<typeof McpStatusSchema>

export const PublicSettingsSchema = z.object({
  theme: ThemeSchema,
  mcp: McpStatusSchema,
  secrets: z.object({ anthropicApiKey: SecretStatusSchema }),
  settingsPath: z.string(),
  encryptionAvailable: z.boolean(),
})
export type PublicSettings = z.infer<typeof PublicSettingsSchema>

export function secretHint(value: string): string | null {
  const v = value.trim()
  return v.length >= 8 ? v.slice(-4) : null
}
