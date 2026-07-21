import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { SiteShell } from "./components/SiteShell"
import { applyPalette } from "./config/palette"
import { applyTypography } from "./config/typography"
import "./styles/index.css"

// Theme the DOM from the single sources of truth (config/palette.ts +
// config/typography.ts) BEFORE the first render, so the very first paint is
// already on the active palette + type system.
applyPalette()
applyTypography()

const container = document.getElementById("root")
if (!container) throw new Error("Root element #root not found")

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <SiteShell />
    </BrowserRouter>
  </StrictMode>
)
