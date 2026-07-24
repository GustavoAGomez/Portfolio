import { Suspense, useEffect } from "react"
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom"
import { Scene } from "../canvas/Scene"
import { Section } from "./Section"
import { CanvasErrorBoundary } from "./CanvasErrorBoundary"
import { activeSectionsFor, isValidProject, workIdFromPath } from "../routes/activeSections"
import { getProjectContent } from "../config/projectContent"
import { preloadDetailModules } from "../config/sections"
import { useLenis, lenisRef } from "../scroll/useLenis"
import { useHomeSnap } from "../scroll/useHomeSnap"
import { useStore } from "../scroll/store"
import { TransitionProvider, RouteBackButton } from "../transition/TransitionProvider"

/** Route logic only: an invalid `/work/:id` redirects home. Renders no content
 *  (the section content is owned by the shell's <main>, driven by the URL). */
function DetailGuard() {
  const { id } = useParams<{ id: string }>()
  return isValidProject(id) ? null : <Navigate to="/" replace />
}

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
    useStore.getState().scroll.scrollY = 0
    const lenis = lenisRef.current
    if (lenis) {
      // force:true so it works even while Lenis is stopped by the Home snap.
      lenis.scrollTo(0, { immediate: true, force: true })
      lenis.resize()
    } else {
      window.scrollTo(0, 0)
    }
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
          {active.map(({ id, anchor, Dom }) => (
            <Section key={id} id={id} anchor={anchor}>
              <Dom />
            </Section>
          ))}
        </Suspense>
      </main>

      {/* Back-to-home control on detail routes (navigates with the iris). */}
      <RouteBackButton />

      {/* Route logic (validation / redirects) — no visible content of its own. */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/work/:id" element={<DetailGuard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TransitionProvider>
  )
}
