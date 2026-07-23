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
  /** Extra vertical space (in viewport heights) BEFORE this block, to loosen the
   *  rhythm between two blocks. Mirrored in BOTH the DOM (Story margin) and the
   *  WebGL plane anchor (StoryScene), so text and plane stay aligned. */
  leadGap?: number
  /** Playback speed for a `video` block (1 = normal). Values < 1 slow it down —
   *  useful when a captured clip reads too fast on the chromatic plane. */
  playbackRate?: number
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
  /** Site still in development: the footer shows a non-clickable "Próximamente"
   *  instead of the live-site CTA. Ignored when `url` is present. */
  urlPending?: boolean
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
    nextId: "basket-portfolio"
  },

  "basket-portfolio": {
    title: "BASKET PORTFOLIO",
    tagline: "Portfolio a medida para un entrenador profesional de baloncesto",
    intro: {
      heading: "Un escaparate para un entrenador de baloncesto",
      paragraphs: [
        "Daniel es entrenador y coordinador de baloncesto con quince años de recorrido —clubes y colegios de referencia, incluido Movistar Estudiantes—. Necesitaba un portfolio que funcionara como escaparate: captar clientes para entrenamientos individuales y abrir puertas a nuevas oportunidades profesionales.",
        "Diseñé y desarrollé una landing de una sola página centrada en su trayectoria: un hero en vídeo, secciones de información organizada y una galería animada. El proyecto está en desarrollo activo."
      ]
    },
    // Blocks describe the DEVELOPMENT work (what I built + how), not the site's
    // promotional copy. Media are captures of the features being described.
    blocks: [
      {
        heading: "Un hero a pantalla completa en vídeo",
        copy: "La portada abre con un vídeo en bucle y silenciado, servido en local y optimizado, con un poster extraído del propio clip para que la sección no aparezca en negro mientras carga. El encuadre usa object-position responsive para no cortar el aro en vertical.",
        video: "/videos/basket/hero.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Galería con pin y parallax",
        copy: "Con GSAP ScrollTrigger fijo (pin) el bloque central mientras dos columnas de fotos se desplazan a distinta velocidad (scrub). Toda la sección se desactiva bajo prefers-reduced-motion, donde el pin y el parallax dejarían de tener sentido.",
        video: "/videos/basket/parallax.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Interfaz modular y contenido centralizado",
        copy: "Cada sección es un componente autónomo —un bento grid con spans alternos, una línea de tiempo, tarjetas— y todo el copy (textos, cifras, listas) se sirve desde un único módulo de datos. Cambiar el contenido no toca la interfaz.",
        image: "/images/basket/bento.jpg",
        aspect: 1.6
      },
      {
        heading: "Secciones claras con contraste accesible",
        copy: "La paleta cambia a fondo claro en formación. Para mantener el contraste AA sobre el blanco hueso se usan tokens de tinta más oscuros, verificados con una auditoría de contraste que recorre el DOM renderizado.",
        image: "/images/basket/formacion.jpg",
        aspect: 1.665
      },
      {
        heading: "Responsive hasta el móvil",
        copy: "Toda la interfaz se adapta hasta 390px con variantes propias de Tailwind (incluida una para pantallas bajas): la navegación colapsa y los revelados al hacer scroll acompañan al recorrido.",
        image: "/images/basket/mobile.jpg",
        aspect: 0.462, // vista móvil (retrato)
        leadGap: 0.5 // más aire respecto al bloque de contraste anterior
      },
      {
        heading: "Footer con vídeo de fondo y marquee",
        copy: "El cierre monta un vídeo de fondo con lazy-load —no pide un byte hasta que te acercas— teñido para respetar la gama del sitio, y encima un marquee infinito de frases motivacionales que corre en bucle sin salto: son dos mitades idénticas que GSAP desplaza un -50% exacto.",
        video: "/videos/basket/footer.mp4",
        aspect: 1.778, // 16:9
        leadGap: 0.5 // más aire respecto al bloque responsive anterior
      }
    ],
    credits: {
      role: "Desarrollo web front-end — landing de una sola página, animación e interacción",
      summary:
        "Portfolio personal para un entrenador de baloncesto: landing de una sola página con React y Vite, estilos con Tailwind CSS 4 (configuración en CSS, sin archivo JS), animación con GSAP (ScrollTrigger para el pin y el parallax) y transiciones con Framer Motion. Arquitectura de componentes autónomos con el contenido centralizado en un único data source, responsive hasta móvil y con reduced-motion respetado en todo el sitio.",
      stack: ["React", "Vite", "Tailwind CSS 4", "GSAP", "Framer Motion", "TypeScript"],
      year: "2026",
      client: "Dani Valero · Madrid"
    },
    urlPending: true,
    nextId: "district-4"
  }
}

export function getProjectContent(id?: string | null): ProjectContent | undefined {
  return id ? PROJECT_CONTENT[id] : undefined
}
