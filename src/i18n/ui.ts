import { useStore, type Locale } from "../scroll/store"

// Spanish is the source copy; brand-English words stay identical in both locales.
const UI = {
  es: {
    heroOverline: "Tecnólogo creativo — Portfolio",
    // sr-only <h1>: the visible headline is WebGL text a crawler can't read, so
    // this is both the accessible label and the page's indexable heading.
    heroH1: "GUSGQ — Gustavo Gómez, front-end y UI developer en Madrid",
    selectedWork: "Destacados",
    index: "Index",
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
    contact: "Contacto",
    letsTalk: "Hablemos",
    callMe: "Llámame",
    hi: "Hola",
    whatIDo: "Qué hago",
    trajectory: "Trayectoria",
    codeFor: "He puesto código para",
    error404: "Error 404",
    nothingHere: "Nada por aquí",
    notFoundCopy: "Esta URL no existe o se ha movido. Vuelve al índice para seguir navegando.",
    backToIndex: "Volver al índice",
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
    heroH1: "GUSGQ — Gustavo Gómez, front-end and UI developer in Madrid",
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

export function useT(): UIStrings {
  const locale = useStore((s) => s.locale)
  return UI[locale]
}
