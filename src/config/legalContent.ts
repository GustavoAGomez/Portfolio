import type { Locale } from "../scroll/store"

/**
 * Aviso legal + privacidad — data-driven, i18n-ready (mismo patrón que aboutContent/projectContent).
 * Contenido en DATOS; `Legal.tsx` lo pinta. Copy en ES (fuente) y EN.
 *
 * OJO: NIF y dirección postal quedan como "(por completar)" — sólo Gustavo puede
 * rellenarlos y no deben inventarse. El resto de datos son reales (nombre, contacto,
 * localidad, alojamiento). Esta web es estática y cookie-free, de ahí el enfoque.
 */
export interface LegalBlock {
  heading: string
  paragraphs?: string[]
  /** Lista de líneas (identificación, derechos…). */
  items?: string[]
}

export interface LegalDoc {
  overline: string
  title: string
  intro: string
  updated: string
  blocks: LegalBlock[]
}

const ES: LegalDoc = {
  overline: "Información legal",
  title: "Aviso legal y privacidad",
  intro:
    "Este es el portfolio profesional de Gustavo Gómez. La información de esta página cumple con la normativa española (LSSI-CE) y europea de protección de datos (RGPD), y explica de forma transparente qué hace este sitio con tus datos: en la práctica, casi nada.",
  updated: "Última actualización: 1 de agosto de 2026",
  blocks: [
    {
      heading: "Titular del sitio",
      items: [
        "Responsable: Gustavo Gómez",
        "NIF: (por completar)",
        "Localidad: Madrid, España",
        "Correo: stgustavo.gomez@gmail.com",
        "Teléfono: 657 163 577",
        "Sitio web: gusgq.es",
        "Alojamiento: Netlify (Netlify, Inc.)"
      ]
    },
    {
      heading: "Objeto",
      paragraphs: [
        "Este sitio es un portfolio personal cuyo fin es mostrar trabajos y servicios de desarrollo front-end y UI. El acceso y la navegación son gratuitos y no requieren registro.",
        "El titular se reserva el derecho a modificar en cualquier momento los contenidos, sin previo aviso, así como a suspender temporalmente el acceso por motivos técnicos."
      ]
    },
    {
      heading: "Propiedad intelectual",
      paragraphs: [
        "El código, el diseño, los textos y las piezas gráficas de este sitio son obra de Gustavo Gómez y están protegidos por los derechos de propiedad intelectual e industrial. No se permite su reproducción, distribución o transformación sin autorización.",
        "Las marcas de terceros que puedan citarse (clientes y proyectos en los que se ha colaborado) pertenecen a sus respectivos titulares y se mencionan únicamente a título informativo, sin que ello implique vínculo comercial, patrocinio ni recomendación. Parte de esos trabajos se realizaron dentro de equipos o agencias."
      ]
    },
    {
      heading: "Privacidad y datos personales",
      paragraphs: [
        "Este sitio es una página estática: no dispone de formularios, registro, comentarios ni sistema de recogida de datos. No se solicitan ni se almacenan datos personales a través de la web.",
        "El proveedor de alojamiento (Netlify) puede registrar de forma automática datos técnicos —como la dirección IP, el tipo de navegador o las páginas visitadas— en sus registros de servidor, con la finalidad de prestar el servicio y garantizar su seguridad y funcionamiento. La base jurídica de este tratamiento es el interés legítimo (art. 6.1.f del RGPD). Netlify puede procesar estos datos en servidores situados fuera del Espacio Económico Europeo, amparándose en las garantías de transferencia internacional previstas por dicho proveedor.",
        "Si contactas por correo electrónico o teléfono, se tratarán los datos que facilites con la única finalidad de atender y responder a tu consulta. Estos datos no se cederán a terceros ni se utilizarán para ninguna otra finalidad, y se conservarán solo el tiempo necesario para gestionar la comunicación."
      ]
    },
    {
      heading: "Tus derechos",
      paragraphs: [
        "Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a stgustavo.gomez@gmail.com, indicando el derecho que deseas ejercer.",
        "Si consideras que el tratamiento de tus datos no se ajusta a la normativa, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es)."
      ]
    },
    {
      heading: "Cookies",
      paragraphs: [
        "Este sitio no utiliza cookies, ni tecnologías de rastreo, ni herramientas de analítica de terceros. Las fuentes tipográficas y el resto de recursos se sirven desde el propio dominio, sin llamadas a servicios externos.",
        "Lo único que se guarda en tu navegador (mediante almacenamiento local) es tu preferencia de idioma, para recordarla entre visitas. Es un dato técnico necesario para el funcionamiento del propio sitio, que tú mismo activas, que no identifica a la persona usuaria ni se comparte con nadie; por ello está exento del deber de consentimiento previo."
      ]
    },
    {
      heading: "Legislación aplicable",
      paragraphs: [
        "Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso de este sitio, las partes se someten a los juzgados y tribunales de Madrid, salvo que la normativa aplicable en materia de consumo disponga otro fuero."
      ]
    }
  ]
}

const EN: LegalDoc = {
  overline: "Legal information",
  title: "Legal notice & privacy",
  intro:
    "This is the professional portfolio of Gustavo Gómez. The information on this page complies with Spanish (LSSI-CE) and European data-protection law (GDPR), and transparently explains what this site does with your data: in practice, almost nothing.",
  updated: "Last updated: 1 August 2026",
  blocks: [
    {
      heading: "Site owner",
      items: [
        "Owner: Gustavo Gómez",
        "Tax ID (NIF): (to be completed)",
        "Location: Madrid, Spain",
        "Email: stgustavo.gomez@gmail.com",
        "Phone: +34 657 163 577",
        "Website: gusgq.es",
        "Hosting: Netlify (Netlify, Inc.)"
      ]
    },
    {
      heading: "Purpose",
      paragraphs: [
        "This site is a personal portfolio whose purpose is to showcase front-end and UI development work and services. Access and browsing are free and require no registration.",
        "The owner reserves the right to modify the contents at any time without prior notice, and to temporarily suspend access for technical reasons."
      ]
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        "The code, design, text and graphic pieces on this site are the work of Gustavo Gómez and are protected by intellectual and industrial property rights. Their reproduction, distribution or transformation is not permitted without authorisation.",
        "Any third-party trademarks that may be cited (clients and projects collaborated on) belong to their respective owners and are mentioned for informational purposes only, without implying any commercial relationship, sponsorship or endorsement. Some of that work was carried out within teams or agencies."
      ]
    },
    {
      heading: "Privacy & personal data",
      paragraphs: [
        "This site is a static page: it has no forms, registration, comments or data-collection system. No personal data is requested or stored through the website.",
        "The hosting provider (Netlify) may automatically log technical data —such as IP address, browser type or pages visited— in its server logs, in order to provide the service and ensure its security and operation. The legal basis for this processing is legitimate interest (Art. 6.1.f GDPR). Netlify may process this data on servers located outside the European Economic Area, relying on the international-transfer safeguards provided by that provider.",
        "If you get in touch by email or phone, the data you provide will be processed for the sole purpose of handling and answering your enquiry. This data will not be shared with third parties or used for any other purpose, and will be kept only for as long as needed to manage the communication."
      ]
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can exercise your rights of access, rectification, erasure, objection, restriction of processing and portability by writing to stgustavo.gomez@gmail.com, stating the right you wish to exercise.",
        "If you believe your data is not being processed in accordance with the law, you have the right to lodge a complaint with the Spanish Data Protection Agency (aepd.es)."
      ]
    },
    {
      heading: "Cookies",
      paragraphs: [
        "This site uses no cookies, no tracking technologies and no third-party analytics tools. Fonts and all other assets are served from the site's own domain, with no calls to external services.",
        "The only thing stored in your browser (via local storage) is your language preference, so it can be remembered between visits. It is a technical piece of data necessary for the site itself to work, activated by you, that does not identify the user or get shared with anyone; it is therefore exempt from the prior-consent requirement."
      ]
    },
    {
      heading: "Applicable law",
      paragraphs: [
        "This legal notice is governed by Spanish law. For the resolution of any dispute arising from access to or use of this site, the parties submit to the courts of Madrid, unless applicable consumer legislation establishes a different jurisdiction."
      ]
    }
  ]
}

export function getLegal(locale: Locale): LegalDoc {
  return locale === "en" ? EN : ES
}
