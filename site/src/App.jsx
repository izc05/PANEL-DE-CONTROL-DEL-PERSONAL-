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
  signatureQuote,
  valuePoints,
  visualNarrative
} from './content'

const routeTitles = {
  '/': 'Atelier Lumière',
  '/coleccion': 'Colección · Atelier Lumière',
  '/producto': 'Producto · Atelier Lumière',
  '/encargos': 'Encargos · Atelier Lumière',
  '/diario': 'Diario del taller · Atelier Lumière',
  '/sobre-mi': 'Sobre mí · Atelier Lumière',
  '/contacto': 'Contacto · Atelier Lumière'
}

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
        <a className="brand-mark" href="#/" onClick={() => setMenuOpen(false)}>
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
            <a
              key={item.href}
              href={item.href}
              className={route === getRouteFromHash(item.href) ? 'is-active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-tools" aria-label="Accesos rápidos">
          <a className="cart-pill" href="#/coleccion" onClick={() => setMenuOpen(false)}>
            Cesta 0
          </a>
        </div>
      </div>
    </header>
  )
}

function HomePage() {
  return (
    <>
      <section id="inicio" className="hero-v4 hero-v4--clean">
        <div className="hero-v4__media-wrap">
          <figure className="hero-v4__media">
            {mediaConfig.heroVideoEnabled ? (
              <video autoPlay loop muted playsInline poster={mediaConfig.heroPoster} src={mediaConfig.heroVideoSrc} />
            ) : (
              <img src={mediaConfig.heroPoster} alt="Artesana bordando junto a una ventana luminosa" />
            )}
          </figure>
        </div>
        <div className="hero-v4__veil" />
        <div className="container hero-v4__grid">
          <div className="hero-v4__copy">
            <p className="eyebrow">Atelier francés · bordado artesanal</p>
            <h1>Donde el hilo cuenta historias</h1>
            <p className="hero-v4__lead">
              Piezas bordadas a mano con calma, luz y delicadeza. Un atelier donde cada puntada convierte un recuerdo en algo único.
            </p>

            <div className="hero-actions">
              <a className="button button--primary" href="#/coleccion">
                Descubrir la colección
              </a>
              <a className="button button--secondary" href="#/encargos">
                Solicitar un encargo
              </a>
            </div>

            <div className="hero-v4__highlights">
              {heroHighlights.map((item) => (
                <span key={item} className="hero-pill">
                  {item}
                </span>
              ))}
            </div>

            <p className="hero-v4__closing">Hecho a mano, creado despacio.</p>
          </div>
        </div>
      </section>

      <section className="section-block section-block--soft section-block--compact-top">
        <div className="container">
          <article className="quote-panel quote-panel--signature">
            <p className="eyebrow">Atelier Lumière</p>
            <h3>{signatureQuote.title}</h3>
            <p>{signatureQuote.text}</p>
          </article>
        </div>
      </section>

      <section className="value-ribbon value-ribbon--premium" aria-label="Valores del atelier">
        <div className="container value-ribbon__grid">
          {valuePoints.map((item) => (
            <article key={item.title} className="value-card value-card--premium">
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block section-block--editorial">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Narrativa visual</p>
              <h2>Escenas del atelier entre luz, hilo y textura</h2>
            </div>
            <p>
              Una pausa visual para descubrir el proceso artesanal antes de entrar en colección y encargos.
            </p>
          </div>

          <div className="editorial-collage editorial-collage--v3">
            <article className="editorial-collage__feature editorial-collage__feature--v3">
              <img src={visualNarrative[0].image} alt={visualNarrative[0].alt} />
              <div className="editorial-collage__copy">
                <p className="collection-card__tag">Atelier</p>
                <h3>{visualNarrative[0].title}</h3>
              </div>
            </article>

            <div className="editorial-collage__side editorial-collage__side--v3">
              {visualNarrative.slice(1).map((item) => (
                <article key={item.title} className="editorial-mini-card editorial-mini-card--v3">
                  <img src={item.image} alt={item.alt} />
                  <div>
                    <p className="collection-card__tag">Proceso</p>
                    <h3>{item.title}</h3>
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
            <div>
              <p className="eyebrow">Colección destacada</p>
              <h2>Piezas creadas con calma, para durar</h2>
            </div>
            <p>
              Una selección pensada para descubrir el universo del atelier a través de bordados, texturas suaves y detalles hechos a mano.
            </p>
          </div>

          <div className="collection-grid collection-grid--featured-v3">
            {collectionPreview.map((item, index) => (
              <article key={item.slug} className={`collection-card collection-card--featured ${index === 0 ? 'collection-card--hero-v3' : ''}`}>
                <img loading="lazy" src={item.image} alt={item.alt} />
                <div className="collection-card__body">
                  <p className="collection-card__tag">{item.tag}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="collection-card__footer">
                    <strong>{item.price}</strong>
                    <a className="text-link" href="#/coleccion">
                      Ver colección
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block process-showcase">
        <div className="container process-showcase__grid">
          <div className="process-showcase__media">
            <figure className="process-image process-image--large">
              <img loading="lazy" src={mediaConfig.visualLead} alt="Vista amplia del atelier lleno de materiales" />
            </figure>
            <figure className="process-image process-image--small">
              <img loading="lazy" src={mediaConfig.visualDetailA} alt="Mesa del atelier con boceto y materiales" />
            </figure>
            <figure className="process-image process-image--small">
              <img loading="lazy" src={mediaConfig.visualDetailB} alt="Detalle de un bordado en proceso" />
            </figure>
          </div>

          <div className="process-copy process-copy--premium">
            <div className="section-heading section-heading--compact">
              <p className="eyebrow">Proceso artesanal</p>
              <h2>Cómo nace una pieza</h2>
              <p>
                Del primer boceto al último remate, cada etapa se trabaja con precisión y calma para conservar la esencia artesanal.
              </p>
            </div>

            <ol className="step-list step-list--premium">
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
        <div className="container cinematic-panel cinematic-panel--v3">
          <div className="cinematic-panel__copy">
            <p className="eyebrow">El gesto, la luz y el oficio</p>
            <h2>Cada pieza nace en un proceso lento, íntimo y cuidadosamente elaborado.</h2>
            <p>
              Entre bastidores, cada puntada se trabaja con paciencia para que la pieza final conserve presencia, delicadeza y carácter propio.
            </p>
          </div>

          <div className="cinematic-panel__media">
            <video autoPlay loop muted playsInline poster={mediaConfig.heroPoster} src={mediaConfig.atelierVideo} />
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container split-panels split-panels--premium">
          <article className="story-card story-card--premium">
            <img loading="lazy" src={mediaConfig.visualDetailC} alt="Vista del atelier desde la puerta" />
            <div className="story-card__body">
              <p className="eyebrow">Sobre la creadora</p>
              <h2>Una historia tejida con dedicación</h2>
              <p>
                Atelier Lumière nace de una práctica lenta y consciente, donde cada pieza se elabora a mano para perdurar en el tiempo.
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

          <article className="story-card story-card--accent story-card--premium-accent">
            <div className="story-card__body story-card__body--centered">
              <p className="eyebrow">Encargos personalizados</p>
              <h2>Piezas únicas creadas para momentos con historia</h2>
              <p>
                Encargos pensados para celebrar recuerdos, nombres y fechas con un bordado hecho exclusivamente para ti.
              </p>
              <a className="button button--dark" href="#/encargos">
                Solicitar un encargo
              </a>
            </div>

            <img loading="lazy" src={mediaConfig.portrait} alt="Retrato cercano de la creadora bordando" />
          </article>
        </div>
      </section>

      <section className="section-block section-block--soft">
        <div className="container">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Diario del taller</p>
              <h2>Historias del taller, entre luz y materia</h2>
            </div>
            <p>
              Un espacio para compartir procesos, inspiración y escenas cotidianas del oficio artesanal.
            </p>
          </div>

          <div className="journal-grid journal-grid--editorial">
            {journalEntries.map((entry) => (
              <article key={entry.slug} className="journal-card journal-card--editorial">
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

function PageHero({ eyebrow, title, text, image, alt, actions = [] }) {
  return (
    <section className="page-hero page-hero--premium">
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

function CollectionPage() {
  return (
    <>
      <section className="collection-hero">
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy">
            <p className="eyebrow">Colección</p>
            <h1>Piezas bordadas con alma artesanal</h1>
            <p>
              Una selección de bolsos, textiles y creaciones bordadas a mano, pensadas para acompañar momentos especiales con delicadeza y presencia.
            </p>
            <a className="button button--primary" href="#/producto">
              Ver piezas disponibles
            </a>
          </div>
          <div className="collection-hero__media">
            <video controls playsInline poster={mediaConfig.heroPoster} src={mediaConfig.collectionVideoSrc} />
          </div>
        </div>
      </section>

      <section className="section-block section-block--soft">
        <div className="container boutique-intro">
          <article className="boutique-panel boutique-panel--feature">
            <div>
              <p className="eyebrow">Selección curada</p>
              <h2>Piezas para regalar, guardar y recordar</h2>
              <p>
                Diseños bordados a mano que combinan materiales suaves, acabados delicados y una presencia serena.
              </p>
            </div>
            <img src={products[0].image} alt={products[0].alt} />
          </article>

          <div className="boutique-stats">
            <article className="mini-stat-card">
              <strong>06</strong>
              <span>Piezas iniciales</span>
            </article>
            <article className="mini-stat-card">
              <strong>01</strong>
              <span>Encargo a medida</span>
            </article>
            <article className="mini-stat-card">
              <strong>100%</strong>
              <span>Trabajo artesanal</span>
            </article>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="pill-list pill-list--shop">
            {categories.map((category, index) => (
              <span key={category} className={`editorial-pill editorial-pill--category ${index === 0 ? 'is-active' : ''}`}>
                {category}
              </span>
            ))}
          </div>

          <div className="shop-toolbar">
            <p>Explora piezas bordadas, accesorios, objetos decorativos y encargos personalizados.</p>
            <div className="shop-toolbar__actions">
              <span className="editorial-pill">Más recientes</span>
              <span className="editorial-pill">Edición atelier</span>
            </div>
          </div>

          <div className="product-grid product-grid--shop">
            {products.map((product) => (
              <article key={product.slug} className="product-card product-card--shop">
                <img src={product.image} alt={product.alt} />
                <div className="product-card__body">
                  <p className="collection-card__tag">{product.category}</p>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="product-card__meta">
                    <strong>{product.price}</strong>
                    <a className="text-link" href="#/producto">
                      Ver ficha
                    </a>
                  </div>
                  <div className="product-card__actions product-card__actions--shop">
                    <a className="button button--secondary" href="#/producto">
                      Ver detalles
                    </a>
                    <button type="button" className="button button--primary">
                      Añadir pronto
                    </button>
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

function ProductPage() {
  const featured = products[0]
  return (
    <>
      <PageHero
        eyebrow={featured.category}
        title={featured.title}
        text="Una ficha de producto premium para preparar la futura compra real: imágenes, descripción, detalle artesanal y una zona lista para carrito o checkout."
        image={featured.image}
        alt={featured.alt}
        actions={[
          { label: 'Solicitar información', href: '#/contacto' },
          { label: 'Volver a colección', href: '#/coleccion', kind: 'secondary' }
        ]}
      />

      <section className="section-block section-block--soft">
        <div className="container product-showcase">
          <div className="product-showcase__gallery">
            <figure className="product-showcase__main">
              <img src={featured.image} alt={featured.alt} />
            </figure>
            <figure>
              <img src={mediaConfig.visualDetailA} alt="Mesa del atelier con materiales" />
            </figure>
            <figure>
              <img src={mediaConfig.visualDetailB} alt="Detalle del bordado artesanal" />
            </figure>
          </div>

          <div className="product-showcase__info">
            <article className="contact-card contact-card--product">
              <p className="eyebrow">Detalle de producto</p>
              <h3>{featured.price}</h3>
              <p>{featured.description}</p>
              <div className="contact-list">
                <div>
                  <strong>Técnica</strong>
                  <span>Bordado floral a mano</span>
                </div>
                <div>
                  <strong>Material</strong>
                  <span>Lino, hilo y acabados suaves</span>
                </div>
                <div>
                  <strong>Formato</strong>
                  <span>Pieza artesanal de edición atelier</span>
                </div>
              </div>
              <div className="product-card__actions product-card__actions--detail">
                <button type="button" className="button button--primary">
                  Añadir al carrito pronto
                </button>
                <a className="button button--secondary" href="#/encargos">
                  Pedir variante
                </a>
              </div>
            </article>

            <article className="quote-panel quote-panel--product">
              <p className="eyebrow">Pensado para vender</p>
              <h3>La ficha ya prepara el siguiente salto</h3>
              <p>
                Aquí podremos añadir stock, colores, variantes, selección de cantidad, productos relacionados y checkout real cuando entremos en la fase de tienda completa.
              </p>
            </article>
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
        text="Un espacio pensado para transformar nombres, fechas y recuerdos en una pieza bordada creada a mano para ti."
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
                Te acompañamos desde la idea inicial hasta la entrega final, cuidando materiales, dibujo y acabado en cada encargo.
              </p>
            </div>
            <ol className="step-list step-list--premium">
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

          <article className="quote-panel">
            <p className="eyebrow">Encargo a medida</p>
            <h3>Piezas creadas para bodas, recuerdos, homenajes o regalos</h3>
            <p>
              Piezas creadas para bodas, nacimientos, homenajes o regalos con significado, siempre con un ritmo lento y cuidado.
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
        text="El diario queda preparado como una revista visual donde añadir artículos nuevos, clips y piezas audiovisuales del taller."
        image={mediaConfig.visualDetailA}
        alt="Mesa del taller con bocetos, flores y materiales"
      />

      <section className="section-block section-block--soft">
        <div className="container journal-featured">
          <article className="journal-featured__lead">
            <img src={journalEntries[0].image} alt={journalEntries[0].alt} />
            <div className="journal-featured__copy">
              <p className="journal-card__meta">{journalEntries[0].meta}</p>
              <h2>{journalEntries[0].title}</h2>
              <p>{journalEntries[0].text}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="section-block section-block--soft">
        <div className="container cinematic-panel cinematic-panel--v3">
          <div className="cinematic-panel__copy">
            <p className="eyebrow">Clip del diario</p>
            <h2>Un fragmento breve para dar vida al taller</h2>
            <p>
              Esta subpágina ya queda preparada para mostrar vídeos cortos del atelier, making of, detalles de producto o pequeñas piezas con música para reforzar el universo de marca.
            </p>
            <ul className="feature-list">
              <li>Ideal para clips verticales o horizontales cortos.</li>
              <li>Sirve para diario, campañas y pequeñas historias visuales.</li>
              <li>Se puede sustituir fácilmente por otros vídeos más adelante.</li>
            </ul>
          </div>

          <div className="cinematic-panel__media">
            <video controls playsInline preload="metadata" poster={mediaConfig.heroPoster} src={mediaConfig.journalVideo} />
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container journal-grid journal-grid--large">
          {journalEntries.map((entry) => (
            <article key={entry.slug} className="journal-card journal-card--editorial">
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
          <article className="story-card story-card--premium">
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
            Web editorial inspirada en todo lo trabajado en este chat, ahora organizada para que puedas seguir ampliándola con más producto, artículos e imágenes desde un solo archivo de contenido.
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
    const onScroll = () => setIsScrolled(window.scrollY > 18)
    const onHashChange = () => {
      const nextRoute = getRouteFromHash(window.location.hash)
      setRoute(nextRoute)
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

  useEffect(() => {
    document.title = routeTitles[route] || 'Atelier Lumière'
  }, [route])

  let page = <HomePage />
  if (route === '/coleccion') page = <CollectionPage />
  if (route === '/producto') page = <ProductPage />
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
