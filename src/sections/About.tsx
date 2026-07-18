import { useCurrentProject } from "../routes/useCurrentProject"
import { Decode } from "../components/Decode"

export function About() {
  const { content } = useCurrentProject()

  // Case study: credits (role + summary + stack chips + client/year).
  if (content) {
    const c = content.credits
    return (
      <div className="min-h-[72vh] flex items-center px-6 md:px-16 pointer-events-none">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.35em] uppercase text-white/60">
            <Decode>Trabajo</Decode>
          </p>
          <p className="mt-6 font-display uppercase text-white text-2xl md:text-4xl" style={{ lineHeight: 1.15 }}>
            <Decode delay={0.06}>{c.role}</Decode>
          </p>
          <p className="mt-6 max-w-xl text-sm md:text-base leading-relaxed text-white/70">
            <Decode delay={0.12}>{c.summary}</Decode>
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {c.stack.map((s, i) => (
              <span key={s} className="rounded-full border border-white/15 px-3 py-1 text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/70">
                <Decode delay={0.18 + i * 0.04}>{s}</Decode>
              </span>
            ))}
          </div>
          {(c.client || c.year) && (
            <p className="mt-8 text-xs uppercase tracking-widest text-[var(--color-accent-b)]">
              <Decode delay={0.3}>{[c.client, c.year].filter(Boolean).join(" · ")}</Decode>
            </p>
          )}
        </div>
      </div>
    )
  }

  // Generic detail (placeholder projects).
  return (
    <div className="min-h-screen flex items-center px-6 md:px-16 pointer-events-none">
      <div className="max-w-lg">
        <p className="text-xs tracking-[0.35em] uppercase text-white/60">About</p>
        <p className="mt-6 font-display text-white text-3xl md:text-5xl" style={{ lineHeight: 1.08 }}>
          I build <span className="neon-b">immersive</span> web experiences where interaction, motion and real-time graphics meet.
        </p>
      </div>
    </div>
  )
}
