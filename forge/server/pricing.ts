import type { ModelTier, UsageInfo, CostBreakdown } from './schema'

/**
 * Per-million-token base prices (USD). Source: SKILL.md models table,
 * cached 2026-04-15.
 */
const BASE_PRICES: Record<ModelTier, { input: number; output: number }> = {
  sonnet: { input: 3, output: 15 }, // claude-sonnet-4-6
  opus: { input: 5, output: 25 }, // claude-opus-4-7
}

const CACHE_WRITE_MULT = 1.25 // ephemeral / 5-min TTL
const CACHE_READ_MULT = 0.1

export function computeCost(tier: ModelTier, usage: UsageInfo): CostBreakdown {
  const p = BASE_PRICES[tier]
  const million = 1_000_000
  const input_usd = (usage.input_tokens * p.input) / million
  const cache_write_usd =
    (usage.cache_creation_input_tokens * p.input * CACHE_WRITE_MULT) / million
  const cache_read_usd =
    (usage.cache_read_input_tokens * p.input * CACHE_READ_MULT) / million
  const output_usd = (usage.output_tokens * p.output) / million
  const total_usd = input_usd + cache_write_usd + cache_read_usd + output_usd
  return { input_usd, cache_write_usd, cache_read_usd, output_usd, total_usd }
}
