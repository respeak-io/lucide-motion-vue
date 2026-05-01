declare module 'flubber' {
  export interface InterpolateOptions {
    /** Resampling density. Lower = more anchor points = smoother but slower. */
    maxSegmentLength?: number
    /** When true, paths are flattened to polygons before interpolating. */
    string?: boolean
  }
  export type Interpolator = (t: number) => string
  export function interpolate(
    fromShape: string,
    toShape: string,
    opts?: InterpolateOptions,
  ): Interpolator

  const _default: {
    interpolate: typeof interpolate
    separate: (...args: unknown[]) => unknown
    combine: (...args: unknown[]) => unknown
    interpolateAll: (...args: unknown[]) => unknown
    splitPathString: (s: string) => string[]
    toPathString: (s: unknown) => string
    fromCircle: (...args: unknown[]) => Interpolator
    toCircle: (...args: unknown[]) => Interpolator
    fromRect: (...args: unknown[]) => Interpolator
    toRect: (...args: unknown[]) => Interpolator
  }
  export default _default
}
