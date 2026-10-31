import { motion } from 'motion/react'
import {
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  FolderOpen,
  LoaderCircle,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { KeyTestResult } from '@shared/ipc'
import type { Theme } from '@shared/settings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useApp } from '@/stores/app'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 32 } },
}

export function SettingsScreen() {
  const settings = useApp((s) => s.settings)
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex max-w-[880px] flex-col gap-6"
    >
      <motion.div variants={rise} className="flex flex-col gap-1.5">
        <span className="eyebrow">One settings file for this install</span>
        <h1 className="text-[26px] font-[650] tracking-[-0.01em]">Keys and connections</h1>
        <p className="text-muted">
          Stored in{' '}
          <span className="selectable font-mono text-[12.5px] text-ink" data-testid="settings-path">
            {settings?.settingsPath ?? '…'}
          </span>
          , encrypted by Windows. Never copied into a project folder.
        </p>
      </motion.div>

      <motion.div variants={rise}>
        <ClaudeKeyCard />
      </motion.div>

      <motion.div variants={rise}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Canvas</CardTitle>
              <Badge>Build 3</Badge>
            </div>
            <p className="text-[13px] text-muted">
              The app publishes into an existing Canvas course. It never creates a new one.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Canvas address">
              <Input disabled placeholder="https://ideal.instructure.com" />
            </Field>
            <Field label="API token">
              <Input disabled type="password" placeholder="Arrives in Build 3" />
            </Field>
            <Field label="Course ID">
              <Input disabled placeholder="12345" />
            </Field>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={rise}>
        <ClaudeCodeCard />
      </motion.div>

      <motion.div variants={rise}>
        <AppearanceCard />
      </motion.div>

      <motion.div variants={rise}>
        <ThisPcCard />
      </motion.div>
    </motion.div>
  )
}

function ClaudeKeyCard() {
  const settings = useApp((s) => s.settings)
  const setSettings = useApp((s) => s.setSettings)
  const [value, setValue] = useState('')
  const [reveal, setReveal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<KeyTestResult | null>(null)
  const status = settings?.secrets.anthropicApiKey

  async function save(): Promise<void> {
    setSaving(true)
    setResult(null)
    try {
      setSettings(await api.invoke('settings:setSecret', { name: 'anthropicApiKey', value }))
      setValue('')
      toast.success('Key saved and encrypted on this PC.')
    } catch (err) {
      toast.error(cleanError(err))
    } finally {
      setSaving(false)
    }
  }

  async function test(): Promise<void> {
    setTesting(true)
    setResult(null)
    try {
      setResult(await api.invoke('claude:testKey', value ? { value } : {}))
    } catch (err) {
      setResult({ ok: false, message: cleanError(err) })
    } finally {
      setTesting(false)
    }
  }

  async function remove(): Promise<void> {
    setSettings(await api.invoke('settings:clearSecret', 'anthropicApiKey'))
    setResult(null)
    toast('Key removed from this PC.')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Claude</CardTitle>
          {!settings ? (
            <Skeleton className="h-5 w-24 rounded-full" />
          ) : status?.set ? (
            <Badge tone="done" data-testid="key-status">
              <CircleCheck className="size-3.5" /> Saved · ends in {status.hint ?? '····'}
            </Badge>
          ) : (
            <Badge tone="stuck" data-testid="key-status">
              Not set
            </Badge>
          )}
        </div>
        <p className="text-[13px] text-muted">
          Used for chapter boundaries, the module split, lesson text, picture names and scripts.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form
          className="flex flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) void save()
          }}
        >
          <Label htmlFor="claude-key">API key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="claude-key"
                data-testid="claude-key-input"
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                placeholder={status?.set ? 'Paste a new key to replace the saved one' : 'sk-ant-…'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pr-10 font-mono text-[13px]"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Hide key' : 'Show key'}
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={!value.trim() || saving}
              data-testid="save-key"
            >
              {saving ? <LoaderCircle className="animate-spin" /> : null} Save
            </Button>
            <Button
              size="lg"
              onClick={() => void test()}
              disabled={testing || (!value.trim() && !status?.set)}
              data-testid="test-key"
            >
              {testing ? <LoaderCircle className="animate-spin" /> : null} Test key
            </Button>
          </div>
        </form>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="key-test-result"
            className={cn(
              'flex items-center gap-2 rounded-[10px] px-3.5 py-2.5 text-[13px]',
              result.ok ? 'bg-success-soft text-success' : 'bg-stuck-soft text-stuck-ink',
            )}
          >
            {result.ok ? <CircleCheck className="size-4" /> : <CircleAlert className="size-4" />}
            {result.message}
          </motion.div>
        )}
        {status?.set && (
          <div>
            <Button size="sm" variant="danger" onClick={() => void remove()}>
              Remove saved key
            </Button>
          </div>
        )}
        {settings && !settings.encryptionAvailable && (
          <p className="text-[13px] text-stuck-ink">
            This PC can’t encrypt saved keys right now, so keys can’t be saved.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ClaudeCodeCard() {
  const mcp = useApp((s) => s.settings?.mcp)
  const setSettings = useApp((s) => s.setSettings)
  const [busy, setBusy] = useState(false)

  async function toggle(): Promise<void> {
    if (!mcp) return
    setBusy(true)
    try {
      setSettings(await api.invoke('mcp:setEnabled', !mcp.enabled))
    } catch (err) {
      toast.error(cleanError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Claude Code connection</CardTitle>
          {mcp?.running ? (
            <Badge tone="done" data-testid="mcp-status">
              On
            </Badge>
          ) : (
            <Badge data-testid="mcp-status">Off</Badge>
          )}
          <button
            role="switch"
            aria-checked={!!mcp?.enabled}
            aria-label="Let Claude Code control this app"
            disabled={!mcp || busy}
            onClick={() => void toggle()}
            data-testid="mcp-switch"
            className={cn(
              'relative ml-auto h-6 w-11 rounded-full transition-colors disabled:opacity-50',
              mcp?.enabled ? 'bg-accent' : 'bg-ink/15',
            )}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 600, damping: 35 }}
              className={cn(
                'absolute top-0.5 size-5 rounded-full bg-white shadow',
                mcp?.enabled ? 'right-0.5' : 'left-0.5',
              )}
            />
          </button>
        </div>
        <p className="text-[13px] text-muted">
          Lets Claude Code on this PC see and drive the app: screens, background jobs, screenshots
          and the log. It can never read your keys or publish to Canvas. Only programs on this PC
          with the token can connect.
        </p>
      </CardHeader>
      {mcp?.enabled && (
        <CardContent className="flex flex-col gap-3">
          {mcp.error ? (
            <p className="text-[13px] text-stuck-ink">{mcp.error}</p>
          ) : (
            <p className="text-[13px]">
              Listening at <span className="selectable font-mono text-[12.5px]">{mcp.url}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() =>
                void api
                  .invoke('mcp:copySetupCommand')
                  .then(() =>
                    toast.success('Copied. Paste it into a terminal once to connect Claude Code.'),
                  )
              }
            >
              Copy setup command
            </Button>
            <Button
              onClick={() =>
                void api.invoke('mcp:resetToken').then((s) => {
                  setSettings(s)
                  toast('New token made. Run the new setup command; the old one stops working.')
                })
              }
            >
              Make a new token
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function AppearanceCard() {
  const theme = useApp((s) => s.settings?.theme ?? 'system')
  const setTheme = useApp((s) => s.setTheme)
  const options: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: 'system', label: 'Match Windows', icon: <Monitor /> },
    { value: 'light', label: 'Light', icon: <Sun /> },
    { value: 'dark', label: 'Dark', icon: <Moon /> },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="inline-flex rounded-[10px] bg-ink/5 p-1"
        >
          {options.map((o) => {
            const active = o.value === theme
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={active}
                onClick={() => void setTheme(o.value)}
                className={cn(
                  'relative flex h-8 items-center gap-2 rounded-[7px] px-3.5 text-[13px] font-medium [&_svg]:size-4',
                  active ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="theme-pill"
                    className="absolute inset-0 rounded-[7px] bg-surface shadow-card ring-1 ring-line"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {o.icon}
                  {o.label}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ThisPcCard() {
  const system = useApp((s) => s.system)
  const rows: [string, ReactNode][] = system
    ? [
        ['System', system.os],
        ['Processor', `${system.cpu} · ${system.cores} threads`],
        ['Memory', `${system.ramGb} GB`],
        [
          'Graphics card',
          system.gpu?.available ? (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success-dot" />
              {system.gpu.name} · {system.gpu.vramGb} GB
              {system.gpu.driver ? ` · driver ${system.gpu.driver}` : ''}
            </span>
          ) : system.gpu?.source === 'forced-cpu' ? (
            'CPU only (forced by CS_FORCE_CPU)'
          ) : (
            'None found. Everything still works on the CPU, just slower.'
          ),
        ],
        [
          'Python helper',
          system.python.ok ? (
            `Python ${system.python.version} · ${system.python.how}`
          ) : (
            <span className="text-stuck-ink">{system.python.reason}</span>
          ),
        ],
        ['App version', system.appVersion],
      ]
    : []
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>This PC</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void api.invoke('shell:openSettingsFolder')}
          >
            <FolderOpen /> Open settings folder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[160px_1fr] gap-x-4 text-[13.5px]" data-testid="this-pc">
          {system
            ? rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-line-soft py-2.5 text-muted">{k}</dt>
                  <dd
                    className="selectable border-b border-line-soft py-2.5"
                    data-testid={`pc-${k}`}
                  >
                    {v}
                  </dd>
                </div>
              ))
            : Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="contents">
                  <dt className="py-2.5">
                    <Skeleton className="h-3.5 w-24" />
                  </dt>
                  <dd className="py-2.5">
                    <Skeleton className="h-3.5 w-64" />
                  </dd>
                </div>
              ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function cleanError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  // Electron prefixes "Error invoking remote method 'x': Error: "
  return msg.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}
