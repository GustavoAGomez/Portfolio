/**
 * About-me page content. Kept in DATA (not JSX) like projectContent.ts, so it's
 * i18n-ready and the copy can be tuned without touching layout. The structure
 * follows how top creative-dev portfolios present themselves (Payot / Bizarro /
 * Miranda): a short first-person bio, the trajectory as a 3-line mini-timeline
 * (NOT a LinkedIn-style CV), 3–4 numbered areas instead of a skills wall, and a
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
  photo: { src: string; aspect: number }
  /** First-person bio — 2 SHORT paragraphs max (decode makes long text tedious). */
  bio: string[]
  /** Numbered areas (01–04) — what I do, not every tool I've touched. */
  areas: AboutArea[]
  /** Mini-timeline, newest first — one line per stage, no bullet lists. */
  stints: AboutStint[]
  /** Brands reached through agency/team work (credit without NDA'd visuals). */
  brands: string[]
}

export const ABOUT: AboutContent = {
  title: "GUSTAVO GÓMEZ",
  tagline: "Creative front-end — Madrid",
  photo: { src: "/images/about/gustavo.jpg", aspect: 0.666 },
  bio: [
    "Llevo más de ocho años convirtiendo diseños complejos en interfaces vivas: animación, scroll y 3D en tiempo real, con la tipografía como material.",
    "Vengo de la publicidad —piezas interactivas a golpe de GSAP— y hoy construyo design systems y producto para grandes marcas desde Garaje de Ideas."
  ],
  areas: [
    { title: "Interfaces & animación", detail: "GSAP · scroll · microinteracciones · WebGL" },
    { title: "Front-end a escala", detail: "React · TypeScript · design systems · Storybook" },
    { title: "Webs editoriales & CMS", detail: "Nuxt / Vue · Storyblok · SEO" },
    { title: "Apps nativas", detail: "React Native · datos en tiempo real" }
  ],
  stints: [
    { period: "2021 — Hoy", place: "Garaje de Ideas", summary: "Design systems y producto para Santander, Toyota y PagoNxt" },
    { period: "2021", place: "Zerintia", summary: "App industrial en React Native con datos en tiempo real" },
    { period: "2017 — 2021", place: "Pixel & Pixel", summary: "Webs corporativas y piezas interactivas con GSAP" }
  ],
  brands: ["Banco Santander", "Toyota", "Netflix", "Mercedes-Benz", "PagoNxt", "Adeslas", "Catalonia"]
}
