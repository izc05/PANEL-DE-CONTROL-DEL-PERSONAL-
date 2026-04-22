import { useEffect, useState } from 'react'
import {
  aboutNotes,
  contactDetails,
  heroHighlights,
  journalEntries,
  mediaConfig,
  navItems,
  processSteps,
  products,
  valuePoints,
  visualNarrative
} from './content'

const getRouteFromHash = (hash) => {
  const value = hash.replace(/^#/, '') || '/'
  return value.startsWith('/') ? value : `/${value}`
}

const collectionPreview = products.slice(0, 4)

const categories = ['Todos', 'Bolsos bordados', 'Prendas bordadas', 'Piezas únicas', 'Accesorios', 'Encargos']

function Header({ isScrolled, menuOpen, setMenuOpen, route }) {
  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <a className="brand-mark" href="#/">
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
            <a key={item.href} href={item.href} className={route === getRouteFromHash(item.href) ? 'is-active' : ''}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function PageHero({ eyebrow, title, text, image, alt, actions = [], compact = false }) {
  return (
    <section className={`page-hero ${compact ? 'page-hero--compact' : ''}`}>
      <div className="container page-hero__grid">
        <div className="page-hero__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{text}</p>
          {actions.length > 0 ? (
            <div className="hero-actions">
              {actions.map((action) => (
                <a key={action.href} className={`button ${action.kind === 'secondary' ? 'button--secondary' : 'button--primary'}`} href={action.href}>
                  {action.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <figure className="page-hero__media">
          <img src={image} alt={alt} />
        </figure>
      </div>
    </section>
  )
}

function HomePage() {
  return (
    <>
      <section id="inicio" className="hero-section hero-section--rich">
        <div className="container hero-section__grid hero-section__grid--rich">
          <div className="hero-copy hero-copy--rich">
            <p className="eyebrow">Atelier francés · bordado artesanal contemporáneo</p>
            <h1>Donde el hilo cuenta historias</h1>
            <p className="hero-copy__lead">
              Una portada más ambiciosa, más cinematográfica y más premium para presentar colecciones bordadas, encargos a medida y un diario del taller con alma propia.
            </p>

            <div className="hero-actions">
              <a className="button button--primary" href="#/coleccion">
                Descubrir la colección
              </a>
              <a className="button button--secondary" href="#/encargos">
                Ver encargos a medida
              </a>
            </div>

            <div className="hero-note hero-note--quote">
              <strong>Atelier Lumière</strong>
              <span>
                Un universo de luz, lino, flores y bordado preparado para crecer sin perder delicadeza ni calidad visual.
              </span>
            </div>
          </div>

          <div className="hero-stage">
            <figure className="hero-figure hero-figure--video">
              {mediaConfig.heroVideoEnabled ? (
                <video autoPlay loop muted playsInline poster={mediaConfig.heroPoster} src={mediaConfig.heroVideoSrc} />
              ) : (
                <img src={mediaConfig.heroPoster} alt="Artesana bordando junto a una ventana luminosa" />
              )}
            </figure>

            <div className="hero-floating-card">
              <p className="collection-card__tag">Firma visual</p>
              <h3>Hero con vídeo real</h3>
              <p>
                La portada ya puede usar el vídeo del atelier como entrada principal para que la web no se sienta plana ni sosa.
              </p>
            </div>
          </div>
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

      <section className="section-block section-block--soft">
        <div className="container editorial-ribbon">
          {heroHighlights.map((item) => (
            <div key={item} className="editorial-pill">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Narrativa visual</p>
            <h2>Una transición elegante y más rica visualmente</h2>
            <p>
              En lugar de un parallax flojo, la portada usa una secuencia editorial de imágenes que sostiene la atmósfera artesanal y conecta mejor con la tienda.
            </p>
          </div>

          <div className="narrative-mosaic">
            <article className="narrative-mosaic__lead">
              <img src={visualNarrative[0].image} alt={visualNarrative[0].alt} />
              <div className="narrative-mosaic__caption">
                <p className="collection-card__tag">Atelier</p>
                <h3>{visualNarrative[0].title}</h3>
              </div>
            </article>

            <div className="narrative-mosaic__side">
              {visualNarrative.slice(1).map((item) => (
                <article key={item.title} className="collection-card">
                  <img src={item.image} alt={item.alt} />
                  <div className="collection-card__body">
                    <p className="collection-card__tag">Proceso</p>
                    <h3>{item.title}</h3>
                    <p>Una escena cálida y editorial para reforzar el universo visual de la marca.</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block section-block--tinted">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Colección destacada</p>
            <h2>La portada conecta con la parte de venta sin perder encanto</h2>
            <p>
              Esta base deja preparada la transición hacia colección, producto y encargos con una estética consistente y más cercana a las referencias del chat.
            </p>
          </div>

          <div className="collection-grid">
            {collectionPreview.map((item) => (
              <article key={item.slug} className="collection-card">
                <img loading="lazy" src={item.image} alt={item.alt} />
                <div className="collection-card__body">
                  <p className="collection-card__tag">{item.tag}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a className="text-link" href="#/coleccion">
                    Ver colección
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
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

      <section className="section-block section-block--soft">
        <div className="container video-panel">
          <div className="video-panel__media">
            <video autoPlay loop muted playsInline poster={mediaConfig.heroPoster} src={mediaConfig.atelierVideo} />
          </div>

          <div className="video-panel__copy">
            <p className="eyebrow">Vídeo del atelier</p>
            <h2>El clip ya acompaña la experiencia principal</h2>
            <p>
              El vídeo existente deja de ser un elemento suelto y pasa a formar parte de la narrativa de la portada para elevar la experiencia de entrada.
            </p>

            <ul className="feature-list">
              <li>Hero con movimiento real y tono cinematográfico.</li>
              <li>Preparado para sustituir clip o poster más adelante.</li>
              <li>Base válida para reels, landing y futuras campañas.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container split-panels">
          <article className="story-card">
            <img loading="lazy" src={mediaConfig.visualDetailC} alt="Vista del atelier desde la puerta" />

            <div className="story-card__body">
              <p className="eyebrow">Sobre la creadora</p>
              <h2>Una historia tejida con dedicación</h2>
              <p>
                Este bloque presenta a la creadora desde una mirada íntima, femenina y auténtica, reforzando la sensación de atelier real y de marca artesanal cuidada.
              </p>
              <ul className="note-list">
                {aboutNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="text-link" href="#/sobre-mi">
                Ir a la página completa
              </a>
            </div>
          </article>

          <article className="story-card story-card--accent">
            <div className="story-card__body story-card__body--centered">
              <p className="eyebrow">Encargos personalizados</p>
              <h2>Piezas únicas creadas para momentos con historia</h2>
              <p>
                Un bloque claro para transformar la portada en una invitación real al encargo, no solo en una galería de imágenes bonitas.
              </p>
              <a className="button button--dark" href="#/encargos">
                Solicitar un encargo
              </a>
              <small>Después podemos llevar esta misma línea visual a la página específica de encargos.</small>
            </div>

            <img loading="lazy" src={mediaConfig.portrait} alt="Retrato cercano de la creadora bordando" />
          </article>
        </div>
      </section>

      <section className="section-block section-block--soft">
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
              <article key={entry.slug} className="journal-card">
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
    </>
  )
}

function CollectionPage() {
  return (
    <>
      <PageHero
        eyebrow="Colección"
        title="Piezas bordadas con una presencia más premium"
        text="La colección queda planteada como una subpágina real, lista para recibir nuevos artículos, categorías y futuras fichas de producto."
        image={mediaConfig.visualLead}
        alt="Colección bordada presentada en el atelier"
      />

      <section className="section-block">
        <div className="container">
          <div className="pill-list">
            {categories.map((category) => (
              <span key={category} className="editorial-pill editorial-pill--category">
                {category}
              </span>
            ))}
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article key={product.slug} className="product-card">
                <img src={product.image} alt={product.alt} />
                <div className="product-card__body">
                  <p className="collection-card__tag">{product.category}</p>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="product-card__meta">
                    <strong>{product.price}</strong>
                    <a className="text-link" href="#/encargos">
                      Consultar / comprar
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function OrdersPage() {
  return (
    <>
      <PageHero
        eyebrow="Encargos personalizados"
        title="Tu historia bordada con intención"
        text="Esta subpágina abre el servicio de encargos con un tono más emocional y una explicación clara del proceso para convertirlo después en una sección realmente útil para clientes."
        image={mediaConfig.portrait}
        alt="Creadora bordando una pieza personalizada junto a la ventana"
        actions={[{ label: 'Escribir ahora', href: 'mailto:atelier@atelierlumiere.com' }]}
      />

      <section className="section-block section-block--soft">
        <div className="container process-layout">
          <div className="process-copy">
            <div className="section-heading section-heading--compact">
              <p className="eyebrow">Cómo funciona</p>
              <h2>Del recuerdo al bordado final</h2>
              <p>
                La estructura queda lista para explicar el servicio con claridad: idea, boceto, selección de materiales, bordado y entrega cuidada.
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

          <article className="contact-card">
            <p className="eyebrow">Encargo a medida</p>
            <h3>Piezas creadas para bodas, recuerdos, homenajes o regalos</h3>
            <p>
              Aquí después podremos añadir formulario, ejemplos de encargos y condiciones sin perder la estética premium del conjunto.
            </p>
            <a className="button button--dark" href="mailto:atelier@atelierlumiere.com">
              Solicitar un encargo
            </a>
          </article>
        </div>
      </section>
    </>
  )
}

function JournalPage() {
  return (
    <>
      <PageHero
        eyebrow="Diario del taller"
        title="Historias, proceso y escenas del atelier"
        text="El diario queda preparado como una revista visual donde añadir artículos nuevos solo requiere editar el listado de contenido."
        image={mediaConfig.visualDetailA}
        alt="Mesa del taller con bocetos, flores y materiales"
      />

      <section className="section-block">
        <div className="container journal-grid journal-grid--large">
          {journalEntries.map((entry) => (
            <article key={entry.slug} className="journal-card">
              <img src={entry.image} alt={entry.alt} />
              <div className="journal-card__body">
                <p className="journal-card__meta">{entry.meta}</p>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
                <a className="text-link" href="#/diario">
                  Leer artículo
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre mí"
        title="Una marca construida desde la calma y el detalle"
        text="Esta subpágina cuenta quién está detrás del atelier con una composición más íntima y una base preparada para ampliar el relato de marca cuando quieras."
        image={mediaConfig.portrait}
        alt="Retrato de la creadora en el atelier"
      />

      <section className="section-block">
        <div className="container split-panels split-panels--single">
          <article className="story-card">
            <img src={mediaConfig.visualDetailC} alt="Entrada al atelier con luz suave" />
            <div className="story-card__body">
              <p className="eyebrow">Atelier Lumière</p>
              <h2>Una historia de luz, hilo y piezas que perduran</h2>
              <p>
                La página queda lista para desarrollar mejor la historia personal, la inspiración de la marca, el enfoque artesanal y los valores que la diferencian.
              </p>
              <ul className="note-list">
                {aboutNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>
    </>
  )
}

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos de la pieza que quieres crear"
        text="La página de contacto queda planteada para resolver dudas, abrir encargos y facilitar pequeños cambios futuros sin tocar demasiado la estructura general."
        image={mediaConfig.visualLead}
        alt="Atelier luminoso listo para recibir encargos"
      />

      <section className="section-block section-block--soft">
        <div className="container info-form-grid">
          <article className="contact-card">
            <p className="eyebrow">Información</p>
            <h3>Escríbeme y cuéntame tu idea</h3>
            <div className="contact-list">
              {contactDetails.map((item) =>
                item.href ? (
                  <a key={item.label} href={item.href}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </a>
                ) : (
                  <div key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </div>
                )
              )}
            </div>
          </article>

          <form className="contact-form">
            <label>
              Nombre
              <input type="text" placeholder="Tu nombre" />
            </label>
            <label>
              Correo electrónico
              <input type="email" placeholder="Tu correo" />
            </label>
            <label>
              Mensaje
              <textarea rows="6" placeholder="Cuéntame qué te gustaría bordar" />
            </label>
            <button type="button" className="button button--primary">
              Enviar mensaje
            </button>
          </form>
        </div>
      </section>
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="footer-brand">
          <a className="brand-mark brand-mark--footer" href="#/">
            Atelier Lumière
            <span>Broderie artisanale</span>
          </a>
          <p>
            Portada y subpáginas pensadas para crecer con facilidad: productos, artículos, imágenes y pequeños cambios se pueden mantener desde un archivo de contenido más sencillo.
          </p>
        </div>

        <div className="footer-column">
          <h2>Contacto</h2>
          {contactDetails.map((item) =>
            item.href ? (
              <a key={item.label} href={item.href}>
                {item.value}
              </a>
            ) : (
              <span key={item.label}>{item.value}</span>
            )
          )}
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
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [route, setRoute] = useState(getRouteFromHash(window.location.hash))

  useEffect(() => {
    document.title = 'Atelier Lumière'

    const onScroll = () => setIsScrolled(window.scrollY > 18)
    const onHashChange = () => {
      setRoute(getRouteFromHash(window.location.hash))
      setMenuOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  let page = <HomePage />

  if (route === '/coleccion') page = <CollectionPage />
  if (route === '/encargos') page = <OrdersPage />
  if (route === '/diario') page = <JournalPage />
  if (route === '/sobre-mi') page = <AboutPage />
  if (route === '/contacto') page = <ContactPage />

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <Header isScrolled={isScrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} route={route} />
      <main id="main-content">{page}</main>
      <Footer />
    </div>
  )
}
