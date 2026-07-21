/**
 * Per-project case-study content. Kept in DATA (not JSX) and read through
 * `getProjectContent(id)`, so it's i18n-ready: a future `getProjectContent(id,
 * locale)` can resolve from a locale map returning the SAME shape — no component
 * rewrite. Everything here is optional/degradable: projects without an entry keep
 * the generic detail layout.
 *
 * The Tagorodive copy is distilled from the live site (real Spanish words, only
 * trimmed — nothing invented).
 */

export interface StoryBlock {
  heading: string
  copy: string
  /** Static image source (used when `video` is absent). */
  image?: string
  /** Looping video source. Takes precedence over `image` — rendered as a
   *  VideoTexture on the same chromatic plane (same RGB-split + parallax). */
  video?: string
  /** Media aspect (w/h). */
  aspect?: number
}

export interface ProjectCredits {
  role: string
  summary: string
  stack: string[]
  year?: string
  client?: string
}

/** Short brief shown right after the hero: the client need + what was asked. */
export interface ProjectIntro {
  heading: string
  paragraphs: string[]
}

export interface ProjectContent {
  title: string
  /** Line under the title. */
  tagline: string
  /** Concise brief (client need + development ask), rendered after the hero. */
  intro?: ProjectIntro
  /** One block per real site page, rendered vertically in the story section. */
  blocks: StoryBlock[]
  credits: ProjectCredits
  /** Live site URL — the footer's "visit the site" CTA (absent → no CTA). */
  url?: string
  /** Next project id (footer navigation). */
  nextId?: string
}

export const PROJECT_CONTENT: Record<string, ProjectContent> = {
  tagorodive: {
    title: "TAGORODIVE",
    tagline: "Web a medida para un centro de buceo en El Hierro",
    intro: {
      heading: "Nueva web para centro de buceo",
      paragraphs: [
        "Tagorodive es un centro de actividades marinas en El Hierro: buceo profesional —su actividad principal—, buceo recreativo y experiencias como el sunset tour. Necesitaban una web nueva para reposicionarse en el mercado.",
        "Desarrollé el sitio sobre un CMS headless para que su equipo gestione el contenido por su cuenta, e implementé el SEO definido."
      ]
    },
    // Blocks describe the DEVELOPMENT work (what I built + how), not the site's
    // promotional copy. Images are captures of the features being described.
    blocks: [
      {
        heading: "Un hero en vídeo",
        copy: "La portada abre a pantalla completa con un vídeo en bucle y silenciado, servido desde el CMS y optimizado para no lastrar la carga, con el titular superpuesto.",
        video: "/videos/tagoro/hero.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Un mapa de inmersiones a medida",
        copy: "El mapa de la isla está construido con SVG por capas —mar, relieve y costa— y sobre él coloqué los 19 puntos de inmersión como marcadores interactivos.",
        image: "/images/tagoro/02-map.jpg",
        aspect: 1.6
      },
      {
        heading: "Zoom a cada punto con GSAP",
        copy: "Al pulsar un marcador, GSAP hace zoom y encuadra la zona mientras se despliega su ficha —con barra de progreso (04/19) y flechas para saltar entre inmersiones— todo sincronizado con el mapa.",
        video: "/videos/tagoro/map-zoom.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Carruseles a medida",
        copy: "Sliders propios para los cursos y las experiencias: arrastre, encaje por tarjeta, pestañas (recreativo / profesional) y transiciones animadas.",
        video: "/videos/tagoro/carousel.mp4",
        aspect: 3.165 // filmstrip (fila de tarjetas)
      },
      {
        heading: "Responsive y microanimaciones",
        copy: "Toda la interfaz se adapta hasta móvil, con revelados al hacer scroll y transiciones entre secciones animadas con GSAP.",
        image: "/images/tagoro/05-la-isla-v.jpg",
        aspect: 0.632 // vista móvil (retrato)
      }
    ],
    credits: {
      role: "Desarrollo web completo — arquitectura front-end, CMS headless, CI/CD y SEO",
      summary:
        "Desarrollo web completo con Nuxt (Vue): arquitectura de componentes con Atomic Design, animaciones e interacciones con GSAP, CMS headless con Storyblok para gestion autónoma del contenido, CI/CD con Bitbucket Pipelines desplegando a Netlify, y optimización SEO.",
      stack: ["Nuxt / Vue", "GSAP", "Storyblok", "Netlify", "Bitbucket Pipelines", "Atomic Design"],
      year: "2024",
      client: "Tagoro Dive · El Hierro"
    },
    url: "https://tagorodive.com/",
    nextId: "district-4"
  }
}

export function getProjectContent(id?: string | null): ProjectContent | undefined {
  return id ? PROJECT_CONTENT[id] : undefined
}
