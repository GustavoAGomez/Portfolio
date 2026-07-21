import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useStore } from "../scroll/store"

// ── Intensity / timing (tune here) ──────────────────────────────────────────
const DEFORM_OUT_S = 0.32 // liquify + cover, abrupt
const HOLD_S = 0.08 // covered pause so the destination (incl. its 3D frame) paints
const DEFORM_IN_S = 0.42 // recompose the new page, sharp finish
const MAX_DISP = 90 // px peak feDisplacementMap scale
const SCALE_PEAK = 1.06 // #warp-fixed scale punch
const SKEW_PEAK = 2 // deg
const SEED_OUT = 14 // feTurbulence seed drift (boil) during out / in
const SEED_IN = 26
const SPLIT = 4 // px RGB-split flash
const SPLIT_OPACITY = 0.16
const SAFETY_MS = 1800

// ── First-load landing (recompose-only, bigger + more aggressive than a nav) ──
const LANDING_HOLD_S = 0.35 // covered beat on first paint so the scene renders in
const LANDING_IN_S = 0.8 // recompose duration on landing (> DEFORM_IN_S)
const LANDING_DISP = 170 // start displacement peak (vs MAX_DISP 90) — heavier warp
const LANDING_SCALE = 1.16 // start scale punch (vs SCALE_PEAK 1.06)
const LANDING_SKEW = 5 // start skew deg (vs SKEW_PEAK 2)
const LANDING_SPLIT = 12 // px RGB-split flash offset during recompose
const LANDING_SPLIT_OPACITY = 0.3

/** Per-run overrides — used by the landing to hit harder than a nav transition. */
interface WarpOpts {
  /** Reveal-only: seconds held fully covered before recomposing. */
  hold?: number
  /** Override the deform-in (recompose) duration. */
  inDur?: number
  /** Reveal-only start intensity: displacement peak / scale / skew. */
  disp?: number
  scale?: number
  skew?: number
  /** Reveal-only: play an RGB-split flash as it recomposes. */
  flash?: boolean
}

interface TransitionCtx {
  /** Navigate with the warp / liquify transition. */
  go: (to: string) => void
}
const Ctx = createContext<TransitionCtx>({ go: () => {} })
export function useTransition(): TransitionCtx {
  return useContext(Ctx)
}

const warpTargets = (): HTMLElement[] => [document.getElementById("warp-fixed"), document.getElementById("warp-main")].filter((el): el is HTMLElement => el !== null)

/**
 * Route-change transition: a WARP / liquify. It deforms the REAL content (no
 * texture capture) via an SVG feDisplacementMap applied to the fixed canvas layer
 * (#warp-fixed) and the scrollable DOM (#warp-main) — only during the transition,
 * so idle keeps the canvas's position:fixed + Lenis untouched. One GSAP timeline
 * drives the displacement scale (0→peak→0), a `seed` boil, a scale/skew punch, and
 * an opaque cover (+ a brief RGB-split flash & grain) that hides the route swap.
 * Public API unchanged (`useTransition().go`). reduced-motion navigates instantly
 * (no warp, no flashes); browser back/forward plays the recompose (deform-in) only.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const reducedMotion = useStore((s) => s.reducedMotion)

  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const turbRef = useRef<SVGFETurbulenceElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tintARef = useRef<HTMLDivElement>(null)
  const tintBRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const safety = useRef(0)
  const busy = useRef(false)
  const pendingGo = useRef(false)
  const lastPath = useRef(pathname)

  const clearSafety = useCallback(() => {
    if (safety.current) {
      window.clearTimeout(safety.current)
      safety.current = 0
    }
  }, [])

  const finish = useCallback(() => {
    clearSafety()
    tl.current?.kill()
    tl.current = null
    // Remove the warp from the real content → idle is fully normal (canvas fixed,
    // Lenis intact, no residual filter/transform). Clear the inline styles
    // DIRECTLY (robust even if the timeline was killed mid-tween).
    for (const el of warpTargets()) {
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: "all" })
      el.style.filter = ""
      el.style.transform = ""
      el.style.willChange = ""
    }
    dispRef.current?.setAttribute("scale", "0")
    overlayRef.current?.classList.remove("active")
    busy.current = false
    pendingGo.current = false
  }, [clearSafety])

  /** Build + play the warp timeline. `navigateFn === null` = recompose only. */
  const runWarp = useCallback(
    (navigateFn: (() => void) | null, opts?: WarpOpts) => {
      const disp = dispRef.current
      const turb = turbRef.current
      const overlay = overlayRef.current
      const panel = panelRef.current
      const tintA = tintARef.current
      const tintB = tintBRef.current
      if (!disp || !turb || !overlay || !panel || !tintA || !tintB) {
        navigateFn?.()
        finish()
        return
      }
      const fixed = document.getElementById("warp-fixed")
      const reveal = navigateFn === null
      const inDur = opts?.inDur ?? DEFORM_IN_S
      const revealHold = reveal ? opts?.hold ?? 0 : 0
      const revealDisp = opts?.disp ?? MAX_DISP
      const revealScale = opts?.scale ?? SCALE_PEAK
      const revealSkew = opts?.skew ?? SKEW_PEAK
      tl.current?.kill()

      const dp = { s: reveal ? revealDisp : 0 }
      const sp = { v: 2 }
      const setDisp = () => disp.setAttribute("scale", dp.s.toFixed(2))
      const setSeed = () => turb.setAttribute("seed", String(Math.round(sp.v)))

      // Apply the warp filter to the real content for the duration.
      for (const el of warpTargets()) {
        el.style.filter = "url(#warp)"
        el.style.willChange = "filter, transform"
      }
      setDisp()
      setSeed()
      if (fixed) gsap.set(fixed, reveal ? { scale: revealScale, skewX: revealSkew } : { scale: 1, skewX: 0 })
      gsap.set(panel, { opacity: reveal ? 1 : 0 })
      gsap.set([tintA, tintB], { opacity: 0, x: 0 })
      overlay.classList.add("active")

      const t = gsap.timeline({ onComplete: finish })

      if (!reveal) {
        // DEFORM-OUT: abrupt liquify + scale/skew + boil, cover rises to total.
        t.to(dp, { s: MAX_DISP, duration: DEFORM_OUT_S, ease: "power4.in", onUpdate: setDisp }, 0)
        t.to(sp, { v: SEED_OUT, duration: DEFORM_OUT_S, ease: "none", onUpdate: setSeed }, 0)
        if (fixed) t.to(fixed, { scale: SCALE_PEAK, skewX: SKEW_PEAK, duration: DEFORM_OUT_S, ease: "power4.in" }, 0)
        t.to(panel, { opacity: 1, duration: DEFORM_OUT_S * 0.55, ease: "power2.in" }, DEFORM_OUT_S * 0.45)
        // brief RGB-split flash at the peak
        t.set(tintA, { x: SPLIT }, DEFORM_OUT_S - 0.08)
        t.set(tintB, { x: -SPLIT }, DEFORM_OUT_S - 0.08)
        t.to([tintA, tintB], { opacity: SPLIT_OPACITY, duration: 0.05 }, DEFORM_OUT_S - 0.08)
        t.to([tintA, tintB], { opacity: 0, duration: 0.14 }, DEFORM_OUT_S + 0.02)
        t.call(() => navigateFn?.(), undefined, DEFORM_OUT_S) // swap under full cover
        t.to({}, { duration: HOLD_S })
      }

      // DEFORM-IN: uncover while the new view recomposes → exactly sharp (scale 0).
      // On a landing (reveal + hold), the timeline idles fully covered for
      // `revealHold` first, so the fresh scene can paint before it uncovers.
      const outStart = reveal ? revealHold : DEFORM_OUT_S + HOLD_S
      t.to(panel, { opacity: 0, duration: inDur, ease: "power2.out" }, outStart)
      t.to(dp, { s: 0, duration: inDur, ease: "power3.out", onUpdate: setDisp }, outStart)
      t.to(sp, { v: reveal ? SEED_OUT : SEED_IN, duration: inDur, ease: "none", onUpdate: setSeed }, outStart)
      if (fixed) t.to(fixed, { scale: 1, skewX: 0, duration: inDur, ease: "power3.out" }, outStart)

      // Reveal RGB-split flash (landing): a chromatic kick as the cover lifts and
      // the deformed scene snaps back — the aggressive punch. Rides on top of the
      // panel, so it's visible while uncovering.
      if (reveal && opts?.flash) {
        t.set(tintA, { x: LANDING_SPLIT }, outStart)
        t.set(tintB, { x: -LANDING_SPLIT }, outStart)
        t.to([tintA, tintB], { opacity: LANDING_SPLIT_OPACITY, duration: 0.06, ease: "power2.out" }, outStart)
        t.to([tintA, tintB], { opacity: 0, duration: inDur * 0.7, ease: "power2.out" }, outStart + 0.06)
        t.to([tintA, tintB], { x: 0, duration: inDur, ease: "power3.out" }, outStart)
      }

      tl.current = t
    },
    [finish]
  )

  const go = useCallback(
    (to: string) => {
      if (!to || to === pathname) return
      if (reducedMotion) {
        navigate(to)
        return
      }
      if (busy.current || !dispRef.current) {
        navigate(to)
        return
      }
      busy.current = true
      pendingGo.current = true
      clearSafety()
      safety.current = window.setTimeout(() => {
        tl.current?.kill()
        navigate(to)
        finish()
      }, SAFETY_MS)
      runWarp(() => navigate(to))
    },
    [pathname, reducedMotion, navigate, clearSafety, finish, runWarp]
  )

  // Recompose-only for browser back/forward (pathname changed with no `go`).
  const playReveal = useCallback(() => {
    if (!dispRef.current) return
    busy.current = true
    clearSafety()
    safety.current = window.setTimeout(finish, SAFETY_MS)
    runWarp(null)
  }, [clearSafety, finish, runWarp])

  useLayoutEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname
    if (reducedMotion) return
    if (pendingGo.current) {
      pendingGo.current = false // go's own timeline handles the recompose
      return
    }
    playReveal()
  }, [pathname, reducedMotion, playReveal])

  // FIRST-LOAD LANDING: play the recompose ONCE on mount so the site doesn't pop
  // in abruptly — same warp as a navigation's "content appears" half, but held
  // covered briefly and recomposed a touch slower. Runs in a layout effect so the
  // cover is applied before the first paint (no flash). reduced-motion skips it.
  const didLanding = useRef(false)
  useLayoutEffect(() => {
    if (didLanding.current) return
    didLanding.current = true
    if (reducedMotion || !dispRef.current) return
    busy.current = true
    clearSafety()
    safety.current = window.setTimeout(finish, SAFETY_MS)
    runWarp(null, { hold: LANDING_HOLD_S, inDur: LANDING_IN_S, disp: LANDING_DISP, scale: LANDING_SCALE, skew: LANDING_SKEW, flash: true })
    // Restore on unmount so StrictMode's dev mount→unmount→remount doesn't leave
    // the cover stuck (kill-only cleanup would freeze it black); resetting the
    // guard lets the remount replay it. In prod this never unmounts → plays once.
    return () => {
      finish()
      didLanding.current = false
    }
  }, [reducedMotion, runWarp, clearSafety, finish])

  useEffect(() => {
    return () => {
      tl.current?.kill()
      clearSafety()
    }
  }, [clearSafety])

  const value = useMemo(() => ({ go }), [go])

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Warp filter definition (hidden). scale/seed animated by GSAP. */}
      <svg className="warp-defs" aria-hidden="true">
        <filter id="warp" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={2} seed={2} result="n" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Cover + RGB-split flash + grain (z:100). */}
      <div ref={overlayRef} className="warp-overlay" aria-hidden="true">
        <div ref={panelRef} className="warp-panel" />
        <div ref={tintARef} className="warp-tint warp-tint-a" />
        <div ref={tintBRef} className="warp-tint warp-tint-b" />
        <div className="warp-grain" />
      </div>
    </Ctx.Provider>
  )
}

/** "Back to index" control for detail routes — navigates home with the transition. */
export function RouteBackButton() {
  const { go } = useTransition()
  const { pathname } = useLocation()
  if (!pathname.startsWith("/work/")) return null
  return (
    <button
      type="button"
      onClick={() => go("/")}
      className="fixed left-6 top-6 z-40 pointer-events-auto text-[10px] font-mono uppercase tracking-[0.35em] text-white/60 transition-colors hover:text-[var(--color-accent-b)] md:left-8 md:top-8 md:text-xs"
    >
      ← Index
    </button>
  )
}
