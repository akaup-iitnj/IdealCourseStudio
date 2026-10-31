import { z } from 'zod'

export const GpuInfoSchema = z.object({
  available: z.boolean(),
  name: z.string().nullable(),
  vramGb: z.number().nullable(),
  driver: z.string().nullable(),
  /** How we found out: torch, nvidia-smi, forced CPU, or none. */
  source: z.enum(['torch', 'nvidia-smi', 'forced-cpu', 'none']),
})
export type GpuInfo = z.infer<typeof GpuInfoSchema>

export const SystemInfoSchema = z.object({
  os: z.string(),
  cpu: z.string(),
  cores: z.number(),
  ramGb: z.number(),
  appVersion: z.string(),
  python: z
    .object({ ok: z.literal(true), version: z.string(), how: z.string() })
    .or(z.object({ ok: z.literal(false), reason: z.string() })),
  gpu: GpuInfoSchema.nullable(),
})
export type SystemInfo = z.infer<typeof SystemInfoSchema>
