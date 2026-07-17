import { Scene } from "./canvas/Scene"
import { Section } from "./components/Section"
import { CanvasErrorBoundary } from "./components/CanvasErrorBoundary"
import { ENABLED_SECTIONS } from "./config/sections"
import { useLenis } from "./scroll/useLenis"

export function App() {
  useLenis()
  const sections = ENABLED_SECTIONS()

  return (
    <>
      {/* Single fixed WebGL canvas (z:0). Degrades to DOM-only if WebGL fails. */}
      <CanvasErrorBoundary>
        <Scene />
      </CanvasErrorBoundary>

      {/* Grain + vignette overlay (z:5) — replaces the postprocessing composer. */}
      <div className="fx-overlay" aria-hidden="true" />

      {/* Scrollable, semantic DOM above the canvas. */}
      <main className="relative z-10" style={{ pointerEvents: "none" }}>
        {sections.map(({ id, anchor, Dom }) => (
          <Section key={id} id={id} anchor={anchor}>
            <Dom />
          </Section>
        ))}
      </main>
    </>
  )
}
