import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from '@shared/models'
import type { KeyTestResult } from '@shared/ipc'
import { log } from './log'

/** Make one tiny Haiku call to prove the key works. Returns plain English either way. */
export async function testClaudeKey(apiKey: string | null): Promise<KeyTestResult> {
  if (!apiKey) return { ok: false, message: 'No key saved yet. Paste your key first.' }
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 })
  try {
    await client.messages.create({
      model: MODELS.quick,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    return { ok: true, message: 'Key works. Course Studio can reach Claude.' }
  } catch (err) {
    void log('claude', `key test failed: ${err instanceof Error ? err.message : String(err)}`)
    return { ok: false, message: explainClaudeError(err) }
  }
}

export function explainClaudeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError)
    return 'Claude did not accept this key. Check it was copied in full.'
  if (err instanceof Anthropic.PermissionDeniedError)
    return 'This key is not allowed to use the model. Check your Claude account.'
  if (err instanceof Anthropic.RateLimitError)
    return 'Claude is busy or your account hit a limit. Try again in a minute.'
  if (err instanceof Anthropic.APIConnectionError)
    return 'Could not reach Claude. Check the internet connection.'
  if (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500)
    return 'Claude is having trouble right now. Try again shortly.'
  return 'The key test did not work. Details are in the log file.'
}
