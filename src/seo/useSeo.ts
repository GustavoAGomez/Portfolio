import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useStore, type Locale } from "../scroll/store"
import { workIdFromPath, isValidProject } from "../routes/activeSections"
import { getProjectContent } from "../config/projectContent"

/**
 * Per-route <head> for a client-rendered SPA: without this every URL would be
 * indexed with the same title/description (the server sends one index.html).
 * Google executes JS, so rewriting these on navigation is what actually gets
 * each route its own search result. Values track the active locale.
 */
export const SITE_URL = "https://gusgq.es"

const HOME = {
  es: {
    title: "GUSGQ — Gustavo Gómez · Front-end & UI Developer en Madrid",
    description:
      "Portfolio de Gustavo Gómez (GUSGQ), front-end y UI developer en Madrid: animación con GSAP, canvas y Three.js, interfaces al detalle y responsive pixel-perfect."
  },
  en: {
    title: "GUSGQ — Gustavo Gómez · Front-end & UI Developer in Madrid",
    description:
      "Portfolio of Gustavo Gómez (GUSGQ), front-end and UI developer in Madrid: GSAP, canvas and Three.js animation, detail-obsessed interfaces and pixel-perfect responsive."
  }
} as const

const ABOUT = {
  es: {
    title: "Sobre mí — GUSGQ · Gustavo Gómez",
    description:
      "Quién hay detrás de GUSGQ: Gustavo Gómez, front-end y UI developer en Madrid. Animación, librerías de componentes, trayectoria y marcas para las que he escrito código."
  },
  en: {
    title: "About — GUSGQ · Gustavo Gómez",
    description:
      "The person behind GUSGQ: Gustavo Gómez, front-end and UI developer in Madrid. Animation, component libraries, trajectory and the brands I've written code for."
  }
} as const

const LEGAL = {
  es: {
    title: "Aviso legal y privacidad — GUSGQ",
    description: "Aviso legal, política de privacidad y cookies del portfolio de Gustavo Gómez (GUSGQ). Sitio estático, sin cookies ni rastreo."
  },
  en: {
    title: "Legal notice & privacy — GUSGQ",
    description: "Legal notice, privacy policy and cookies for Gustavo Gómez's portfolio (GUSGQ). Static site, no cookies or tracking."
  }
} as const

const NOT_FOUND = {
  es: { title: "Página no encontrada — GUSGQ", description: "Esta URL no existe o se ha movido." },
  en: { title: "Page not found — GUSGQ", description: "This URL doesn't exist or has moved." }
} as const

/** Upsert a <meta> by name or property (created once, then reused). */
function meta(kind: "name" | "property", key: string, content: string): void {
  const sel = `meta[${kind}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(sel)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(kind, key)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

interface RouteSeo {
  title: string
  description: string
  type: string
  /** Unknown URLs render the 404 page — never let one be indexed as content. */
  noindex?: boolean
}

function resolve(pathname: string, locale: Locale): RouteSeo {
  if (pathname === "/") return { ...HOME[locale], type: "website" }
  if (/^\/about\/?$/.test(pathname)) return { ...ABOUT[locale], type: "profile" }
  // Legal page: real title/description, but kept out of the index (not marketing content).
  if (/^\/legal\/?$/.test(pathname)) return { ...LEGAL[locale], type: "website", noindex: true }

  const id = workIdFromPath(pathname)
  if (id && isValidProject(id)) {
    const content = getProjectContent(id, locale)
    if (content) {
      return {
        title: `${content.title} — ${locale === "es" ? "Caso de estudio" : "Case study"} · GUSGQ`,
        // Tagline + role reads like a real snippet; the intro would be too long.
        description: `${content.tagline}. ${content.credits.role}.`,
        type: "article"
      }
    }
  }
  return { ...NOT_FOUND[locale], type: "website", noindex: true }
}

export function useSeo(): void {
  const { pathname } = useLocation()
  const locale = useStore((s) => s.locale)

  useEffect(() => {
    const { title, description, type, noindex } = resolve(pathname, locale)
    const url = SITE_URL + (pathname === "/" ? "/" : pathname.replace(/\/$/, ""))

    document.title = title
    meta("name", "description", description)
    meta("property", "og:title", title)
    meta("property", "og:description", description)
    meta("property", "og:url", url)
    meta("property", "og:type", type)
    meta("property", "og:locale", locale === "es" ? "es_ES" : "en_US")
    meta("name", "twitter:title", title)
    meta("name", "twitter:description", description)
    meta("name", "robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large")

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [pathname, locale])
}
