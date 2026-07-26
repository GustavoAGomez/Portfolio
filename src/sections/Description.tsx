import { useCurrentProject } from "../routes/useCurrentProject"
import { Decode } from "../components/Decode"

/**
 * Case-study brief, shown right after the hero: the client need + what the
 * development was asked to solve. Pure DOM text (no WebGL) — concise and quick
 * to read before the tech credits and the media walkthrough. Data-driven from
 * `content.intro`, so it degrades to nothing for projects without a brief.
 */
export function Description() {
  const { content } = useCurrentProject()
  const intro = content?.intro
  if (!intro) return null

  return (
    // py: when the copy is TALLER than the min-h (long briefs on phones) the
    // flex box grows to exactly the content and the next section starts glued
    // to the last line — the padding guarantees breathing room in that case
    // (with short content the min-h + centering dominates, so desktop is
    // untouched).
    <div className="min-h-[78svh] py-[12svh] flex items-center justify-start md:justify-end px-6 md:px-16 pointer-events-none">
      <div className="max-w-3xl text-left md:text-right">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>Encargo</Decode>
        </p>
        <h2 className="mt-8 font-display uppercase text-white text-3xl md:text-5xl" style={{ lineHeight: 1.05 }}>
          <Decode delay={0.06}>{intro.heading}</Decode>
        </h2>
        <div className="mt-8 max-w-xl md:ml-auto space-y-5">
          {intro.paragraphs.map((p, i) => (
            <p key={p.slice(0, 24)} className="text-base md:text-lg leading-relaxed text-white/70">
              <Decode delay={0.12 + i * 0.06}>{p}</Decode>
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
