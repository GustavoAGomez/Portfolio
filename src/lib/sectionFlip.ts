import gsap from "gsap"

// FLIP for the language switch: captureSectionTops() runs BEFORE setLocale
// (LangSwitch), playSectionFlip() runs in SiteShell's layout effect AFTER the
// remount commit. Elements owned by useDomParallax can't take a gsap transform —
// their offset is tweened via data-flip-y, which the hook adds into its own transform.

const BLOCKS = "h1, h2, h3, p, ol, ul"

interface Snapshot {
  sections: Map<string, number>
  blocks: Map<string, number>
  counts: Map<string, number>
}

let captured: Snapshot | null = null

export function captureSectionTops(): void {
  const snap: Snapshot = { sections: new Map(), blocks: new Map(), counts: new Map() }
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    const id = el.dataset.section
    if (!id) return
    snap.sections.set(id, el.getBoundingClientRect().top)
    const blocks = el.querySelectorAll<HTMLElement>(BLOCKS)
    snap.counts.set(id, blocks.length)
    blocks.forEach((b, i) => snap.blocks.set(`${id}#${i}`, b.getBoundingClientRect().top))
  })
  captured = snap
}

export function playSectionFlip(reducedMotion: boolean): void {
  const prev = captured
  captured = null
  if (!prev || reducedMotion) return

  const moved: HTMLElement[] = []
  const proxies: { el: HTMLElement; from: number }[] = []
  document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
    const id = el.dataset.section ?? ""
    const old = prev.sections.get(id)
    if (old == null) return
    const sectionDelta = old - el.getBoundingClientRect().top
    const animateSection = Math.abs(sectionDelta) >= 2
    if (animateSection) {
      gsap.set(el, { y: sectionDelta })
      moved.push(el)
    }
    const blocks = el.querySelectorAll<HTMLElement>(BLOCKS)
    if (blocks.length !== prev.counts.get(id)) return
    blocks.forEach((b, i) => {
      const oldB = prev.blocks.get(`${id}#${i}`)
      if (oldB == null) return
      const delta = oldB - b.getBoundingClientRect().top - (animateSection ? sectionDelta : 0)
      if (Math.abs(delta) < 1) return
      if (b.dataset.domParallax !== undefined) {
        b.dataset.flipY = String(delta)
        proxies.push({ el: b, from: delta })
      } else {
        gsap.set(b, { y: delta })
        moved.push(b)
      }
    })
  })
  if (!moved.length && !proxies.length) return

  const remeasure = () => window.dispatchEvent(new Event("resize"))
  const state = { p: 0 }
  gsap.to(state, {
    p: 1,
    duration: 0.65,
    ease: "power2.inOut",
    onUpdate: () => {
      proxies.forEach(({ el, from }) => {
        el.dataset.flipY = String(from * (1 - state.p))
      })
      remeasure()
    },
    onComplete: () => {
      proxies.forEach(({ el }) => delete el.dataset.flipY)
      remeasure()
    }
  })
  if (moved.length) gsap.to(moved, { y: 0, duration: 0.65, ease: "power2.inOut", clearProps: "transform" })
}
