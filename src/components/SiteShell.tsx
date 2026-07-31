import { Suspense, useEffect, useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"
import { Scene } from "../canvas/Scene"
import { Section } from "./Section"
import { CanvasErrorBoundary } from "./CanvasErrorBoundary"
import { activeSectionsFor, workIdFromPath } from "../routes/activeSections"
import { getProjectContent } from "../config/projectContent"
import { preloadDetailModules } from "../config/sections"
import { useLenis, lenisRef } from "../scroll/useLenis"
import { useHomeSnap } from "../scroll/useHomeSnap"
import { useStore } from "../scroll/store"
import { TransitionProvider, RouteBackButton } from "../transition/TransitionProvider"
import { Cursor } from "./Cursor"
import { LangSwitch } from "./LangSwitch"
import { playSectionFlip } from "../lib/sectionFlip"

/**
 * The persistent shell — mounted ONCE above the router. It owns the single fixed
 * <Canvas> (Scene), the grain/vignette overlay, the scrollable <main>, and the
 * one-and-only Lenis instance. What changes per route is the ACTIVE SECTION SET
 * (derived from the URL), which feeds BOTH the DOM (<main>) and the WebGL modules
 * (Scene) — so the canvas is never torn down across navigation.
 */
export function SiteShell() {
  useLenis()
  const { pathname } = useLocation()
  const active = activeSectionsFor(pathname)
  const locale = useStore((s) => s.locale)

  // Mirror the active language on <html lang> (screen readers, translators).
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // FLIP the language switch's layout shift: the remounted sections have new
  // text lengths, so heights change and everything below would jump one frame.
  // Runs AFTER the remount commit but BEFORE paint (layout effect), gliding
  // each section from its captured old position (see lib/sectionFlip).
  useLayoutEffect(() => {
    playSectionFlip(useStore.getState().reducedMotion)
  }, [locale])

  // Anchor snap hero↔list, Home only (detail scrolls normally).
  useHomeSnap(pathname === "/")

  // Warm detail chunks so the route transition captures a painted destination.
  useEffect(() => {
    preloadDetailModules()
  }, [])

  // Reset scroll to top on navigation + recompute Lenis limit for the new height.
  // Also bridge the active case-study id into the store so the WebGL StoryScene
  // (no Router context inside the Canvas) knows which project's images to render.
  useEffect(() => {
    const workId = workIdFromPath(pathname)
    useStore.getState().setCaseStudyId(workId && getProjectContent(workId) ? workId : null)
    const scroll = useStore.getState().scroll
    scroll.scrollY = 0
    const lenis = lenisRef.current
    if (lenis) {
      // force:true so it works even while Lenis is stopped by the Home snap.
      lenis.scrollTo(0, { immediate: true, force: true })
      lenis.resize()
    } else {
      window.scrollTo(0, 0)
    }
    // The immediate jump above emits a scroll event whose huge delta SATURATES
    // the velocity — every chromatic plane on the new route would then render
    // wobbled + RGB-split (reads as "media at the wrong size") until the damped
    // decay finishes. A route jump is not scroll motion: zero it. AFTER the
    // scrollTo so the event it emits can't re-write rawVelocity.
    scroll.rawVelocity = 0
    scroll.velocity = 0
  }, [pathname])

  return (
    <TransitionProvider>
      {/* Fixed, viewport-locked layer holding the canvas (z:0) + grain (z:5). Kept
          a separate #warp-fixed so the warp filter can be applied to it during a
          transition WITHOUT the filter's containing-block breaking the canvas's
          position:fixed (idle: no filter/transform on it → fully normal). */}
      <div id="warp-fixed" className="warp-fixed">
        {/* Single fixed WebGL canvas (z:0). Degrades to DOM-only if WebGL fails. */}
        <CanvasErrorBoundary>
          <Scene sections={active} />
        </CanvasErrorBoundary>

        {/* Grain + vignette overlay (z:5) — replaces the postprocessing composer. */}
        <div className="fx-overlay" aria-hidden="true" />
      </div>

      {/* Scrollable, semantic DOM above the canvas (z:10). #warp-main gets the warp
          filter directly during a transition (it's not fixed → no reposition). */}
      <main id="warp-main" className="relative z-10" style={{ pointerEvents: "none" }}>
        <Suspense fallback={<div style={{ minHeight: "100svh", background: "var(--color-bg)" }} />}>
          {/* Keyed by locale ON PURPOSE: switching language remounts the DOM
              sections, so every <Decode> replays the binary scramble toward the
              new text — the language switch IS the site's decode transition.
              (Section bounds re-register on remount; the WebGL modules are NOT
              keyed — planes keep their textures, only reactive text swaps.) */}
          {active.map(({ id, anchor, Dom }) => (
            <Section key={`${id}:${locale}`} id={id} anchor={anchor}>
              <Dom />
            </Section>
          ))}
        </Suspense>
      </main>

      {/* Back-to-home control on detail routes (navigates with the iris). */}
      <RouteBackButton />

      {/* Language switch — fixed top-right chip on every route. */}
      <LangSwitch />

      {/* Inverting circular cursor — desktop (fine pointer) only. Outside the
          warp layers so their transition filter can't trap its blend mode. */}
      <Cursor />

      {/* No <Routes> block: nothing redirects anymore. activeSectionsFor maps
          EVERY pathname to a section set (unknown URLs → the 404 set, keeping
          the wrong URL in the bar), so route matching has no job left here. */}
    </TransitionProvider>
  )
}
