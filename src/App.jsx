import { useEffect, useState } from 'react'

const mediaConfig = {
  heroVideoEnabled: false,
  heroVideoSrc: '/videos/hero.mp4',
  parallaxVideoEnabled: false,
  parallaxVideoSrc: '/videos/parallax.mp4'
}

const heroVideoSrc = mediaConfig.heroVideoEnabled ? mediaConfig.heroVideoSrc : ''
const heroPosterSrc = 'https://images.unsplash.com/photo-1512339917191-3356b5f326f9?auto=format&fit=crop&w=2000&q=80'
const parallaxVideoSrc = mediaConfig.parallaxVideoEnabled ? mediaConfig.parallaxVideoSrc : ''
const parallaxPosterSrc = 'https://images.unsplash.com/photo-1473447198193-c7c5040a2de8?auto=format&fit=crop&w=1800&q=80'

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Colección', href: '#coleccion' },
  { label: 'Encargos', href: '#encargos' },
  { label: 'Diario del taller', href: '#diario' },
  { label: 'Sobre mí', href: '#sobre-mi' },
  { label: 'Contacto', href: '#contacto' }
]

export default function App() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div id="inicio" className="bg-cream text-ink font-body">
      <header className="fixed top-0 z-50 w-full border-b border-white/20 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a href="#inicio" className="font-display text-3xl tracking-wide">Atelier Lumière</a>
          <nav className="hidden gap-7 text-sm md:flex">
            {navItems.map((item) => <a key={item.label} href={item.href} className="transition hover:text-gold">{item.label}</a>)}
          </nav>
        </div>
      </header>

      <section className="relative min-h-[94vh] overflow-hidden">
        {heroVideoSrc ? (
          <video className="absolute inset-0 h-full w-full object-cover" src={heroVideoSrc} autoPlay loop muted playsInline poster={heroPosterSrc} />
        ) : (
          <img src={heroPosterSrc} alt="Mujer bordando en atelier" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2f221acc] via-[#3f342b99] to-[#00000014]" />
        <div className="relative mx-auto flex min-h-[94vh] max-w-7xl items-center px-6 pt-20 lg:px-10">
          <div className="max-w-2xl space-y-6 text-white">
            <h1 className="font-display text-5xl leading-tight md:text-7xl">Donde el hilo cuenta historias</h1>
            <p className="max-w-xl text-base leading-relaxed text-white/90 md:text-lg">Piezas bordadas a mano en un atelier francés donde la luz, la textura y el tiempo convierten cada detalle en una historia.</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#coleccion" className="rounded-full bg-white px-7 py-3 text-sm font-medium text-ink">Descubrir la colección</a>
              <a href="#proceso" className="rounded-full border border-white/45 px-7 py-3 text-sm text-white">Ver el proceso</a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-[145vh] overflow-hidden bg-[#f6efe5]">
        {parallaxVideoSrc ? (
          <video className="absolute inset-0 h-full w-full object-cover opacity-35" src={parallaxVideoSrc} autoPlay loop muted playsInline poster={parallaxPosterSrc} style={{ transform: `translateY(${scrollY * -0.05}px) scale(${1 + Math.min(scrollY / 12000, 0.08)})` }} />
        ) : (
          <img src={parallaxPosterSrc} alt="Tela y bastidor en atelier" className="absolute inset-0 h-full w-full object-cover opacity-25" style={{ transform: `translateY(${scrollY * -0.04}px) scale(${1 + Math.min(scrollY / 14000, 0.06)})` }} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(181,154,111,0.15),transparent_45%),radial-gradient(circle_at_80%_50%,rgba(230,210,203,0.28),transparent_42%)]" />
        <div className="sticky top-0 mx-auto flex h-screen max-w-5xl items-center justify-center px-6 text-center">
          <p className="max-w-2xl font-display text-4xl leading-tight text-ink md:text-6xl">Hecho a mano, creado despacio</p>
        </div>
      </section>

      <section id="coleccion" className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><h2 className="font-display text-5xl">Colección destacada</h2></section>
      <section id="proceso" className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><h2 className="font-display text-5xl">El proceso</h2></section>
      <section id="sobre-mi" className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><h2 className="font-display text-5xl">Sobre la creadora</h2></section>
      <section id="encargos" className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><h2 className="font-display text-5xl">Encargos personalizados</h2></section>
      <section id="diario" className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><h2 className="font-display text-5xl">Diario del taller</h2></section>
      <footer id="contacto" className="bg-[#2a211c] px-6 py-14 text-[#f6efe7]"><p>© 2026 Atelier Lumière</p></footer>
    </div>
  )
}
