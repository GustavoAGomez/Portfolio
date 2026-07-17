import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import gsap from "gsap"
import { CustomEase } from "gsap/CustomEase"
import { useStore } from "../scroll/store"
import { TransitionOverlay, type IrisPhase } from "./TransitionOverlay"

gsap.registerPlugin(CustomEase)

// power2.inOut → cubic-bezier(0.45, 0, 0.55, 1), matching the reference glass ease.
const EASE = CustomEase.create("iris", "M0,0 C0.45,0 0.55,1 1,1")
const COVER_S = 0.6
const REVEAL_S = 0.7
const SAFETY_MS = 1800
/** length(resolution)*0.85 in the shader → ~78vmax from the center in CSS. */
const RADIUS_VMAX = 0.78

interface TransitionCtx {
  /** Navigate with the iris transition (cover → swap → reveal). */
  go: (to: string) => void
}
const Ctx = createContext<TransitionCtx>({ go: () => {} })
export function useTransition(): TransitionCtx {
  return useContext(Ctx)
}

/**
 * Owns the route-change iris transition. react-router navigation is immediate,
 * so we COVER first, then navigate under the full cover, then REVEAL the new
 * route. Mounted once (in SiteShell); exposes `go(to)` via context to internal
 * links. Under reduced-motion it navigates instantly (no iris). Back/forward
 * (pathname changes with no pending cover) plays reveal-only.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const reducedMotion = useStore((s) => s.reducedMotion)

  const overlayRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<IrisPhase>("idle")
  const phaseRef = useRef<IrisPhase>("idle")
  const pendingTo = useRef<string | null>(null)
  const lastPath = useRef(pathname)
  const tween = useRef<gsap.core.Tween | null>(null)
  const safety = useRef(0)

  const applyPhase = (p: IrisPhase) => {
    phaseRef.current = p
    setPhase(p)
  }
  const targetR = () => RADIUS_VMAX * Math.max(window.innerWidth, window.innerHeight)
  const setR = (px: number) => overlayRef.current?.style.setProperty("--r", `${px}px`)
  const clearSafety = () => {
    if (safety.current) {
      window.clearTimeout(safety.current)
      safety.current = 0
    }
  }

  const startReveal = useCallback(() => {
    tween.current?.kill()
    applyPhase("reveal")
    setR(0)
    const proxy = { v: 0 }
    tween.current = gsap.to(proxy, {
      v: targetR(),
      duration: REVEAL_S,
      ease: EASE,
      onUpdate: () => setR(proxy.v),
      onComplete: () => {
        applyPhase("idle")
        setR(0)
      }
    })
  }, [])

  const go = useCallback(
    (to: string) => {
      if (!to || to === pathname) return
      if (reducedMotion) {
        navigate(to)
        return
      }
      if (phaseRef.current !== "idle") return // already transitioning
      pendingTo.current = to
      tween.current?.kill()
      applyPhase("cover")
      setR(0)
      const proxy = { v: 0 }
      tween.current = gsap.to(proxy, {
        v: targetR(),
        duration: COVER_S,
        ease: EASE,
        onUpdate: () => setR(proxy.v),
        onComplete: () => {
          // Route swaps under the full cover; reveal is fired by the pathname effect.
          const dest = pendingTo.current
          pendingTo.current = null
          if (dest) navigate(dest)
        }
      })
      // Safety net: never leave the screen covered if something stalls.
      clearSafety()
      safety.current = window.setTimeout(() => {
        const dest = pendingTo.current
        pendingTo.current = null
        tween.current?.kill()
        if (dest) navigate(dest)
        applyPhase("idle")
        setR(0)
      }, SAFETY_MS)
    },
    [pathname, reducedMotion, navigate]
  )

  // Route committed → open the iris. Covers both the cover-driven swap and
  // back/forward (reveal-only). useLayoutEffect so the new route is masked before
  // the browser paints → no flash of uncovered content.
  useLayoutEffect(() => {
    if (pathname === lastPath.current) return
    lastPath.current = pathname
    clearSafety()
    if (reducedMotion) {
      applyPhase("idle")
      return
    }
    startReveal()
  }, [pathname, reducedMotion, startReveal])

  useEffect(() => {
    return () => {
      tween.current?.kill()
      clearSafety()
    }
  }, [])

  const value = useMemo(() => ({ go }), [go])

  return (
    <Ctx.Provider value={value}>
      {children}
      <TransitionOverlay ref={overlayRef} phase={phase} />
    </Ctx.Provider>
  )
}

/** "Back to index" control for detail routes — navigates home with the iris. */
export function RouteBackButton() {
  const { go } = useTransition()
  const { pathname } = useLocation()
  if (!pathname.startsWith("/work/")) return null
  return (
    <button
      type="button"
      onClick={() => go("/")}
      className="fixed left-6 top-6 z-40 pointer-events-auto text-[10px] uppercase tracking-[0.35em] text-white/60 transition-colors hover:text-[var(--color-accent-b)] md:left-8 md:top-8 md:text-xs"
    >
      ← Index
    </button>
  )
}
