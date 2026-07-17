import { forwardRef } from "react"

export type IrisPhase = "idle" | "cover" | "reveal"

/**
 * The iris overlay — a "glass" dissolve adapted from the reference Three.js glass
 * shader to an overlay mask, for ROUTE transitions. z:100, above <main> and
 * .fx-overlay. `--r` (animated by TransitionProvider) drives:
 *  - `.iris-plane`: the brand-color fill, radial-masked into a growing circle
 *    (cover) or hole (reveal) with a soft ~6px feather.
 *  - `.iris-edge`:  a thin blurred rim following the radius with a subtle cyan↔red
 *    chromatic split (evokes the shader's aberration). Gone in idle.
 */
export const TransitionOverlay = forwardRef<HTMLDivElement, { phase: IrisPhase }>(function TransitionOverlay({ phase }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={["iris-overlay", `iris-${phase}`, phase === "idle" ? "pointer-events-none" : "pointer-events-auto"].join(" ")}
    >
      <div className="iris-plane" />
      <div className="iris-edge" />
    </div>
  )
})
