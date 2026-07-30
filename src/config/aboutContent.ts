import type { Locale } from "../scroll/store"

/**
 * About-me page content, PER LOCALE (`getAbout(locale)`; Spanish is the source
 * copy). Kept in DATA (not JSX) like projectContent.ts, so the copy can be
 * tuned without touching layout. The structure
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

/** Locale-independent facts, shared by both entries (phone/photo/brands). */
const PHONE = { display: "657 163 577", href: "tel:+34657163577" }
const PHOTO = { src: "/images/about/gustavo.jpg", aspect: 0.666 }
const BRANDS = ["Banco Santander", "PagoNxt", "Getnet", "Mutua Madrileña", "Mazda", "Toyota", "Netflix", "Mercedes-Benz", "Adeslas", "Catalonia", "Burger King", "Vodafone"]

const ABOUT_ES: AboutContent = {
  title: "GUSTAVO GÓMEZ",
  tagline: "Front-end & UI developer — Madrid",
  phone: PHONE,
  photo: PHOTO,
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
  brands: BRANDS
}

const ABOUT_EN: AboutContent = {
  title: "GUSTAVO GÓMEZ",
  tagline: "Front-end & UI developer — Madrid",
  phone: PHONE,
  photo: PHOTO,
  bio: [
    "I'm a front-end and UI developer: I obsess over every interaction and make sure the design fits pixel-perfect on any device. My strong suit is animation — JavaScript, canvas and Three.js.",
    "I love websites with a unique visual identity, unlike any other, and I bring that same care to product at scale: corporate websites and web applications. I'm currently studying a master's in AI-powered application development."
  ],
  areas: [
    { title: "Animation & 3D", detail: "GSAP · Canvas · Three.js · scroll" },
    { title: "UI in detail", detail: "Micro-interactions · pixel-perfect responsive" },
    { title: "Components at scale", detail: "React · Angular · Vue · Lit · Stencil · Storybook · atomic design" },
    { title: "Apps & CMS", detail: "React Native · Ionic · Storyblok · Drupal · WordPress · Strapi" },
    { title: "AI-powered development", detail: "Claude Code · Codex · OpenCode · spec-driven development" }
  ],
  stints: [
    { period: "Now", place: "The Big School", summary: "Master's in AI-powered application development — Spec-Driven Development" },
    { period: "2021 — Today", place: "Garaje de Ideas", summary: "Front-end and UI development across many projects" },
    { period: "2021", place: "Zerintia", summary: "Industrial React Native app with real-time data" },
    { period: "2017 — 2021", place: "Pixel & Pixel", summary: "Front-end for corporate websites and commercial pieces." }
  ],
  brands: BRANDS
}

const ABOUT_BY_LOCALE: Record<Locale, AboutContent> = { es: ABOUT_ES, en: ABOUT_EN }

/** Locale-independent access (phone/photo/brands are shared constants). */
export const ABOUT = ABOUT_ES

export function getAbout(locale: Locale): AboutContent {
  return ABOUT_BY_LOCALE[locale]
}
