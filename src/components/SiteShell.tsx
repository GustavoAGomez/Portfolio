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
// Marca de esquina desactivada: al reactivar <SiteLogo/> hay que reimportarla
// (tsc corre con noUnusedLocals y el import muerto tumba el build de Netlify).
// import { SiteLogo } from "./Logo"
import { playSectionFlip } from "../lib/sectionFlip"
import { useSeo } from "../seo/useSeo"

export function SiteShell() {
  useLenis()
  useSeo()
  const { pathname } = useLocation()
  const active = activeSectionsFor(pathname)
  const locale = useStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // FLIP the language-switch layout shift — layout effect: after the remount commit, before paint.
  useLayoutEffect(() => {
    playSectionFlip(useStore.getState().reducedMotion)
  }, [locale])

  useHomeSnap(pathname === "/")

  useEffect(() => {
    preloadDetailModules()
  }, [])

  useEffect(() => {
    const workId = workIdFromPath(pathname)
    useStore.getState().setCaseStudyId(workId && getProjectContent(workId) ? workId : null)
    const scroll = useStore.getState().scroll
    scroll.scrollY = 0
    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true })
      lenis.resize()
    } else {
      window.scrollTo(0, 0)
    }
    // Zero velocity AFTER the scrollTo — its scroll event saturates rawVelocity
    // and the new route's chromatic planes would render wobbled until it decayed.
    scroll.rawVelocity = 0
    scroll.velocity = 0
  }, [pathname])

  return (
    <TransitionProvider>
      <div id="warp-fixed" className="warp-fixed">
        <CanvasErrorBoundary>
          <Scene sections={active} />
        </CanvasErrorBoundary>

        <div className="fx-overlay" aria-hidden="true" />
      </div>

      <main id="warp-main" className="relative z-10" style={{ pointerEvents: "none" }}>
        <Suspense fallback={<div style={{ minHeight: "100svh", background: "var(--color-bg)" }} />}>
          {/* Keyed by locale on purpose: switching language remounts the sections
              so every <Decode> replays toward the new text. */}
          {active.map(({ id, anchor, Dom }) => (
            <Section key={`${id}:${locale}`} id={id} anchor={anchor}>
              <Dom />
            </Section>
          ))}
        </Suspense>
      </main>

      <RouteBackButton />
      {/* <SiteLogo /> */}

      <LangSwitch />

      {/* Cursor stays OUTSIDE the warp layers — their transition filter would trap its blend mode. */}
      <Cursor />
    </TransitionProvider>
  )
}
