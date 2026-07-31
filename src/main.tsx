import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { SiteShell } from "./components/SiteShell"
import { applyPalette } from "./config/palette"
import { applyTypography } from "./config/typography"
import "./styles/index.css"

// Apply palette + typography BEFORE the first render.
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
