/**
 * JSON can't represent the JS `Infinity` literal. The model emits it as the
 * string `"Infinity"` (we tell it to use `repeat: Infinity` for true loops,
 * but the round-trip through JSON downgrades the literal to a string).
 * Motion-v expects a number for `repeat`, sees the string, and silently
 * treats it as no-repeat — the icon plays once and sits static for the rest
 * of the loop interval. That's the "icons don't loop" failure mode.
 *
 * Walk the variants tree once on the client (preview render) and once in the
 * SFC writer (generated code) and substitute the actual JS values.
 */
export function rehydrateVariants<T>(value: T): T {
  return rehydrate(value) as T
}

function rehydrate(v: unknown): unknown {
  if (v === 'Infinity') return Infinity
  if (v === '-Infinity') return -Infinity
  if (Array.isArray(v)) return v.map(rehydrate)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = rehydrate(val)
    }
    return out
  }
  return v
}
