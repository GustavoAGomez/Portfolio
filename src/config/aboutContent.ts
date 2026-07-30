/**
 * About-me page content. Kept in DATA (not JSX) like projectContent.ts, so it's
 * i18n-ready and the copy can be tuned without touching layout. The structure
 * follows how top creative-dev portfolios present themselves (Payot / Bizarro /
 * Miranda): a short first-person bio, the trajectory as a mini-timeline
 * (NOT a LinkedIn-style CV), a few numbered areas instead of a skills wall, and a
 * brands list that credits agency/team work without exposing NDA'd projects.
 * The detailed per-project stack stays where it belongs: in each case study's
 * `credits.stack`.
 */

export interface AboutArea {
  title: string
  /** Short mono detail line — a few tools, not an inventory. */
  detail: string
}

/** One line of the mini-timeline (period + place + what happened there). */
export interface AboutStint {
  period: string
  place: string
  summary: string
}

export interface AboutContent {
  /** Big display name (statement-style hero). */
  title: string
  tagline: string
  /** Direct call CTA — `href` is a tel: URI so tapping opens the device dialer. */
  phone: { display: string; href: string }
  photo: { src: string; aspect: number }
  /** First-person bio — 2 SHORT paragraphs max (decode makes long text tedious). */
  bio: string[]
  /** Numbered areas (01–05) — what I do, not every tool I've touched. */
  areas: AboutArea[]
  /** Mini-timeline, newest first — one line per stage, no bullet lists. */
  stints: AboutStint[]
  /** Brands reached through agency/team work (credit without NDA'd visuals). */
  brands: string[]
}

export const ABOUT: AboutContent = {
  title: "GUSTAVO GÓMEZ",
  tagline: "Front-end & UI developer — Madrid",
  phone: { display: "657 163 577", href: "tel:+34657163577" },
  photo: { src: "/images/about/gustavo.jpg", aspect: 0.666 },
  bio: [
    "Soy front-end y UI developer: mimo cada interacción y cuido que el diseño encaje a la perfección en cualquier dispositivo. Mi punto fuerte es la animación — JavaScript, canvas y Three.js.",
    "Me gustan las webs con un aspecto visual único, que no se parecen a ninguna otra, y llevo ese mismo cuidado al producto a gran escala: desarrollo de webs y aplicaciones corporativas. Ahora estudio un máster de desarrollo de aplicaciones con IA."
  ],
  areas: [
    { title: "Animación & 3D", detail: "GSAP · Canvas · Three.js · scroll" },
    { title: "UI al detalle", detail: "Microinteracciones · responsive pixel-perfect" },
    { title: "Componentes a escala", detail: "React · Angular · Vue · Lit · Stencil · Storybook · atomic design" },
    { title: "Apps & CMS", detail: "React Native · Ionic · Storyblok · Drupal · WordPress · Strapi" },
    { title: "Desarrollo con IA", detail: "Claude Code · Codex · OpenCode · spec-driven development" }
  ],
  stints: [
    { period: "Ahora", place: "The Big School", summary: "Máster en desarrollo de aplicaciones con IA — Spec-Driven Development" },
    { period: "2021 — Hoy", place: "Garaje de Ideas", summary: "Front-end y UI development en diversos proyectos" },
    { period: "2021", place: "Zerintia", summary: "App industrial en React Native con datos en tiempo real" },
    { period: "2017 — 2021", place: "Pixel & Pixel", summary: "Front-end para webs corporativas y piezas comerciales." }
  ],
  brands: ["Banco Santander", "PagoNxt", "Getnet", "Mutua Madrileña", "Mazda", "Toyota", "Netflix", "Mercedes-Benz", "Adeslas", "Catalonia", "Burger king", "Vodafone"]
}
