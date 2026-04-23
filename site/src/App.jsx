import { useEffect, useState } from 'react'
import {
  aboutNotes,
  contactDetails,
  heroHighlights,
  journalEntries,
  mediaConfig,
  navItems,
  processSteps,
  products
} from './content'

const routeTitles = {
  '/': 'Atelier Lumière',
  '/coleccion': 'Colección · Atelier Lumière',
  '/producto': 'Producto · Atelier Lumière',
  '/carrito': 'Carrito · Atelier Lumière',
  '/acceder': 'Acceder · Atelier Lumière',
  '/encargos': 'Encargos · Atelier Lumière',
  '/diario': 'Diario del taller · Atelier Lumière',
  '/sobre-mi': 'Sobre mí · Atelier Lumière',
  '/contacto': 'Contacto · Atelier Lumière'
}

const getRouteFromHash = (hash) => {
  const value = hash.replace(/^#/, '') || '/'
  return value.startsWith('/') ? value : `/${value}`
}

const getRouteClass = (route) => {
  if (route === '/') return 'route-home'
  return `route-${route.replace(/^\//, '').replace(/\//g, '-')}`
}

const whatsappHrefForProduct = (product) => {
  const text = `Hola, me interesa ${product.title} (${product.price}). ¿Me das más información?`
  return `https://wa.me/34612345678?text=${encodeURIComponent(text)}`
}

const getShopCategories = (productList) => [
  'Todos',
  ...Array.from(new Set(productList.map((product) => product.category).filter(Boolean)))
]

const normalizeAssetPath = (value) => {
  if (typeof value !== 'string' || value.length === 0) return value
  if (/^(https?:)?\/\//.test(value)) return value
  if (value.startsWith('/')) return `${import.meta.env.BASE_URL}${value.replace(/^\//, '')}`
  if (value.startsWith('./')) return `${import.meta.env.BASE_URL}${value.replace(/^\.\//, '')}`
  return value
}

const normalizeShopProduct = (product) => ({
  ...product,
  image: normalizeAssetPath(product.image)
})


function Header({ isScrolled, menuOpen, setMenuOpen, route, cartCount }) {
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
          <a className="cart-pill" href="#/carrito" onClick={() => setMenuOpen(false)}>
            Cesta {cartCount}
          </a>
          <a className="cart-pill cart-pill--ghost" href="#/acceder" onClick={() => setMenuOpen(false)}>
            Acceder
          </a>
        </div>
      </div>
    </header>
  )
}

function SectionIntro({ eyebrow, title, text, split = false }) {
  return (
    <div className={`section-heading ${split ? 'section-heading--split' : ''}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {text ? <p>{text}</p> : null}
    </div>
  )
}

function PageSection({ id, className = '', children }) {
  return (
    <section id={id} className={`section-block ${className}`.trim()}>
      {children}
    </section>
  )
}

function SmartVideo({ primarySrc, fallbackSrc, poster, className = '', controls = true, autoPlay = false, loop = false, muted = false }) {
  return (
    <video
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload="metadata"
      poster={poster}
    >
      <source src={primarySrc} type="video/mp4" />
      {fallbackSrc ? <source src={fallbackSrc} type="video/mp4" /> : null}
      Tu navegador no puede reproducir este vídeo.
    </video>
  )
}

function HomePage({ productsList }) {
  const collectionPreview = productsList.slice(0, 4)

  return (
    <>
      <section id="inicio" className="hero-v4 hero-v4--clean">
        <div className="hero-v4__media-wrap">
          <figure className="hero-v4__media">
            {mediaConfig.heroVideoEnabled ? (
              <SmartVideo autoPlay loop muted controls={false} poster={mediaConfig.heroPoster} primarySrc={mediaConfig.collectionVideoSrc} fallbackSrc={mediaConfig.atelierVideo} />
            ) : (
              <img src={mediaConfig.heroPoster} alt="Artesana bordando junto a una ventana luminosa" />
            )}
          </figure>
        </div>
        <div className="hero-v4__veil" />
        <div className="container hero-v4__grid">
          <div className="hero-v4__copy hero-v4__copy--open">
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

            <div className="home-map" aria-label="Accesos rápidos de portada">
              <a href="#home-collection">Colección</a>
              <a href="#home-orders">Encargos</a>
              <a href="#home-journal">Diario</a>
            </div>

            <p className="hero-v4__closing">Hecho a mano, creado despacio.</p>
          </div>
        </div>
      </section>

      <PageSection id="home-collection" className="section-block--tinted">
        <div className="container">
          <SectionIntro
            eyebrow="Colección destacada"
            title="Piezas creadas con calma, para durar"
            text="Una selección pensada para descubrir el universo del atelier a través de bordados, texturas suaves y detalles hechos a mano."
          />

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
      </PageSection>

      <PageSection id="home-orders">
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
      </PageSection>

      <PageSection id="home-journal" className="section-block--soft">
        <div className="container">
          <SectionIntro
            split
            eyebrow="Diario del taller"
            title="Historias del taller, entre luz y materia"
            text="Un espacio para compartir procesos, inspiración y escenas cotidianas del oficio artesanal."
          />

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
      </PageSection>
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

function CollectionPage({ onAddToCart, productsList }) {
  const LOCAL_PRODUCTS_KEY = 'atelier-local-products-v1'
  const [localProducts, setLocalProducts] = useState([])
  const [uploadForm, setUploadForm] = useState({
    title: '',
    price: '',
    category: '',
    description: '',
    file: null
  })
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadErrors, setUploadErrors] = useState({})
  const [fileInputKey, setFileInputKey] = useState(0)
  const [editingSlug, setEditingSlug] = useState(null)
  const allProducts = [...localProducts, ...productsList]
  const categories = getShopCategories(allProducts)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const filteredProducts = activeCategory === 'Todos'
    ? allProducts
    : allProducts.filter((product) => product.category === activeCategory)
  const sortedProducts = [...filteredProducts].sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
  const featuredProducts = [...allProducts].sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999)).slice(0, 3)
  const categoryCounts = allProducts.reduce((acc, product) => {
    if (!product.category) return acc
    acc[product.category] = (acc[product.category] ?? 0) + 1
    return acc
  }, {})

  const scrollToPieces = () => {
    document.getElementById('piezas-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToUploader = () => {
    document.getElementById('cargar-articulo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })

  const validateUploadForm = (formData) => {
    const errors = {}

    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Escribe un título de al menos 3 caracteres.'
    }

    if (!formData.price || !/^\d+(?:[.,]\d{1,2})?\s?€?$/.test(formData.price.trim())) {
      errors.price = 'Usa un precio válido. Ejemplo: 120 o 120 €.'
    }

    if (!formData.category || formData.category.trim().length < 2) {
      errors.category = 'Indica una categoría válida.'
    }

    if (formData.description && formData.description.length > 240) {
      errors.description = 'La descripción no puede superar 240 caracteres.'
    }

    const needsFile = !editingSlug
    if (needsFile && !formData.file) {
      errors.file = 'Selecciona una imagen o un vídeo.'
    }

    if (formData.file) {
      if (!formData.file.type.startsWith('image/') && !formData.file.type.startsWith('video/')) {
        errors.file = 'Solo se permiten imágenes o vídeos.'
      }

      if (formData.file.size > 15 * 1024 * 1024) {
        errors.file = 'El archivo no puede superar 15 MB.'
      }
    }

    return errors
  }

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      price: '',
      category: '',
      description: '',
      file: null
    })
    setFileInputKey((value) => value + 1)
    setEditingSlug(null)
    setUploadErrors({})
  }

  const handleUploadFieldChange = (event) => {
    const { name, value, files } = event.target

    if (name === 'file') {
      setUploadForm((current) => ({ ...current, file: files?.[0] ?? null }))
      setUploadErrors((current) => ({ ...current, file: undefined }))
      return
    }

    setUploadForm((current) => ({ ...current, [name]: value }))
    setUploadErrors((current) => ({ ...current, [name]: undefined }))
  }

  const startEditLocalProduct = (product) => {
    setEditingSlug(product.slug)
    setUploadForm({
      title: product.title,
      price: product.price,
      category: product.category,
      description: product.description ?? '',
      file: null
    })
    setUploadErrors({})
    setUploadMessage(`Editando “${product.title}”. Puedes cambiar texto y opcionalmente el archivo.`)
    scrollToUploader()
  }

  const handleDeleteLocalProduct = (product) => {
    setLocalProducts((items) => items.filter((item) => item.slug !== product.slug))
    if (editingSlug === product.slug) resetUploadForm()
    setUploadMessage(`“${product.title}” eliminado del catálogo local.`)
  }

  const handleUploadSubmit = async (event) => {
    event.preventDefault()
    const errors = validateUploadForm(uploadForm)

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors)
      setUploadMessage('Revisa los campos marcados para continuar.')
      return
    }

    try {
      let mediaType = 'image'
      let mediaSrc = ''

      if (uploadForm.file) {
        mediaType = uploadForm.file.type.startsWith('video/') ? 'video' : 'image'
        mediaSrc = await fileToDataUrl(uploadForm.file)
      }

      if (editingSlug) {
        setLocalProducts((items) => items.map((item) => {
          if (item.slug !== editingSlug) return item
          const nextMediaType = mediaSrc ? mediaType : item.mediaType
          const nextMediaSrc = mediaSrc || item.mediaSrc

          return {
            ...item,
            title: uploadForm.title.trim(),
            price: uploadForm.price.trim(),
            category: uploadForm.category.trim(),
            description: uploadForm.description.trim() || 'Pieza subida desde tu ordenador.',
            tag: uploadForm.category.trim(),
            mediaType: nextMediaType,
            mediaSrc: nextMediaSrc,
            image: nextMediaType === 'video' ? mediaConfig.heroPoster : nextMediaSrc,
            localVideo: nextMediaType === 'video' ? nextMediaSrc : null
          }
        }))

        setUploadMessage(`Cambios guardados para “${uploadForm.title.trim()}”.`)
        resetUploadForm()
        return
      }

      const slug = `${uploadForm.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${Date.now()}`

      setLocalProducts((items) => [
        {
          slug,
          title: uploadForm.title.trim(),
          price: uploadForm.price.trim(),
          category: uploadForm.category.trim(),
          description: uploadForm.description.trim() || 'Pieza subida desde tu ordenador.',
          image: mediaType === 'video' ? mediaConfig.heroPoster : mediaSrc,
          alt: uploadForm.title.trim(),
          tag: uploadForm.category.trim(),
          badge: 'Nuevo',
          localVideo: mediaType === 'video' ? mediaSrc : null,
          mediaType,
          mediaSrc,
          isLocal: true,
          createdAt: new Date().toISOString(),
          featuredRank: 0
        },
        ...items
      ])

      setUploadMessage(`“${uploadForm.title.trim()}” añadido correctamente desde tu PC.`)
      resetUploadForm()
    } catch {
      setUploadMessage('No se pudo procesar el archivo. Prueba con otro recurso.')
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      setLocalProducts(parsed)
    } catch {
      // Si falla la lectura, mantenemos el catálogo en memoria.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(localProducts))
    } catch {
      // Si falla el guardado, la sesión seguirá funcionando en memoria.
    }
  }, [localProducts])

  return (
    <>
      <section className="collection-hero collection-hero--immersive">
        <div className="collection-hero__media">
          <SmartVideo
            controls={false}
            autoPlay
            loop
            muted
            poster={mediaConfig.heroPoster}
            primarySrc={mediaConfig.collectionVideoSrc}
            fallbackSrc={mediaConfig.atelierVideo}
          />
        </div>
        <div className="collection-hero__veil" />
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy">
            <p className="eyebrow">Colección</p>
            <h1>Piezas bordadas con alma artesanal</h1>
            <p>Una entrada visual limpia para recorrer la colección desde su esencia.</p>
            <button type="button" className="button button--primary" onClick={scrollToPieces}>
              Ver piezas disponibles
            </button>
          </div>
        </div>
      </section>

      <PageSection id="piezas-disponibles">
        <div className="container">
          <article className="collection-intro-panel">
            <div>
              <p className="eyebrow">Selección curada</p>
              <h2>Piezas listas para comprar o personalizar</h2>
              <p>
                Filtra por categoría y recorre cada ficha con una vista más limpia de materiales, acabados y disponibilidad.
              </p>
            </div>
            <div className="collection-intro-panel__stats">
              <div>
                <strong>{allProducts.length}</strong>
                <span>Piezas publicadas</span>
              </div>
              <div>
                <strong>{categories.length - 1}</strong>
                <span>Categorías activas</span>
              </div>
              <div>
                <strong>48h</strong>
                <span>Respuesta estimada</span>
              </div>
            </div>
          </article>

          <article id="cargar-articulo" className="collection-upload-panel">
            <div>
              <p className="eyebrow">Cargar desde PC</p>
              <h3>{editingSlug ? 'Edita tu artículo local' : 'Sube un artículo nuevo en segundos'}</h3>
              <p>
                Tus artículos locales se guardan en este navegador para que no se pierdan al recargar. Cuando quieras publicarlos,
                pásalos al archivo
                <code> public/data/shop-products.json </code>
                y guarda recursos finales en
                <code> public/uploads </code>.
              </p>
            </div>
            <form className="collection-upload-form" onSubmit={handleUploadSubmit} noValidate>
              <label htmlFor="upload-title">Título</label>
              <input
                id="upload-title"
                type="text"
                name="title"
                value={uploadForm.title}
                onChange={handleUploadFieldChange}
                placeholder="Título del artículo"
                aria-invalid={Boolean(uploadErrors.title)}
              />
              {uploadErrors.title ? <p className="collection-upload-form__error">{uploadErrors.title}</p> : null}

              <label htmlFor="upload-price">Precio</label>
              <input
                id="upload-price"
                type="text"
                name="price"
                value={uploadForm.price}
                onChange={handleUploadFieldChange}
                placeholder="Ej. 120 €"
                aria-invalid={Boolean(uploadErrors.price)}
              />
              {uploadErrors.price ? <p className="collection-upload-form__error">{uploadErrors.price}</p> : null}

              <label htmlFor="upload-category">Categoría</label>
              <input
                id="upload-category"
                type="text"
                name="category"
                value={uploadForm.category}
                onChange={handleUploadFieldChange}
                placeholder="Ej. Bolsos"
                aria-invalid={Boolean(uploadErrors.category)}
              />
              {uploadErrors.category ? <p className="collection-upload-form__error">{uploadErrors.category}</p> : null}

              <label htmlFor="upload-description">Descripción</label>
              <textarea
                id="upload-description"
                name="description"
                value={uploadForm.description}
                onChange={handleUploadFieldChange}
                placeholder="Descripción corta de la pieza"
                rows={3}
                aria-invalid={Boolean(uploadErrors.description)}
              />
              {uploadErrors.description ? <p className="collection-upload-form__error">{uploadErrors.description}</p> : null}

              <label htmlFor="upload-file">Archivo (imagen o vídeo)</label>
              <input
                key={fileInputKey}
                id="upload-file"
                type="file"
                name="file"
                onChange={handleUploadFieldChange}
                accept="image/*,video/*"
                aria-invalid={Boolean(uploadErrors.file)}
              />
              {uploadErrors.file ? <p className="collection-upload-form__error">{uploadErrors.file}</p> : null}

              <div className="collection-upload-form__actions">
                <button type="submit" className="button button--primary">
                  {editingSlug ? 'Guardar cambios' : 'Añadir desde mi PC'}
                </button>
                {editingSlug ? (
                  <button type="button" className="button button--secondary" onClick={resetUploadForm}>
                    Cancelar edición
                  </button>
                ) : null}
              </div>

              {uploadMessage ? <p className="collection-upload-form__message" role="status">{uploadMessage}</p> : null}
            </form>
          </article>

          <div className="collection-featured-strip">
            {featuredProducts.map((product) => (
              <article key={`${product.slug}-featured`} className="collection-featured-item">
                {product.localVideo ? (
                  <SmartVideo className="collection-featured-item__video" primarySrc={product.localVideo} controls />
                ) : (
                  <img src={product.image} alt={product.alt} loading="lazy" />
                )}
                <div>
                  <p className="collection-card__tag">{product.tag ?? product.category}</p>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="pill-list pill-list--shop">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`editorial-pill editorial-pill--category ${activeCategory === category ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
              >
                {category}
                <span className="editorial-pill__count">
                  {category === 'Todos' ? allProducts.length : (categoryCounts[category] ?? 0)}
                </span>
              </button>
            ))}
          </div>

          <div className="shop-toolbar">
            <p>
              {activeCategory === 'Todos'
                ? `Explora ${filteredProducts.length} piezas bordadas, accesorios y encargos personalizados.`
                : `${filteredProducts.length} pieza(s) en ${activeCategory}.`}
              {' '}Ordenadas por destacadas para que veas primero los ejemplos más nuevos.
            </p>
            {activeCategory !== 'Todos' ? (
              <div className="shop-toolbar__actions">
                <button
                  type="button"
                  className="editorial-pill"
                  onClick={() => {
                    setActiveCategory('Todos')
                  }}
                >
                  Limpiar
                </button>
              </div>
            ) : null}
          </div>

          <div className="product-grid product-grid--shop">
            {sortedProducts.length > 0 ? sortedProducts.map((product) => (
              <article key={product.slug} className="product-card product-card--shop">
                {product.localVideo ? (
                  <SmartVideo className="product-card__video" primarySrc={product.localVideo} controls />
                ) : (
                  <img src={product.image} alt={product.alt} />
                )}
                <div className="product-card__body">
                  <div className="product-card__labels">
                    <p className="collection-card__tag">{product.category}</p>
                    <span className="product-badge">{product.badge ?? 'Atelier'}</span>
                  </div>
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
                    <button type="button" className="button button--primary" onClick={() => onAddToCart(product)}>
                      Añadir al carrito
                    </button>
                    <a className="button button--dark button--whatsapp" href={whatsappHrefForProduct(product)} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                    {product.isLocal ? (
                      <>
                        <button type="button" className="button button--secondary" onClick={() => startEditLocalProduct(product)}>
                          Editar local
                        </button>
                        <button type="button" className="button button--secondary" onClick={() => handleDeleteLocalProduct(product)}>
                          Eliminar local
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            )) : (
              <article className="quote-panel quote-panel--signature">
                <p className="eyebrow">Sin resultados</p>
                <h3>No hay piezas en esta categoría por ahora</h3>
                <p>Prueba otra selección o vuelve a “Todos” para ver la colección completa.</p>
                <a className="button button--secondary" href="#/encargos">
                  Solicitar pieza a medida
                </a>
              </article>
            )}
          </div>

          <article className="collection-service-cta">
            <div>
              <p className="eyebrow">Asesoría del atelier</p>
              <h3>¿Dudas entre varias piezas?</h3>
              <p>
                Te ayudo a elegir formato, paleta y acabado según el espacio, regalo o tipo de uso que tengas en mente.
              </p>
            </div>
            <div className="collection-service-cta__actions">
              <a className="button button--primary" href="#/contacto">Pedir recomendación</a>
              <a className="button button--secondary" href="#/encargos">Encargo personalizado</a>
            </div>
          </article>
        </div>
      </PageSection>
    </>
  )
}

function ProductPage({ onAddToCart, productsList }) {
  const featured = productsList[0]

  if (!featured) {
    return (
      <PageSection className="section-block--soft">
        <div className="container">
          <article className="quote-panel quote-panel--signature">
            <p className="eyebrow">Sin productos</p>
            <h3>Aún no hay productos configurados</h3>
            <p>
              Sube productos editando <code>public/data/shop-products.json</code> y sus imágenes/vídeos en <code>public/uploads</code>.
            </p>
          </article>
        </div>
      </PageSection>
    )
  }

  return (
    <>
      <PageHero
        eyebrow={featured.category}
        title={featured.title}
        text="Una pieza pensada para apreciarse en detalle: materiales nobles, bordado a mano y acabados que transmiten calma y presencia."
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
                <button type="button" className="button button--primary" onClick={() => onAddToCart(featured)}>
                  Añadir al carrito
                </button>
                <a className="button button--secondary" href="#/encargos">
                  Pedir variante
                </a>
              </div>
            </article>

            <article className="quote-panel quote-panel--product">
              <p className="eyebrow">Detalle artesanal</p>
              <h3>Una ficha clara para elegir con calma</h3>
              <p>
                Cada descripción está enfocada en mostrar textura, técnica y carácter para facilitar una elección cuidada y personal.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}

function CartPage({ cartItems, onAddToCart, productsList }) {
  const lines = cartItems
    .map((line) => {
      const product = productsList.find((item) => item.slug === line.slug)
      return product ? { ...line, product } : null
    })
    .filter(Boolean)

  return (
    <>
      <PageHero
        eyebrow="Carrito"
        title="Tu selección del atelier"
        text="Revisa tus piezas y continúa con tu solicitud. Este flujo quedará preparado para checkout en la siguiente fase."
        image={mediaConfig.visualLead}
        alt="Mesa del atelier con piezas seleccionadas"
      />

      <PageSection className="section-block--soft">
        <div className="container">
          {lines.length === 0 ? (
            <article className="quote-panel quote-panel--signature">
              <p className="eyebrow">Carrito vacío</p>
              <h3>Aún no has añadido ninguna pieza</h3>
              <p>Explora la colección y guarda tus favoritas para continuar después.</p>
              <a className="button button--primary" href="#/coleccion">
                Ir a colección
              </a>
            </article>
          ) : (
            <div className="product-grid product-grid--shop">
              {lines.map((line) => (
                <article key={line.slug} className="product-card product-card--shop">
                  <img src={line.product.image} alt={line.product.alt} />
                  <div className="product-card__body">
                    <p className="collection-card__tag">{line.product.category}</p>
                    <h3>{line.product.title}</h3>
                    <p>{line.product.description}</p>
                    <div className="product-card__meta">
                      <strong>{line.product.price}</strong>
                      <span>Cantidad: {line.qty}</span>
                    </div>
                    <div className="product-card__actions product-card__actions--shop">
                      <button type="button" className="button button--secondary" onClick={() => onAddToCart(line.product)}>
                        Añadir otra
                      </button>
                      <a className="button button--primary" href="#/contacto">
                        Finalizar solicitud
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </PageSection>
    </>
  )
}

function LoginPage() {
  return (
    <>
      <PageHero
        eyebrow="Acceder"
        title="Tu cuenta Atelier Lumière"
        text="Accede para guardar favoritos, seguir tus encargos y centralizar tu historial de piezas."
        image={mediaConfig.portrait}
        alt="Retrato de la creadora junto a la ventana"
      />
      <PageSection className="section-block--soft">
        <div className="container split-panels split-panels--single">
          <form className="contact-form">
            <h2>Iniciar sesión</h2>
            <label>
              Correo electrónico
              <input type="email" placeholder="tu@email.com" />
            </label>
            <label>
              Contraseña
              <input type="password" placeholder="••••••••" />
            </label>
            <button type="button" className="button button--primary">
              Acceder
            </button>
          </form>
        </div>
      </PageSection>
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
        text="Un cuaderno visual para compartir inspiración, procesos y pequeños instantes del taller."
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
            <p className="eyebrow">Podcast del diario</p>
            <h2>Un formato mini podcast para contar historias reales</h2>
            <p>
              Cápsulas de menos de un minuto para contar procesos, datos y pequeñas anécdotas del atelier con imagen y voz.
            </p>
            <ul className="feature-list">
              <li>Formato ágil para contenido tipo podcast visual.</li>
              <li>Incluye historia breve, dato útil y detalle del proceso.</li>
              <li>Perfecto para dar más vida a la sección Diario.</li>
            </ul>
          </div>

          <div className="cinematic-panel__media">
            <SmartVideo poster={mediaConfig.heroPoster} primarySrc={mediaConfig.journalVideo} fallbackSrc={mediaConfig.atelierVideo} />
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
                  Escuchar cápsula
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
        text="La historia personal detrás del atelier: inspiración cotidiana, oficio manual y una búsqueda constante de belleza serena."
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
                Un recorrido por la sensibilidad que da forma a cada colección, entre materia noble, ritmo lento y detalle humano.
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
        text="Escríbenos para resolver dudas, solicitar un encargo o compartir la idea de una pieza bordada a medida."
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
  const [cartItems, setCartItems] = useState([])
  const [shopProducts, setShopProducts] = useState(products)

  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0)

  const handleAddToCart = (product) => {
    setCartItems((items) => {
      const existing = items.find((item) => item.slug === product.slug)
      if (existing) {
        return items.map((item) => (item.slug === product.slug ? { ...item, qty: item.qty + 1 } : item))
      }
      return [...items, { slug: product.slug, qty: 1 }]
    })
  }

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
    const loadShopProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/shop-products.json`)
        if (!response.ok) return
        const payload = await response.json()
        if (Array.isArray(payload?.products) && payload.products.length > 0) {
          setShopProducts(payload.products.map(normalizeShopProduct))
        }
      } catch {
        // Si falla la carga remota, usamos el catálogo local por defecto.
      }
    }

    loadShopProducts()
  }, [])

  useEffect(() => {
    document.title = routeTitles[route] || 'Atelier Lumière'
  }, [route])

  let page = <HomePage productsList={shopProducts} />
  if (route === '/coleccion') page = <CollectionPage onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/producto') page = <ProductPage onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/carrito') page = <CartPage cartItems={cartItems} onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/acceder') page = <LoginPage />
  if (route === '/encargos') page = <OrdersPage />
  if (route === '/diario') page = <JournalPage />
  if (route === '/sobre-mi') page = <AboutPage />
  if (route === '/contacto') page = <ContactPage />

  return (
    <div className={`page-shell ${getRouteClass(route)}`}>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <Header isScrolled={isScrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} route={route} cartCount={cartCount} />
      <main id="main-content">{page}</main>
      <Footer />
    </div>
  )
}
