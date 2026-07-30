import { useStore, type Locale } from "../scroll/store"

/**
 * UI microcopy dictionary (overlines, buttons, labels). Long-form CONTENT lives
 * with its data (projectContent / aboutContent / projects — each keyed by
 * locale); this file only holds the scattered interface strings. Spanish is the
 * source copy — the ONLY English kept in the Spanish site is vocabulary Spanish
 * actually uses (front-end, UI, scroll, portfolio, los ambient words 3D como
 * PROJECT/ABOUT). `useT()` is reactive: switching locale re-renders consumers.
 */
const UI = {
  es: {
    // Global chrome
    heroOverline: "Tecnólogo creativo — Portfolio",
    selectedWork: "Trabajos seleccionados",
    index: "Índice",
    // Case study
    details: "Detalles",
    brief: "Encargo",
    credits: "Trabajo",
    liveSite: "Sitio en vivo",
    visitSite: "Visitar la web",
    comingSoon: "Próximamente",
    inDevelopment: "En desarrollo",
    whoIsBehind: "Quién hay detrás",
    aboutMe: "Sobre mí",
    nextProject: "Siguiente proyecto",
    // Contact
    contact: "Contacto",
    letsTalk: "Hablemos",
    callMe: "Llámame",
    // About page
    hi: "Hola",
    whatIDo: "Qué hago",
    trajectory: "Trayectoria",
    codeFor: "He puesto código para",
    // 404
    error404: "Error 404",
    nothingHere: "Nada por aquí",
    notFoundCopy: "Esta URL no existe o se ha movido. Vuelve al índice para seguir navegando.",
    backToIndex: "Volver al índice",
    // Generic detail placeholder (projects without case-study content)
    stGeneric1: "LA CULTURA",
    stGeneric2: "NO ES",
    stGeneric3: "TU AMIGA.",
    genericAboutPre: "Construyo experiencias web ",
    genericAboutHighlight: "inmersivas",
    genericAboutPost: " donde se encuentran la interacción, el movimiento y los gráficos en tiempo real.",
    sayHello: "Saluda",
    builtWith: "Hecho con three.js, R3F y Lenis."
  },
  en: {
    heroOverline: "Creative Technologist — Portfolio",
    selectedWork: "Selected Work",
    index: "Index",
    details: "Details",
    brief: "The brief",
    credits: "The work",
    liveSite: "Live site",
    visitSite: "Visit the site",
    comingSoon: "Coming soon",
    inDevelopment: "In development",
    whoIsBehind: "Who's behind",
    aboutMe: "About me",
    nextProject: "Next project",
    contact: "Contact",
    letsTalk: "Let's talk",
    callMe: "Call me",
    hi: "Hi",
    whatIDo: "What I do",
    trajectory: "Trajectory",
    codeFor: "I've written code for",
    error404: "Error 404",
    nothingHere: "Nothing here",
    notFoundCopy: "This URL doesn't exist or has moved. Head back to the index to keep browsing.",
    backToIndex: "Back to the index",
    stGeneric1: "CULTURE IS",
    stGeneric2: "NOT YOUR",
    stGeneric3: "FRIEND.",
    genericAboutPre: "I build ",
    genericAboutHighlight: "immersive",
    genericAboutPost: " web experiences where interaction, motion and real-time graphics meet.",
    sayHello: "Say hello",
    builtWith: "Built with three.js, R3F & Lenis."
  }
} as const satisfies Record<Locale, Record<string, string>>

export type UIStrings = (typeof UI)[Locale]

/** Reactive UI strings for the active locale. */
export function useT(): UIStrings {
  const locale = useStore((s) => s.locale)
  return UI[locale]
}
