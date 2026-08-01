import { useRef } from "react"
import { useDomParallax } from "../scroll/useDomParallax"
import { useStore } from "../scroll/store"
import { Decode } from "../components/Decode"
import { getLegal } from "../config/legalContent"

/**
 * /legal — aviso legal + privacidad (LSSI-CE + RGPD). Página estática, cookie-free.
 * Sin diamante en su ruta → R3F auto-render; LegalScene pone la palabra ambiental "LEGAL"
 * detrás de la cabecera (mismo recuerdo que 404/statement). Contenido en legalContent.ts.
 *
 * Los títulos usan <Decode> como el resto del sitio; los párrafos legales van en texto
 * plano (largos, se leen mejor sin scramble). Columna de lectura estrecha (max-w-2xl).
 */
export function Legal() {
  const line = useRef<HTMLHeadingElement>(null)
  useDomParallax(line, 0.08)
  const doc = getLegal(useStore((s) => s.locale))

  return (
    <div className="pointer-events-none relative">
      <header className="content-max min-h-[58svh] flex flex-col justify-center px-6 md:px-16 pt-[18svh] pb-[8svh]">
        <p className="text-xs font-mono tracking-[0.35em] uppercase text-white/60">
          <Decode>{doc.overline}</Decode>
        </p>
        {/* Inline lineHeight — .font-display's 0.86 collides wrapped lines. */}
        <h1 ref={line} className="mt-6 font-display uppercase tracking-tight text-white text-[12vw] md:text-[min(8vw,7.2rem)]" style={{ lineHeight: 1 }}>
          <Decode duration={0.6}>{doc.title}</Decode>
        </h1>
        <p className="mt-7 max-w-xl text-sm md:text-base leading-relaxed text-white/70">{doc.intro}</p>
        <p className="mt-4 text-[10px] md:text-xs font-mono tracking-[0.25em] uppercase text-white/40">{doc.updated}</p>
      </header>

      <div className="content-max px-6 md:px-16 pb-[16svh]">
        <div className="max-w-2xl space-y-14">
          {doc.blocks.map((b, i) => (
            <section key={b.heading}>
              <h2 className="font-display uppercase text-white text-2xl md:text-3xl" style={{ lineHeight: 1.1 }}>
                <span className="text-[var(--color-accent-b)] text-base md:text-lg align-middle mr-3 font-mono">
                  <Decode delay={0.04}>{"0" + (i + 1)}</Decode>
                </span>
                <Decode delay={0.06}>{b.heading}</Decode>
              </h2>

              {b.paragraphs?.map((p) => (
                <p key={p.slice(0, 28)} className="mt-4 text-sm md:text-base leading-relaxed text-white/70">
                  {p}
                </p>
              ))}

              {b.items && (
                <ul className="mt-5 space-y-2.5">
                  {b.items.map((it) => (
                    <li key={it} className="flex gap-3 text-sm md:text-base leading-relaxed text-white/75">
                      <span aria-hidden="true" className="text-[var(--color-accent-b)] shrink-0">
                        —
                      </span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
