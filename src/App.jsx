import { useEffect, useState } from 'react'

const media = {
  hero: '/media/atelier-hero.png',
  doorway: '/media/atelier-doorway.png',
  wide: '/media/atelier-wide.png',
  stitching: '/media/atelier-stitching.png',
  materials: '/media/atelier-materials.png',
  portrait: '/media/atelier-portrait.png',
  video: '/media/atelier-video.mp4'
}

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Colección', href: '#coleccion' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Encargos', href: '#encargos' },
  { label: 'Diario', href: '#diario' },
  { label: 'Contacto', href: '#contacto' }
]

const valuePoints = [
  {
    title: 'Hecho a mano',
    text: 'Cada pieza se trabaja con calma, puntada a puntada, en nuestro atelier.'
  },
  {
    title: 'Materiales nobles',
    text: 'Lino, hilos suaves, paletas empolvadas y acabados pensados para durar.'
  },
  {
    title: 'Encargos con historia',
    text: 'Creamos piezas únicas para regalos, celebraciones y recuerdos importantes.'
  },
  {
    title: 'Narrativa visual',
    text: 'La web respira la misma luz cálida y editorial que tienen tus referencias.'
  }
]

const collectionItems = [
  {
    title: 'Colección atelier',
    tag: 'Selección principal',
    description:
      'Una portada más editorial para presentar piezas bordadas, series cortas y novedades con intención.',
    image: media.hero,
    alt: 'Artesana bordando junto a la ventana',
    cta: 'Ver la propuesta'
  },
  {
    title: 'Detalles bordados',
    tag: 'Textura y oficio',
    description:
      'Primeros planos del trabajo manual para transmitir delicadeza, tiempo y autenticidad real.',
    image: media.stitching,
    alt: 'Primer plano de manos bordando una flor',
    cta: 'Explorar detalles'
  },
  {
    title: 'Ritual de taller',
    tag: 'Proceso lento',
    description:
      'Mesas, hilos, bocetos y bastidores que ayudan a contar cómo nace cada pieza en el atelier.',
    image: media.materials,
    alt: 'Mesa del taller con hilos, dibujo y bastidor',
    cta: 'Ver el proceso'
  },
  {
    title: 'Encargos a medida',
    tag: 'Piezas únicas',
    description:
      'Una narrativa preparada para convertir ideas personales en piezas bordadas con significado.',
    image: media.doorway,
    alt: 'Vista íntima del atelier desde la puerta',
    cta: 'Solicitar un encargo'
  }
]

const processSteps = [
  {
    number: '01',
    title: 'Inspiración',
    description: 'Partimos de una historia, una emoción o una escena que merece quedarse.'
  },
  {
    number: '02',
    title: 'Materiales',
    description: 'Elegimos telas, hilos y tonos suaves para que la pieza respire con naturalidad.'
  },
  {
    number: '03',
    title: 'Bordado',
    description: 'La forma aparece despacio: textura, volumen y ritmo construidos a mano.'
  },
  {
    number: '04',
    title: 'Entrega',
    description: 'Rematamos cada detalle para que la pieza llegue cuidada, lista para perdurar.'
  }
]

const atelierNotes = [
  'Atelier Lumière nace de la calma, la luz y los gestos pequeños que dejan huella.',
  'Esta versión ya utiliza tus imágenes reales como base visual del proyecto.',
  'La estructura queda preparada para seguir ampliando colección, producto, carrito y checkout.'
]

const journalEntries = [
  {
    title: 'La inspiración del atelier',
    meta: 'Diario del taller',
    text: 'Flores, luz filtrada y materiales suaves como punto de partida para cada pieza.',
    image: media.wide,
    alt: 'Vista amplia del atelier bordado'
  },
  {
    title: 'Por qué bordamos a mano',
    meta: 'Oficio',
    text: 'El detalle manual convierte cada bordado en una pieza con presencia propia.',
    image: media.stitching,
    alt: 'Detalle de manos bordando'
  },
  {
    title: 'Lo que cuenta una mesa de trabajo',
    meta: 'Materiales',
    text: 'Hilos, bocetos y bastidores construyen la atmósfera que la web necesita transmitir.',
    image: media.materials,
    alt: 'Mesa del atelier con herramientas y boceto floral'
  }
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    document.title = 'Atelier Lumière'

    const onScroll = () => {
      setIsScrolled(window.scrollY > 18)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container site-header__inner">
          <a className="brand-mark" href="#inicio" onClick={closeMenu}>
            Atelier Lumière
            <span>Broderie artisanale</span>
          </a>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menú
          </button>

          <nav
            id="primary-navigation"
            className={`site-nav ${menuOpen ? 'is-open' : ''}`}
            aria-label="Navegación principal"
          >
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section id="inicio" className="hero-section">
          <div className="container hero-section__grid">
            <div className="hero-copy">
              <p className="eyebrow">Bordado artesanal contemporáneo</p>
              <h1>Donde el hilo cuenta historias</h1>
              <p className="hero-copy__lead">
                Ya he empezado a montar la web con tus imágenes reales del atelier para que el tono
                visual se acerque mucho más a la identidad que me has compartido.
              </p>

              <div className="hero-actions">
                <a className="button button--primary" href="#coleccion">
                  Descubrir la colección
                </a>
                <a className="button button--secondary" href="#video">
                  Ver el vídeo del atelier
                </a>
              </div>

              <div className="hero-note">
                <strong>Hecho a mano en Francia</strong>
                <span>
                  Una narrativa pensada para mostrar colección, proceso, encargos y contenido de
                  marca.
                </span>
              </div>
            </div>

            <figure className="hero-figure">
              <img src={media.hero} alt="Artesana bordando junto a una ventana luminosa" />
              <figcaption>
                Luz suave, lino, flores y bordado: esta escena marca ahora el tono general de la
                portada.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="value-ribbon" aria-label="Valores del atelier">
          <div className="container value-ribbon__grid">
            {valuePoints.map((item) => (
              <article key={item.title} className="value-card">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="coleccion" className="section-block">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Base visual de la web</p>
              <h2>Colección, proceso y encargo ya tienen lenguaje propio</h2>
              <p>
                Tomé tus mockups como referencia y usé las fotos reales del atelier para que esta
                primera versión ya se sienta coherente, delicada y lista para seguir creciendo.
              </p>
            </div>

            <div className="collection-grid">
              {collectionItems.map((item) => (
                <article key={item.title} className="collection-card">
                  <img loading="lazy" src={item.image} alt={item.alt} />
                  <div className="collection-card__body">
                    <p className="collection-card__tag">{item.tag}</p>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <a className="text-link" href={item.title === 'Encargos a medida' ? '#encargos' : '#proceso'}>
                      {item.cta}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="proceso" className="section-block section-block--tinted">
          <div className="container process-layout">
            <div className="process-gallery">
              <figure className="process-gallery__lead">
                <img loading="lazy" src={media.wide} alt="Vista amplia del atelier lleno de materiales" />
              </figure>

              <figure className="process-gallery__detail">
                <img loading="lazy" src={media.materials} alt="Mesa del atelier con boceto y materiales" />
                <figcaption>Materiales, bocetos y herramientas de trabajo.</figcaption>
              </figure>

              <figure className="process-gallery__detail">
                <img loading="lazy" src={media.stitching} alt="Detalle de un bordado en proceso" />
                <figcaption>La puntada convierte el dibujo en textura viva.</figcaption>
              </figure>
            </div>

            <div className="process-copy">
              <div className="section-heading section-heading--compact">
                <p className="eyebrow">Proceso artesanal</p>
                <h2>Cada sección ya cuenta cómo nace una pieza</h2>
                <p>
                  En lugar de dejar solo títulos sueltos, organicé el relato para que el visitante
                  entienda rápido qué haces, cómo trabajas y por qué cada encargo tiene valor.
                </p>
              </div>

              <ol className="step-list">
                {processSteps.map((step) => (
                  <li key={step.number} className="step-list__item">
                    <span>{step.number}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="video" className="section-block">
          <div className="container video-panel">
            <div className="video-panel__media">
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={media.wide}
                src={media.video}
              />
            </div>

            <div className="video-panel__copy">
              <p className="eyebrow">Vídeo del atelier</p>
              <h2>Tu material de vídeo ya está integrado en la experiencia</h2>
              <p>
                Coloqué el clip como un bloque protagonista para que la web no dependa solo de
                imágenes estáticas. Así la marca gana atmósfera, ritmo y una sensación más viva.
              </p>

              <ul className="feature-list">
                <li>Vídeo suave y silencioso, preparado para acompañar la narrativa visual.</li>
                <li>Poster coherente con el resto de la dirección de arte del atelier.</li>
                <li>Sección reutilizable para futuro hero, reels o piezas de campaña.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container split-panels">
            <article id="sobre-mi" className="story-card">
              <img loading="lazy" src={media.doorway} alt="Vista del atelier desde la puerta" />

              <div className="story-card__body">
                <p className="eyebrow">Sobre la creadora</p>
                <h2>Una historia tejida con dedicación</h2>
                <p>
                  Esta parte queda pensada para presentar a la creadora con una imagen más íntima y
                  un texto que respira mejor. La web empieza a parecerse mucho más a tu universo.
                </p>

                <ul className="note-list">
                  {atelierNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </article>

            <article id="encargos" className="story-card story-card--accent">
              <div className="story-card__body story-card__body--centered">
                <p className="eyebrow">Encargos personalizados</p>
                <h2>Piezas únicas creadas para momentos con historia</h2>
                <p>
                  Dejé un bloque claro para convertir la portada en una invitación real al encargo,
                  no solo en una galería bonita.
                </p>
                <a className="button button--dark" href="mailto:atelier@atelierlumiere.com">
                  Solicitar un encargo
                </a>
                <small>También podemos llevar este mismo lenguaje a catálogo, producto y checkout.</small>
              </div>

              <img loading="lazy" src={media.portrait} alt="Retrato cercano de la creadora bordando" />
            </article>
          </div>
        </section>

        <section id="diario" className="section-block section-block--soft">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Diario del taller</p>
              <h2>Contenido editorial para sostener la marca</h2>
              <p>
                Tus referencias también piden una parte más narrativa. Por eso dejé una base de
                artículos visuales para inspiración, proceso y detalles del día a día.
              </p>
            </div>

            <div className="journal-grid">
              {journalEntries.map((entry) => (
                <article key={entry.title} className="journal-card">
                  <img loading="lazy" src={entry.image} alt={entry.alt} />
                  <div className="journal-card__body">
                    <p className="journal-card__meta">{entry.meta}</p>
                    <h3>{entry.title}</h3>
                    <p>{entry.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contacto" className="site-footer">
        <div className="container site-footer__grid">
          <div className="footer-brand">
            <a className="brand-mark brand-mark--footer" href="#inicio">
              Atelier Lumière
              <span>Broderie artisanale</span>
            </a>
            <p>
              Portada editorial inspirada en tu material visual, preparada para seguir creciendo con
              colección, producto, carrito y checkout.
            </p>
          </div>

          <div className="footer-column">
            <h2>Contacto</h2>
            <a href="mailto:atelier@atelierlumiere.com">atelier@atelierlumiere.com</a>
            <a href="tel:+33612345678">+33 6 12 34 56 78</a>
            <span>Provence, France</span>
          </div>

          <div className="footer-column">
            <h2>Navega</h2>
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <form className="footer-form">
            <h2>Newsletter</h2>
            <p>Recibe novedades, historias del taller y nuevas colecciones.</p>
            <div className="footer-form__row">
              <input type="email" placeholder="Tu correo electrónico" aria-label="Correo electrónico" />
              <button type="button">Suscribirme</button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  )
}
