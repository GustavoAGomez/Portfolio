export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

export const clamp01 = (v: number): number => clamp(v, 0, 1)

/** Standard linear interpolation. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/**
 * Frame-rate independent exponential smoothing (a lerp driven by dt).
 * lambda ~ how fast it converges; larger = snappier.
 */
export const damp = (a: number, b: number, lambda: number, dt: number): number => lerp(a, b, 1 - Math.exp(-lambda * dt))

export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number): number =>
  inMax === inMin ? outMin : outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin)

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Trailing debounce for resize / measure handlers. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 150): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
