import { Link } from "react-router-dom"
import { type MouseEvent } from "react"
import { useCurrentProject } from "../routes/useCurrentProject"
import { useTransition } from "../transition/TransitionProvider"
import { PROJECTS } from "../config/projects"
import { Decode } from "../components/Decode"

export function Footer() {
  const { content } = useCurrentProject()
  const { go } = useTransition()

  // Case study: link to the next project with the existing route transition.
  const nextId = content?.nextId
  const next = nextId ? PROJECTS.find((p) => p.id === nextId) : undefined
  if (content && next) {
    const to = `/work/${next.id}`
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      go(to)
    }
    return (
      <div className="relative min-h-[70vh] flex flex-col justify-end">
        <div className="diagonal-stripe absolute inset-0" />
        <div className="relative px-6 md:px-16 pb-16">
          <p className="text-xs tracking-[0.35em] uppercase text-white/60">
            <Decode>Siguiente proyecto</Decode>
          </p>
          <Link to={to} onClick={onClick} className="pointer-events-auto mt-4 inline-block font-display uppercase text-white text-5xl md:text-8xl transition-all hover:text-[var(--color-accent-b)]">
            <Decode delay={0.06}>{next.title}</Decode> →
          </Link>
          <p className="mt-8 text-xs text-white/40">
            <Decode delay={0.12}>{`© ${new Date().getFullYear()} — Built with three.js, R3F & Lenis.`}</Decode>
          </p>
        </div>
      </div>
    )
  }

  // Generic detail (placeholder projects).
  return (
    <div className="relative min-h-[70vh] flex flex-col justify-end">
      <div className="diagonal-stripe absolute inset-0" />
      <div className="relative px-6 md:px-16 pb-16">
        <p className="text-xs tracking-[0.35em] uppercase text-white/60">Contact</p>
        <a href="mailto:hello@example.com" className="pointer-events-auto inline-block font-display text-white text-5xl md:text-8xl mt-4 hover:neon-b transition-all">
          SAY HELLO
        </a>
        <p className="mt-8 text-xs text-white/40">© {new Date().getFullYear()} — Built with three.js, R3F &amp; Lenis.</p>
      </div>
    </div>
  )
}
