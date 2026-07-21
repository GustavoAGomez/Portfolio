import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { SiteShell } from "./components/SiteShell"
import { applyPalette } from "./config/palette"
import "./styles/index.css"

// Theme the DOM from the single source of truth (config/palette.ts) BEFORE the
// first render, so the very first paint is already on the active palette.
applyPalette()

const container = document.getElementById("root")
if (!container) throw new Error("Root element #root not found")

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <SiteShell />
    </BrowserRouter>
  </StrictMode>
)
