/**
 * The only place Claude model IDs live. Import from here; never hard-code a model ID elsewhere.
 */
export const MODELS = {
  /** Planning: module split, lesson planning. */
  planner: 'claude-opus-5-5',
  /** Writing, chat, chapter-title disagreements. */
  writer: 'claude-sonnet-5-5',
  /** Picture names, tags, reading the printed contents page, key test. */
  quick: 'claude-haiku-5-5',
} as const

export type ModelRole = keyof typeof MODELS
export type ModelId = (typeof MODELS)[ModelRole]
