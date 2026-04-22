import { useEffect, useState } from 'react'

const mediaConfig = {
  heroVideoEnabled: false,
  heroVideoSrc: '/media/atelier-hero.mp4',
  heroPoster: '/media/atelier-hero.png',
  visualLead: '/media/atelier-wide.png',
  visualDetailA: '/media/atelier-materials.png',
  visualDetailB: '/media/atelier-stitching.png',
  visualDetailC: '/media/atelier-doorway.png',
  portrait: '/media/atelier-portrait.png',
  videoPoster: '/media/atelier-video-poster.png',
  atelierVideo: '/media/atelier-video.mp4'
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
    text: 'Cada pieza nace con un ritmo sereno, puntada a puntada, dentro del atelier.'
  },
  {
    title: 'Luz y textura',
    text: 'La web busca la misma sensación cálida, suave y editorial de tus imágenes.'
  },
  {
    title: 'Piezas con historia',
    text: 'Colecciones y encargos pensados para recuerdos, regalos y momentos especiales.'
  },
  {
    title: 'Base lista para crecer',
    text: 'La portada queda preparada para conectar después con colección, producto y contacto.'
  }
]

const visualNarrative = [
  {
    title: 'Toda pieza comienza con un instante de calma',
    image: mediaConfig.visualLead,
    alt: 'Vista amplia del atelier con luz suave y mesa de trabajo'
  },
  {
    title: 'Puntada a puntada',
    image: mediaConfig.visualDetailA,
    alt: 'Mesa de trabajo con hilos, flores y boceto'
  },
  {
    title: 'El hilo encuentra su forma',
    image: mediaConfig.visualDetailB,
    alt: 'Primer plano de manos bordando una flor'
  },
  {
    title: 'Hecho a mano, creado despacio',
    image: mediaConfig.visualDetailC,
    alt: 'Entrada íntima al atelier con atmósfera cálida'
  }
]

const collectionItems = [
  {
    title: 'Bolsos bordados',
    tag: 'Colección destacada',
    description: 'Piezas delicadas para acompañar días especiales con un aire suave y femenino.',
    image: mediaConfig.heroPoster,
    alt: 'Bolso bordado en un entorno cálido de atelier',
    cta: 'Ver colección'
  },
  {
    title: 'Prendas bordadas',
    tag: 'Textura y detalle',
    description: 'Diseños donde la tela, el hilo y el tiempo se convierten en una prenda con historia.',
    image: mediaConfig.visualDetailB,
    alt: 'Detalle de bordado manual sobre tela',
    cta: 'Explorar prendas'
  },
  {
    title: 'Piezas únicas',
    tag: 'Edición atelier',
    description: 'Series breves y creaciones irrepetibles con una presentación más editorial.',
    image: mediaConfig.visualLead,
    alt: 'Atelier luminoso con piezas bordadas expuestas',
    cta: 'Descubrir piezas'
  },
  {
    title: 'Encargos personalizados',
    tag: 'A medida',
    description: 'Una forma elegante de transformar una idea personal en una pieza con significado.',
    image: mediaConfig.portrait,
    alt: 'Retrato cálido de la creadora bordando junto a la ventana',
    cta: 'Solicitar encargo'
  }
]

const processSteps = [
  {
    number: '01',
    title: 'Inspiración',
    description: 'Todo empieza con una escena, una emoción o un recuerdo que merece quedarse.'
  },
  {
    number: '02',
    title: 'Boceto y materiales',
    description: 'Se eligen dibujo, colores, telas y hilos para encontrar el tono justo de la pieza.'
  },
  {
    number: '03',
    title: 'Bastidor y bordado',
    description: 'El trabajo manual convierte la idea en textura viva, volumen y presencia real.'
  },
  {
    number: '04',
    title: 'Remate final',
    description: 'Cada detalle se ajusta con calma para que la pieza llegue cuidada y lista para perdurar.'
  }
]

const journalEntries = [
  {
    title: 'La inspiración del atelier',
    meta: 'Diario del taller',
    text: 'Flores, luz filtrada y materiales suaves como punto de partida para cada nueva pieza.',
    image: mediaConfig.visualLead,
    alt: 'Vista amplia del atelier con ventana luminosa'
  },
  {
    title: 'Por qué bordamos a mano',
    meta: 'Oficio',
    text: 'El detalle manual convierte cada bordado en una presencia única, lenta y auténtica.',
    image: mediaConfig.visualDetailB,
    alt: 'Detalle de la aguja y el hilo sobre la tela'
  },
  {
    title: 'Lo que cuenta una mesa de trabajo',
    meta: 'Materiales',
    text: 'Hilos, tijeras, bocetos y bastidores construyen el lenguaje visual del atelier.',
    image: mediaConfig.visualDetailA,
    alt: 'Mesa del taller con herramientas y boceto floral'
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
                Una portada premium para presentar colecciones bordadas, encargos a medida y un diario del taller con una estética más cálida, delicada y editorial.
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
                <strong>Preparada para vídeo</strong>
                <span>
                  Cuando subas tu MP4 a <code>public/media</code>, el hero podrá usarlo sin cambiar la estructura visual de la web.
                </span>
              </div>
            </div>

            <figure className="hero-figure">
              {mediaConfig.heroVideoEnabled ? (
                <video autoPlay loop muted playsInline poster={mediaConfig.heroPoster} src={mediaConfig.heroVideoSrc} />
              ) : (
                <img src={mediaConfig.heroPoster} alt="Artesana bordando junto a una ventana luminosa" />
              )}
              <figcaption>
                Luz suave, lino, flores y bordado: el hero queda listo para mostrar la atmósfera principal de Atelier Lumière.
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

        <section className="section-block">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Narrativa visual</p>
              <h2>Una transición elegante en lugar del parallax complejo</h2>
              <p>
                Para mantener la calidad visual, la web usa ahora una composición narrativa de imágenes que conecta el hero con la colección sin depender de un efecto forzado.
              </p>
            </div>

            <div className="collection-grid">
              {visualNarrative.map((item) => (
                <article key={item.title} className="collection-card">
                  <img loading="lazy" src={item.image} alt={item.alt} />
                  <div className="collection-card__body">
                    <p className="collection-card__tag">Atelier</p>
                    <h3>{item.title}</h3>
                    <p>
                      Una secuencia visual cálida y editorial para sostener el tono artesanal antes de entrar en la parte comercial.
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="coleccion" className="section-block section-block--tinted">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Colección destacada</p>
              <h2>La página principal ya conecta con el resto de la tienda</h2>
              <p>
                Esta base deja preparada la transición hacia colección, producto y encargos con una estética consistente y mucho más cercana a las referencias del chat.
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
                    <a className="text-link" href={item.title === 'Encargos personalizados' ? '#encargos' : '#proceso'}>
                      {item.cta}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="proceso" className="section-block">
          <div className="container process-layout">
            <div className="process-gallery">
              <figure className="process-gallery__lead">
                <img loading="lazy" src={mediaConfig.visualLead} alt="Vista amplia del atelier lleno de materiales" />
              </figure>

              <figure className="process-gallery__detail">
                <img loading="lazy" src={mediaConfig.visualDetailA} alt="Mesa del atelier con boceto y materiales" />
                <figcaption>Materiales, bocetos y herramientas que sostienen el lenguaje del atelier.</figcaption>
              </figure>

              <figure className="process-gallery__detail">
                <img loading="lazy" src={mediaConfig.visualDetailB} alt="Detalle de un bordado en proceso" />
                <figcaption>La puntada convierte el dibujo en textura y presencia real.</figcaption>
              </figure>
            </div>

            <div className="process-copy">
              <div className="section-heading section-heading--compact">
                <p className="eyebrow">Proceso artesanal</p>
                <h2>Cómo nace una pieza</h2>
                <p>
                  Una explicación sencilla y visual para que la web no sea solo bonita, sino también clara y útil para quien llega por primera vez.
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

        <section id="video" className="section-block section-block--soft">
          <div className="container video-panel">
            <div className="video-panel__media">
              <video autoPlay loop muted playsInline poster={mediaConfig.videoPoster} src={mediaConfig.atelierVideo} />
            </div>

            <div className="video-panel__copy">
              <p className="eyebrow">Vídeo del atelier</p>
              <h2>Un bloque listo para tus clips y futuros hero videos</h2>
              <p>
                Esta sección permite introducir tu vídeo actual sin romper el ritmo de la portada. Más adelante se puede reutilizar también para el hero principal.
              </p>

              <ul className="feature-list">
                <li>Preparado para vídeo real en MP4 dentro de <code>public/media</code>.</li>
                <li>Poster coherente con el resto de la dirección de arte del proyecto.</li>
                <li>Base clara para hero, reels, making-of o piezas de campaña.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="container split-panels">
            <article id="sobre-mi" className="story-card">
              <img loading="lazy" src={mediaConfig.visualDetailC} alt="Vista del atelier desde la puerta" />

              <div className="story-card__body">
                <p className="eyebrow">Sobre la creadora</p>
                <h2>Una historia tejida con dedicación</h2>
                <p>
                  Este bloque presenta a la creadora desde una mirada íntima, femenina y auténtica, reforzando la sensación de atelier real y de marca artesanal cuidada.
                </p>
                <ul className="note-list">
                  <li>La web se apoya en luz cálida, textura y gestos pequeños.</li>
                  <li>La estructura está lista para crecer con producto, checkout y contacto.</li>
                  <li>El tono visual sigue la misma línea de las referencias compartidas en este chat.</li>
                </ul>
              </div>
            </article>

            <article id="encargos" className="story-card story-card--accent">
              <div className="story-card__body story-card__body--centered">
                <p className="eyebrow">Encargos personalizados</p>
                <h2>Piezas únicas creadas para momentos con historia</h2>
                <p>
                  Un bloque claro para transformar la portada en una invitación real al encargo, no solo en una galería de imágenes bonitas.
                </p>
                <a className="button button--dark" href="mailto:atelier@atelierlumiere.com">
                  Solicitar un encargo
                </a>
                <small>Después podemos llevar esta misma línea visual a la página específica de encargos.</small>
              </div>

              <img loading="lazy" src={mediaConfig.portrait} alt="Retrato cercano de la creadora bordando" />
            </article>
          </div>
        </section>

        <section id="diario" className="section-block section-block--soft">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Diario del taller</p>
              <h2>Contenido editorial para sostener la marca</h2>
              <p>
                El diario añade una capa más narrativa y hace que la web respire como una pequeña revista del atelier, no solo como un escaparate.
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
              Portada editorial inspirada en todo lo que hemos definido en este chat: hero premium, sección visual narrativa, colección, proceso, vídeo y encargos.
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
