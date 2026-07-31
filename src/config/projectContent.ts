/**
 * Per-project case-study content, PER LOCALE. Kept in DATA (not JSX) and read
 * through `getProjectContent(id, locale)` — the locale map returns the SAME
 * shape, so components never branch on language. Spanish is the source copy
 * (the Tagorodive text is distilled from the live site); English is its
 * translation. Media/aspect/leadGap are duplicated verbatim across locales on
 * purpose (each entry is self-contained) — when touching one, touch both.
 * Everything here is optional/degradable: projects without an entry keep the
 * generic detail layout.
 */

import type { Locale } from "../scroll/store"

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

const PROJECT_CONTENT_ES: Record<string, ProjectContent> = {
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
        heading: "Vídeo fotograma a fotograma con el scroll",
        copy: "En «El método» la sección se queda fija y el scroll manda: el progreso se mapea al currentTime del vídeo —el balón entra al aro a tu ritmo— mientras los pasos se relevan en pantalla. Un bucle rAF con guarda de seeking evita encolar búsquedas sobre el decodificador, y el clip se sirve a 720p (360p en móvil) porque el coste de cada seek lo marca la distancia al keyframe.",
        video: "/videos/basket/metodo.mp4",
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
    // With only two projects the chain is circular: basket loops back to the first.
    nextId: "tagorodive"
  }
}

const PROJECT_CONTENT_EN: Record<string, ProjectContent> = {
  tagorodive: {
    title: "TAGORODIVE",
    tagline: "A custom-built website for a dive center in El Hierro",
    intro: {
      heading: "A new website for a dive center",
      paragraphs: [
        "Tagorodive is a marine-activities center in El Hierro: professional diving — their core business —, recreational diving and experiences like the sunset tour. They needed a new website to reposition themselves in the market.",
        "I built the site on a headless CMS so their team can manage the content on their own, and implemented the SEO plan."
      ]
    },
    // Blocks describe the DEVELOPMENT work (what I built + how), not the site's
    // promotional copy. Images are captures of the features being described.
    blocks: [
      {
        heading: "A video hero",
        copy: "The landing opens full screen with a muted looping video, served from the CMS and optimized so it never weighs down the load, with the headline layered on top.",
        video: "/videos/tagoro/hero.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "A custom dive-site map",
        copy: "The island map is built with layered SVG — sea, relief and coastline — and on top of it I placed the 19 dive sites as interactive markers.",
        image: "/images/tagoro/02-map.jpg",
        aspect: 1.6
      },
      {
        heading: "GSAP zoom into every site",
        copy: "Tapping a marker makes GSAP zoom in and frame the area while its card unfolds — with a progress bar (04/19) and arrows to jump between dives — all in sync with the map.",
        video: "/videos/tagoro/map-zoom.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Custom carousels",
        copy: "Hand-rolled sliders for the courses and experiences: dragging, per-card snapping, tabs (recreational / professional) and animated transitions.",
        video: "/videos/tagoro/carousel.mp4",
        aspect: 3.165 // filmstrip (row of cards)
      },
      {
        heading: "Responsive with micro-animations",
        copy: "The whole interface adapts down to mobile, with scroll-driven reveals and GSAP-animated transitions between sections.",
        image: "/images/tagoro/05-la-isla-v.jpg",
        aspect: 0.632 // mobile view (portrait)
      }
    ],
    credits: {
      role: "Full website development — front-end architecture, headless CMS, CI/CD and SEO",
      summary:
        "Full website development with Nuxt (Vue): component architecture with Atomic Design, GSAP animations and interactions, a Storyblok headless CMS for self-managed content, CI/CD with Bitbucket Pipelines deploying to Netlify, and SEO optimization.",
      stack: ["Nuxt / Vue", "GSAP", "Storyblok", "Netlify", "Bitbucket Pipelines", "Atomic Design"],
      year: "2024",
      client: "Tagoro Dive · El Hierro"
    },
    url: "https://tagorodive.com/",
    nextId: "basket-portfolio"
  },

  "basket-portfolio": {
    title: "BASKET PORTFOLIO",
    tagline: "A custom portfolio for a professional basketball coach",
    intro: {
      heading: "A showcase for a basketball coach",
      paragraphs: [
        "Daniel is a basketball coach and coordinator with fifteen years behind him — top clubs and schools, including Movistar Estudiantes. He needed a portfolio that worked as a showcase: winning clients for one-on-one training and opening doors to new professional opportunities.",
        "I designed and built a single-page landing centered on his career: a video hero, clearly organized information sections and an animated gallery. The project is under active development."
      ]
    },
    // Blocks describe the DEVELOPMENT work (what I built + how), not the site's
    // promotional copy. Media are captures of the features being described.
    blocks: [
      {
        heading: "A full-screen video hero",
        copy: "The landing opens with a muted looping video, served locally and optimized, with a poster extracted from the clip itself so the section never flashes black while it loads. The framing uses responsive object-position so the hoop is never cropped in portrait.",
        video: "/videos/basket/hero.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Frame-by-frame video on scroll",
        copy: "In \"The method\" the section pins and scroll takes over: progress maps to the video's currentTime — the ball sinks through the hoop at your pace — while the steps relay on screen. A rAF loop with a seeking guard keeps seeks from piling up on the decoder, and the clip is served at 720p (360p on mobile) because each seek's cost is set by the distance to the keyframe.",
        video: "/videos/basket/metodo.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "A pinned parallax gallery",
        copy: "With GSAP ScrollTrigger I pin the central block while two photo columns scroll at different speeds (scrub). The whole section switches itself off under prefers-reduced-motion, where the pin and parallax would stop making sense.",
        video: "/videos/basket/parallax.mp4",
        aspect: 1.778 // 16:9
      },
      {
        heading: "Modular UI, centralized content",
        copy: "Every section is a self-contained component — a bento grid with alternating spans, a timeline, cards — and all the copy (text, figures, lists) is served from a single data module. Changing the content never touches the interface.",
        image: "/images/basket/bento.jpg",
        aspect: 1.6
      },
      {
        heading: "Light sections with accessible contrast",
        copy: "The palette flips to a light background for the training section. To keep AA contrast over the off-white, darker ink tokens are used — verified with a contrast audit that walks the rendered DOM.",
        image: "/images/basket/formacion.jpg",
        aspect: 1.665
      },
      {
        heading: "Responsive down to mobile",
        copy: "The whole interface adapts down to 390px with custom Tailwind variants (including one for short screens): the navigation collapses and scroll-driven reveals accompany the journey.",
        image: "/images/basket/mobile.jpg",
        aspect: 0.462, // mobile view (portrait)
        leadGap: 0.5 // extra air after the contrast block
      },
      {
        heading: "A footer with background video and a marquee",
        copy: "The closing section mounts a lazy-loaded background video — it doesn't request a byte until you get close — tinted to match the site's palette, with an infinite marquee of motivational phrases running on top without a seam: two identical halves that GSAP shifts by exactly -50%.",
        video: "/videos/basket/footer.mp4",
        aspect: 1.778, // 16:9
        leadGap: 0.5 // extra air after the responsive block
      }
    ],
    credits: {
      role: "Front-end web development — single-page landing, animation and interaction",
      summary:
        "A personal portfolio for a basketball coach: a single-page landing built with React and Vite, styled with Tailwind CSS 4 (CSS-only config, no JS file), animated with GSAP (ScrollTrigger for the pin and parallax) and Framer Motion transitions. Self-contained component architecture with all content centralized in a single data source, responsive down to mobile and honoring reduced-motion across the site.",
      stack: ["React", "Vite", "Tailwind CSS 4", "GSAP", "Framer Motion", "TypeScript"],
      year: "2026",
      client: "Dani Valero · Madrid"
    },
    urlPending: true,
    // With only two projects the chain is circular: basket loops back to the first.
    nextId: "tagorodive"
  }
}

const PROJECT_CONTENT: Record<Locale, Record<string, ProjectContent>> = {
  es: PROJECT_CONTENT_ES,
  en: PROJECT_CONTENT_EN
}

export function getProjectContent(id?: string | null, locale: Locale = "es"): ProjectContent | undefined {
  return id ? PROJECT_CONTENT[locale][id] : undefined
}
