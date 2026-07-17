import { Suspense, useEffect } from "react"
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom"
import { Scene } from "../canvas/Scene"
import { Section } from "./Section"
import { CanvasErrorBoundary } from "./CanvasErrorBoundary"
import { activeSectionsFor, isValidProject } from "../routes/activeSections"
import { useLenis, lenisRef } from "../scroll/useLenis"
import { useHomeSnap } from "../scroll/useHomeSnap"
import { useStore } from "../scroll/store"

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

  // Reset scroll to top on navigation + recompute Lenis limit for the new height.
  useEffect(() => {
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
    <>
      {/* Single fixed WebGL canvas (z:0). Degrades to DOM-only if WebGL fails. */}
      <CanvasErrorBoundary>
        <Scene sections={active} />
      </CanvasErrorBoundary>

      {/* Grain + vignette overlay (z:5) — replaces the postprocessing composer. */}
      <div className="fx-overlay" aria-hidden="true" />

      {/* Scrollable, semantic DOM above the canvas (z:10). */}
      <main className="relative z-10" style={{ pointerEvents: "none" }}>
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--color-bg)" }} />}>
          {active.map(({ id, anchor, Dom }) => (
            <Section key={id} id={id} anchor={anchor}>
              <Dom />
            </Section>
          ))}
        </Suspense>
      </main>

      {/* Route logic (validation / redirects) — no visible content of its own. */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/work/:id" element={<DetailGuard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
