export function Footer() {
  return (
    <div className="relative min-h-[70vh] flex flex-col justify-end">
      <div className="diagonal-stripe absolute inset-0" />
      <div className="relative px-6 md:px-16 pb-16">
        <p className="text-xs tracking-[0.35em] uppercase text-white/60">Contact</p>
        <a href="mailto:hello@example.com" className="pointer-events-auto inline-block font-display text-white text-5xl md:text-8xl mt-4 hover:neon-b transition-all">
          SAY HELLO
        </a>
        <p className="mt-8 text-xs text-white/40">© {new Date().getFullYear()} — Built with three.js, R3F & Lenis.</p>
      </div>
    </div>
  )
}
