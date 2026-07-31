import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useStore } from "../scroll/store"
import { useT } from "../i18n/ui"

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

// LITE (<1024px or low-RAM): the SVG warp filter over the WebGL canvas flickers on
// Android — skip it and keep compositor-only pieces instead.
const isLiteWarp = (): boolean =>
  window.innerWidth < 1024 || ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) <= 4

// Lite compensates for the missing liquify with a slightly harder punch.
const LITE_SCALE_BOOST = 1.03
const LITE_SKEW_BOOST = 1.5

interface WarpOpts {
  hold?: number
  inDur?: number
  disp?: number
  scale?: number
  skew?: number
  flash?: boolean
}

interface TransitionCtx {
  go: (to: string) => void
}
const Ctx = createContext<TransitionCtx>({ go: () => {} })
export function useTransition(): TransitionCtx {
  return useContext(Ctx)
}

const warpTargets = (): HTMLElement[] => [document.getElementById("warp-fixed"), document.getElementById("warp-main")].filter((el): el is HTMLElement => el !== null)

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
      const lite = isLiteWarp()
      const inDur = opts?.inDur ?? DEFORM_IN_S
      const revealHold = reveal ? opts?.hold ?? 0 : 0
      // Displacement scales with viewport width (≥1200px as tuned, never below half).
      const dispFactor = Math.max(0.5, Math.min(1, window.innerWidth / 1200))
      const maxDisp = MAX_DISP * dispFactor
      const revealDisp = (opts?.disp ?? MAX_DISP) * dispFactor
      const revealScale = lite ? (opts?.scale ?? SCALE_PEAK) * LITE_SCALE_BOOST : opts?.scale ?? SCALE_PEAK
      const revealSkew = lite ? (opts?.skew ?? SKEW_PEAK) + LITE_SKEW_BOOST : opts?.skew ?? SKEW_PEAK
      const scalePeak = lite ? SCALE_PEAK * LITE_SCALE_BOOST : SCALE_PEAK
      const skewPeak = lite ? SKEW_PEAK + LITE_SKEW_BOOST : SKEW_PEAK
      tl.current?.kill()

      const dp = { s: reveal ? revealDisp : 0 }
      const sp = { v: 2 }
      const setDisp = () => disp.setAttribute("scale", dp.s.toFixed(2))
      const setSeed = () => turb.setAttribute("seed", String(Math.round(sp.v)))

      if (!lite) {
        for (const el of warpTargets()) {
          el.style.filter = "url(#warp)"
          el.style.willChange = "filter, transform"
        }
        setDisp()
        setSeed()
      } else if (fixed) {
        fixed.style.willChange = "transform"
      }
      if (fixed) gsap.set(fixed, reveal ? { scale: revealScale, skewX: revealSkew } : { scale: 1, skewX: 0 })
      gsap.set(panel, { opacity: reveal ? 1 : 0 })
      gsap.set([tintA, tintB], { opacity: 0, x: 0 })
      overlay.classList.add("active")

      const t = gsap.timeline({ onComplete: finish })

      if (!reveal) {
        if (!lite) {
          t.to(dp, { s: maxDisp, duration: DEFORM_OUT_S, ease: "power4.in", onUpdate: setDisp }, 0)
          t.to(sp, { v: SEED_OUT, duration: DEFORM_OUT_S, ease: "none", onUpdate: setSeed }, 0)
        }
        if (fixed) t.to(fixed, { scale: scalePeak, skewX: skewPeak, duration: DEFORM_OUT_S, ease: "power4.in" }, 0)
        t.to(panel, { opacity: 1, duration: DEFORM_OUT_S * 0.55, ease: "power2.in" }, DEFORM_OUT_S * 0.45)
        t.set(tintA, { x: SPLIT }, DEFORM_OUT_S - 0.08)
        t.set(tintB, { x: -SPLIT }, DEFORM_OUT_S - 0.08)
        t.to([tintA, tintB], { opacity: SPLIT_OPACITY, duration: 0.05 }, DEFORM_OUT_S - 0.08)
        t.to([tintA, tintB], { opacity: 0, duration: 0.14 }, DEFORM_OUT_S + 0.02)
        t.call(() => navigateFn?.(), undefined, DEFORM_OUT_S)
        t.to({}, { duration: HOLD_S })
      }

      const outStart = reveal ? revealHold : DEFORM_OUT_S + HOLD_S
      t.to(panel, { opacity: 0, duration: inDur, ease: "power2.out" }, outStart)
      if (!lite) {
        t.to(dp, { s: 0, duration: inDur, ease: "power3.out", onUpdate: setDisp }, outStart)
        t.to(sp, { v: reveal ? SEED_OUT : SEED_IN, duration: inDur, ease: "none", onUpdate: setSeed }, outStart)
      }
      if (fixed) t.to(fixed, { scale: 1, skewX: 0, duration: inDur, ease: "power3.out" }, outStart)

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
    // Safety timeout: force-finish and clear inline styles if the timeline stalls.
    safety.current = window.setTimeout(finish, SAFETY_MS)
    runWarp(null)
  }, [clearSafety, finish, runWarp])

  useLayoutEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname
    if (reducedMotion) return
    if (pendingGo.current) {
      pendingGo.current = false
      return
    }
    playReveal()
  }, [pathname, reducedMotion, playReveal])

  // First-load landing: play the recompose once on mount, covered before first paint.
  const didLanding = useRef(false)
  useLayoutEffect(() => {
    if (didLanding.current) return
    didLanding.current = true
    if (reducedMotion || !dispRef.current) return
    busy.current = true
    clearSafety()
    safety.current = window.setTimeout(finish, SAFETY_MS)
    runWarp(null, { hold: LANDING_HOLD_S, inDur: LANDING_IN_S, disp: LANDING_DISP, scale: LANDING_SCALE, skew: LANDING_SKEW, flash: true })
    // Cleanup + guard reset so StrictMode's dev remount doesn't leave the cover stuck.
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

      <svg className="warp-defs" aria-hidden="true">
        <filter id="warp" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={2} seed={2} result="n" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div ref={overlayRef} className="warp-overlay" aria-hidden="true">
        <div ref={panelRef} className="warp-panel" />
        <div ref={tintARef} className="warp-tint warp-tint-a" />
        <div ref={tintBRef} className="warp-tint warp-tint-b" />
        <div className="warp-grain" />
      </div>
    </Ctx.Provider>
  )
}

export function RouteBackButton() {
  const { go } = useTransition()
  const { pathname } = useLocation()
  const t = useT()
  if (pathname === "/") return null
  return (
    <button
      type="button"
      onClick={() => go("/")}
      // md `left` calc mirrors the 1440px content cap for fixed elements.
      className="fixed left-[max(1.5rem,env(safe-area-inset-left))] top-[max(1.5rem,env(safe-area-inset-top))] z-40 pointer-events-auto rounded-full border border-white/15 bg-[var(--color-bg)]/40 backdrop-blur-md px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.35em] text-white/70 transition-colors hover-neon-b hover:border-white/30 md:left-[max(4rem,calc((100vw_-_1440px)/2_+_4rem))] md:top-8 md:text-xs"
    >
      ← {t.index}
    </button>
  )
}
