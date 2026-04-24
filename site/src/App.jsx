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

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID
const isFirebaseConfigured = Boolean(FIREBASE_API_KEY)
const AUTH_STORAGE_KEY = 'atelier-auth-v1'
const JOURNAL_CTA_METRICS_KEY = 'atelier-journal-cta-metrics-v1'
const JOURNAL_CTA_VARIANT_KEY = 'atelier-journal-cta-variant-v1'
const ORDERS_STORAGE_KEY = 'atelier-orders-v1'

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

const whatsappHrefForCart = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    return 'https://wa.me/34612345678'
  }

  const summary = lines
    .map((line) => `• ${line.product.title} x${line.qty} (${line.product.price})`)
    .join('\n')

  const text = `Hola, quiero finalizar mi solicitud con estas piezas:\n${summary}\n\n¿Me confirmas disponibilidad y siguientes pasos?`
  return `https://wa.me/34612345678?text=${encodeURIComponent(text)}`
}

const trackJournalCtaClick = (ctaName) => {
  try {
    const raw = window.localStorage.getItem(JOURNAL_CTA_METRICS_KEY)
    const current = raw ? JSON.parse(raw) : {}
    const next = {
      ...current,
      [ctaName]: (current?.[ctaName] ?? 0) + 1,
      lastClickedAt: new Date().toISOString()
    }
    window.localStorage.setItem(JOURNAL_CTA_METRICS_KEY, JSON.stringify(next))
  } catch {
    // Si falla, no bloqueamos la acción principal.
  }
}

const getJournalOrderCtaVariant = () => {
  try {
    const saved = window.localStorage.getItem(JOURNAL_CTA_VARIANT_KEY)
    if (saved === 'A' || saved === 'B') return saved
    const nextVariant = Math.random() > 0.5 ? 'A' : 'B'
    window.localStorage.setItem(JOURNAL_CTA_VARIANT_KEY, nextVariant)
    return nextVariant
  } catch {
    return 'A'
  }
}

const toFirestoreString = (value) => ({ stringValue: String(value ?? '') })

const fromFirestoreString = (value) => {
  if (!value) return ''
  if (typeof value.stringValue === 'string') return value.stringValue
  if (typeof value.timestampValue === 'string') return value.timestampValue
  return ''
}

const FIREBASE_ERROR_MESSAGES = {
  EMAIL_NOT_FOUND: 'No existe una cuenta con ese correo.',
  INVALID_PASSWORD: 'La contraseña no es correcta.',
  USER_DISABLED: 'La cuenta está deshabilitada.',
  EMAIL_EXISTS: 'Este correo ya está registrado.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Prueba más tarde.',
  OPERATION_NOT_ALLOWED: 'Este método de acceso no está habilitado en Firebase.',
  INVALID_ID_TOKEN: 'La sesión no es válida. Vuelve a iniciar sesión.',
  TOKEN_EXPIRED: 'La sesión ha caducado. Vuelve a iniciar sesión.',
  INVALID_REFRESH_TOKEN: 'La sesión no se puede renovar. Inicia sesión de nuevo.',
  PERMISSION_DENIED: 'No tienes permisos para esta operación.',
  UNAUTHENTICATED: 'Sesión no autenticada. Inicia sesión de nuevo.'
}

const normalizeFirebaseErrorMessage = (errorCode) => {
  if (!errorCode) return 'No se pudo completar la operación en Firebase.'
  return FIREBASE_ERROR_MESSAGES[errorCode] || `Error Firebase: ${errorCode}`
}

const isFirebaseTokenError = (errorCode) => (
  errorCode === 'UNAUTHENTICATED' ||
  errorCode === 'TOKEN_EXPIRED' ||
  errorCode === 'INVALID_ID_TOKEN' ||
  errorCode === 'INVALID_REFRESH_TOKEN'
)

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

function CollectionPage({ onAddToCart, productsList, onRefreshCatalog }) {
  const LOCAL_PRODUCTS_KEY = 'atelier-local-products-v1'
  const EDITOR_SESSION_KEY = 'atelier-editor-session-v1'
  const EDITOR_PIN_HASH_KEY = 'atelier-editor-pin-hash-v1'
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
  const [editorPinInput, setEditorPinInput] = useState('')
  const [isEditorUnlocked, setIsEditorUnlocked] = useState(false)
  const [editorAccessError, setEditorAccessError] = useState('')
  const [isEditorPinConfigured, setIsEditorPinConfigured] = useState(false)
  const [editorSetupPin, setEditorSetupPin] = useState('')
  const [editorSetupPinConfirm, setEditorSetupPinConfirm] = useState('')
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

  const handleRefreshCatalogNow = async () => {
    if (!onRefreshCatalog) return
    const refreshed = await onRefreshCatalog()
    setUploadMessage(refreshed ? 'Catálogo recargado con la versión más reciente.' : 'No se pudo recargar ahora. Inténtalo en unos segundos.')
  }

  const hashPin = async (value) => {
    const normalized = value.trim()
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const digest = await window.crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  const handleSetupEditorPin = async (event) => {
    event.preventDefault()
    if (editorSetupPin.trim().length < 6) {
      setEditorAccessError('La clave debe tener al menos 6 caracteres.')
      return
    }
    if (editorSetupPin !== editorSetupPinConfirm) {
      setEditorAccessError('La confirmación de clave no coincide.')
      return
    }

    const pinHash = await hashPin(editorSetupPin)
    window.localStorage.setItem(EDITOR_PIN_HASH_KEY, pinHash)
    setIsEditorPinConfigured(true)
    setEditorSetupPin('')
    setEditorSetupPinConfirm('')
    setEditorAccessError('')
    setUploadMessage('Clave privada configurada correctamente.')
  }

  const handleUnlockEditor = async (event) => {
    event.preventDefault()
    const storedHash = window.localStorage.getItem(EDITOR_PIN_HASH_KEY)
    if (!storedHash) {
      setEditorAccessError('Primero configura tu clave privada.')
      return
    }

    const pinHash = await hashPin(editorPinInput)
    if (pinHash !== storedHash) {
      setEditorAccessError('Clave incorrecta. Solo la propietaria puede subir artículos.')
      return
    }

    setIsEditorUnlocked(true)
    setEditorAccessError('')
    setEditorPinInput('')
    window.localStorage.setItem(EDITOR_SESSION_KEY, 'open')
  }

  const handleLockEditor = () => {
    setIsEditorUnlocked(false)
    setEditorPinInput('')
    setEditorAccessError('')
    window.localStorage.removeItem(EDITOR_SESSION_KEY)
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
    setIsEditorUnlocked(window.localStorage.getItem(EDITOR_SESSION_KEY) === 'open')
    setIsEditorPinConfigured(Boolean(window.localStorage.getItem(EDITOR_PIN_HASH_KEY)))
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
            {!isEditorUnlocked ? (
              <form className="collection-upload-form" onSubmit={handleUnlockEditor}>
                {!isEditorPinConfigured ? (
                  <>
                    <label htmlFor="editor-pin-setup">Crea tu clave privada (solo una vez)</label>
                    <input
                      id="editor-pin-setup"
                      type="password"
                      value={editorSetupPin}
                      onChange={(event) => {
                        setEditorSetupPin(event.target.value)
                        setEditorAccessError('')
                      }}
                      placeholder="Nueva clave (mínimo 6 caracteres)"
                      aria-invalid={Boolean(editorAccessError)}
                    />
                    <label htmlFor="editor-pin-confirm">Confirmar clave</label>
                    <input
                      id="editor-pin-confirm"
                      type="password"
                      value={editorSetupPinConfirm}
                      onChange={(event) => {
                        setEditorSetupPinConfirm(event.target.value)
                        setEditorAccessError('')
                      }}
                      placeholder="Repite la clave"
                      aria-invalid={Boolean(editorAccessError)}
                    />
                    <div className="collection-upload-form__actions">
                      <button type="button" className="button button--primary" onClick={handleSetupEditorPin}>
                        Guardar clave privada
                      </button>
                      <button type="button" className="button button--secondary" onClick={handleRefreshCatalogNow}>
                        Forzar actualización
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label htmlFor="editor-pin">Acceso privado para editar catálogo</label>
                    <input
                      id="editor-pin"
                      type="password"
                      value={editorPinInput}
                      onChange={(event) => {
                        setEditorPinInput(event.target.value)
                        setEditorAccessError('')
                      }}
                      placeholder="Introduce tu clave"
                      aria-invalid={Boolean(editorAccessError)}
                    />
                    <div className="collection-upload-form__actions">
                      <button type="submit" className="button button--primary">Entrar como propietaria</button>
                      <button type="button" className="button button--secondary" onClick={handleRefreshCatalogNow}>
                        Forzar actualización
                      </button>
                    </div>
                  </>
                )}
                {editorAccessError ? <p className="collection-upload-form__error">{editorAccessError}</p> : null}
                {uploadMessage ? <p className="collection-upload-form__message" role="status">{uploadMessage}</p> : null}
              </form>
            ) : (
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
                  <button type="button" className="button button--secondary" onClick={handleRefreshCatalogNow}>
                    Forzar actualización
                  </button>
                  {editingSlug ? (
                    <button type="button" className="button button--secondary" onClick={resetUploadForm}>
                      Cancelar edición
                    </button>
                  ) : null}
                  <button type="button" className="button button--secondary" onClick={handleLockEditor}>
                    Cerrar sesión de edición
                  </button>
                </div>

                {uploadMessage ? <p className="collection-upload-form__message" role="status">{uploadMessage}</p> : null}
              </form>
            )}
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
                    {product.isLocal && isEditorUnlocked ? (
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
  const checkoutWhatsappHref = whatsappHrefForCart(lines)

  return (
    <>
      <PageHero
        eyebrow="Carrito"
        title="Tu selección del atelier"
        text="Revisa tus piezas y finaliza tu solicitud por WhatsApp para confirmar disponibilidad, tiempos y entrega."
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
                      <a className="button button--primary" href={checkoutWhatsappHref} target="_blank" rel="noreferrer">
                        Finalizar por WhatsApp
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

function LoginPage({
  user,
  authReady,
  authError,
  authMessage,
  onLogin,
  onRegister,
  onLogout,
  orders,
  onUpdateOrderStatus,
  onSyncOrders,
  syncMessage,
  isSyncing
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [journalMetrics, setJournalMetrics] = useState(null)
  const [journalVariant, setJournalVariant] = useState('A')
  const [orderStatusFilter, setOrderStatusFilter] = useState('Todos')
  const [copyMessage, setCopyMessage] = useState('')

  useEffect(() => {
    try {
      const metricsRaw = window.localStorage.getItem(JOURNAL_CTA_METRICS_KEY)
      const variantRaw = window.localStorage.getItem(JOURNAL_CTA_VARIANT_KEY)
      setJournalMetrics(metricsRaw ? JSON.parse(metricsRaw) : null)
      setJournalVariant(variantRaw === 'B' ? 'B' : 'A')
    } catch {
      setJournalMetrics(null)
      setJournalVariant('A')
    }
  }, [])

  const resetJournalMetrics = () => {
    try {
      window.localStorage.removeItem(JOURNAL_CTA_METRICS_KEY)
      window.localStorage.removeItem(JOURNAL_CTA_VARIANT_KEY)
      setJournalMetrics(null)
      setJournalVariant('A')
    } catch {
      // Sin bloqueo si falla limpieza.
    }
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    await onLogin(email, password)
  }

  const handleRegister = async () => {
    await onRegister(email, password)
  }

  const visibleOrders = orderStatusFilter === 'Todos'
    ? orders
    : orders.filter((order) => order.status === orderStatusFilter)
  const customerOrders = user
    ? orders.filter((order) => order.ownerId === user.localId)
    : []

  const handleCopyReference = async (reference) => {
    if (!reference) return
    try {
      await navigator.clipboard.writeText(reference)
      setCopyMessage(`Referencia ${reference} copiada.`)
    } catch {
      setCopyMessage('No se pudo copiar en este navegador.')
    }
  }

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
          {!isFirebaseConfigured ? (
            <article className="quote-panel quote-panel--signature">
              <p className="eyebrow">Configurar Firebase</p>
              <h2>Falta conectar las credenciales de autenticación</h2>
              <p>
                Añade las variables <code>VITE_FIREBASE_*</code> en tu entorno para habilitar login real de clientes.
              </p>
              <p>
                Variables mínimas: <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>, <code>VITE_FIREBASE_PROJECT_ID</code> y <code>VITE_FIREBASE_APP_ID</code>.
              </p>
            </article>
          ) : (
            <form className="contact-form" onSubmit={handleLoginSubmit}>
              <h2>{user ? 'Sesión activa' : 'Iniciar sesión'}</h2>
              {user ? (
                <p>Conectada como {user.email}</p>
              ) : (
                <>
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Contraseña
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
                      required
                    />
                  </label>
                </>
              )}

              {authError ? <p className="collection-upload-form__error">{authError}</p> : null}
              {authMessage ? <p className="collection-upload-form__message">{authMessage}</p> : null}

              {user ? (
                <button type="button" className="button button--secondary" onClick={onLogout}>
                  Cerrar sesión
                </button>
              ) : (
                <div className="product-card__actions product-card__actions--shop">
                  <button type="submit" className="button button--primary" disabled={!authReady}>
                    Entrar
                  </button>
                  <button type="button" className="button button--secondary" onClick={handleRegister} disabled={!authReady}>
                    Crear cuenta
                  </button>
                </div>
              )}
            </form>
          )}

          <article className="quote-panel quote-panel--signature login-metrics-panel">
            <p className="eyebrow">Métricas rápidas · Diario</p>
            <h3>Panel local de conversión</h3>
            <p>Variante A/B activa para CTA principal: <strong>{journalVariant}</strong>.</p>
            <ul className="note-list">
              <li>Clicks CTA encargo: {journalMetrics?.journal_order_cta_A ?? 0} (A) / {journalMetrics?.journal_order_cta_B ?? 0} (B)</li>
              <li>Clicks CTA colección: {journalMetrics?.journal_collection_cta ?? 0}</li>
              <li>Solicitudes rápidas enviadas: {journalMetrics?.quick_order_submit ?? 0}</li>
            </ul>
            <button type="button" className="button button--secondary" onClick={resetJournalMetrics}>
              Reiniciar métricas
            </button>
          </article>

          <article className="quote-panel quote-panel--signature login-orders-panel">
            <p className="eyebrow">Fase 3 · Solicitudes</p>
            <h3>Mis solicitudes recibidas</h3>
            {!user ? <p>Inicia sesión para gestionar y actualizar el estado de pedidos.</p> : null}
            {orders.length > 0 ? (
              <label>
                Filtrar por estado
                <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Recibido">Recibido</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Listo para entregar">Listo para entregar</option>
                </select>
              </label>
            ) : null}
            {visibleOrders.length === 0 ? (
              <p>Aún no hay solicitudes guardadas desde el formulario rápido del Diario.</p>
            ) : (
              <div className="login-orders-list">
                {visibleOrders.map((order) => (
                  <article key={order.id} className="login-orders-item">
                    <strong>{order.name}</strong>
                    <span className="login-orders-item__reference">Ref: {order.reference ?? 'Sin referencia'}</span>
                    <span>{order.whatsapp}</span>
                    <p>{order.idea}</p>
                    <small>{new Date(order.createdAt).toLocaleString('es-ES')}</small>
                    {user ? (
                      <label>
                        Estado
                        <select value={order.status} onChange={(event) => onUpdateOrderStatus(order.id, event.target.value)}>
                          <option value="Recibido">Recibido</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Listo para entregar">Listo para entregar</option>
                        </select>
                      </label>
                    ) : (
                      <p>Estado: {order.status}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
            <div className="login-orders-panel__actions">
              <button type="button" className="button button--secondary" onClick={onSyncOrders} disabled={!user || isSyncing}>
                {isSyncing ? 'Sincronizando...' : 'Sincronizar con Firebase'}
              </button>
              {syncMessage ? <p>{syncMessage}</p> : null}
            </div>
          </article>

          {user ? (
            <article className="quote-panel quote-panel--signature login-customer-orders">
              <p className="eyebrow">Cliente · Mis pedidos</p>
              <h3>Seguimiento rápido de tus referencias</h3>
              {customerOrders.length === 0 ? (
                <p>Aún no hay pedidos asociados a tu cuenta.</p>
              ) : (
                <div className="login-orders-list">
                  {customerOrders.map((order) => (
                    <article key={`customer-${order.id}`} className="login-orders-item">
                      <div className="login-orders-item__header">
                        <strong>{order.reference ?? 'Sin referencia'}</strong>
                        <span className={`order-status-badge order-status-badge--${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                      <p>{order.idea}</p>
                      <small>{new Date(order.createdAt).toLocaleString('es-ES')}</small>
                      <button type="button" className="button button--secondary" onClick={() => handleCopyReference(order.reference)}>
                        Copiar referencia
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {copyMessage ? <p>{copyMessage}</p> : null}
            </article>
          ) : null}
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

function JournalPage({ onCreateOrder }) {
  const [orderCtaVariant] = useState(getJournalOrderCtaVariant)
  const [quickOrderForm, setQuickOrderForm] = useState({
    name: '',
    whatsapp: '',
    idea: ''
  })
  const [quickOrderMessage, setQuickOrderMessage] = useState('')

  const handleQuickOrderSubmit = (event) => {
    event.preventDefault()
    const name = quickOrderForm.name.trim()
    const whatsapp = quickOrderForm.whatsapp.trim()
    const idea = quickOrderForm.idea.trim()

    if (name.length < 2 || whatsapp.length < 6 || idea.length < 10) {
      setQuickOrderMessage('Completa nombre, WhatsApp y una idea breve (mínimo 10 caracteres).')
      return
    }

    trackJournalCtaClick('quick_order_submit')
    const createdOrder = onCreateOrder({
      name,
      whatsapp,
      idea,
      source: 'journal_quick_form'
    })

    const text = `Hola, soy ${name}. Mi WhatsApp es ${whatsapp}. Referencia: ${createdOrder.reference}. Idea de encargo: ${idea}`
    window.open(`https://wa.me/34612345678?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setQuickOrderMessage(`Te redirigí a WhatsApp. Referencia de seguimiento: ${createdOrder.reference}.`)
  }

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

      <section className="collection-hero collection-hero--journal">
        <div className="collection-hero__media">
          <SmartVideo
            controls={false}
            autoPlay
            loop
            muted
            poster={mediaConfig.heroPoster}
            primarySrc={mediaConfig.journalVideo}
            fallbackSrc={mediaConfig.atelierVideo}
          />
        </div>
        <div className="collection-hero__veil" />
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy">
            <p className="eyebrow">Vídeo del diario · 50 segundos</p>
            <h2>Una cápsula completa para vivir el taller en movimiento</h2>
            <p>
              Integramos el vídeo largo en formato inmersivo para mantener la misma estética potente de la colección y reforzar la sección Diario.
            </p>
            <a className="button button--primary" href="#/diario#diario-entradas">
              Ver entradas del diario
            </a>
          </div>
        </div>
      </section>

      <section className="section-block section-block--soft journal-conversion">
        <div className="container journal-conversion__grid">
          <article className="journal-conversion__card">
            <p className="eyebrow">Después del vídeo</p>
            <h3>¿Quieres una pieza inspirada en este proceso?</h3>
            <p>Cuéntame tu idea y te propongo formato, paleta y acabado en menos de 48h.</p>
            <a
              className="button button--primary"
              href="#/encargos"
              onClick={() => trackJournalCtaClick(`journal_order_cta_${orderCtaVariant}`)}
            >
              {orderCtaVariant === 'B' ? 'Quiero mi pieza' : 'Pedir encargo'}
            </a>
          </article>

          <article className="journal-conversion__card journal-conversion__card--secondary">
            <p className="eyebrow">Siguiente paso</p>
            <h3>Ver colección completa</h3>
            <p>Si prefieres empezar por una pieza ya disponible, revisa la colección y añade al carrito.</p>
            <a className="button button--secondary" href="#/coleccion" onClick={() => trackJournalCtaClick('journal_collection_cta')}>
              Ir a colección
            </a>
          </article>
        </div>

        <form className="journal-quick-form" onSubmit={handleQuickOrderSubmit}>
          <h3>Solicitud rápida de encargo</h3>
          <p>Déjame una idea y te llevo directamente a WhatsApp con el mensaje ya preparado.</p>
          <div className="journal-quick-form__grid">
            <label>
              Nombre
              <input
                type="text"
                value={quickOrderForm.name}
                onChange={(event) => setQuickOrderForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Tu nombre"
              />
            </label>
            <label>
              WhatsApp
              <input
                type="text"
                value={quickOrderForm.whatsapp}
                onChange={(event) => setQuickOrderForm((current) => ({ ...current, whatsapp: event.target.value }))}
                placeholder="+34..."
              />
            </label>
          </div>
          <label>
            Idea del encargo
            <textarea
              rows={3}
              value={quickOrderForm.idea}
              onChange={(event) => setQuickOrderForm((current) => ({ ...current, idea: event.target.value }))}
              placeholder="Ejemplo: cojín bordado para regalo con iniciales y fecha"
            />
          </label>
          <button type="submit" className="button button--primary">
            Enviar a WhatsApp
          </button>
          {quickOrderMessage ? <p className="journal-quick-form__message">{quickOrderMessage}</p> : null}
        </form>
      </section>

      <section id="diario-entradas" className="section-block">
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
  const CART_STORAGE_KEY = 'atelier-cart-v1'
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [route, setRoute] = useState(getRouteFromHash(window.location.hash))
  const [cartItems, setCartItems] = useState([])
  const [shopProducts, setShopProducts] = useState(products)
  const [catalogRefreshTick, setCatalogRefreshTick] = useState(0)
  const [orders, setOrders] = useState([])
  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(true)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

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

  const loadShopProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/shop-products.json?v=${Date.now()}`, {
        cache: 'no-store'
      })
      if (!response.ok) return false
      const payload = await response.json()
      if (Array.isArray(payload?.products) && payload.products.length > 0) {
        setShopProducts(payload.products.map(normalizeShopProduct))
        setCatalogRefreshTick((value) => value + 1)
        return true
      }
      return false
    } catch {
      // Si falla la carga remota, usamos el catálogo local por defecto.
      return false
    }
  }

  const parseFirebaseApiError = async (response) => {
    try {
      const payload = await response.json()
      return payload?.error?.message || `HTTP_${response.status}`
    } catch {
      return `HTTP_${response.status}`
    }
  }

  const handleAuthSessionExpired = () => {
    setAuthUser(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthError('Tu sesión ha caducado. Inicia sesión de nuevo para continuar.')
  }

  const refreshAuthSession = async (currentUser) => {
    if (!currentUser?.refreshToken) {
      throw new Error('INVALID_REFRESH_TOKEN')
    }

    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentUser.refreshToken
      }).toString()
    })

    if (!response.ok) {
      const message = await parseFirebaseApiError(response)
      throw new Error(message)
    }

    const payload = await response.json()
    const nextUser = {
      ...currentUser,
      idToken: payload.id_token,
      refreshToken: payload.refresh_token,
      localId: payload.user_id || currentUser.localId
    }
    setAuthUser(nextUser)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    return nextUser
  }

  const callFirebaseAuth = async (endpoint, email, password) => {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        returnSecureToken: true
      })
    })

    if (!response.ok) {
      const message = await parseFirebaseApiError(response)
      throw new Error(message)
    }

    return response.json()
  }

  const saveOrderToFirestore = async (order, currentUser) => {
    if (!FIREBASE_PROJECT_ID || !currentUser?.idToken || !currentUser?.localId) return

    await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/orders?documentId=${encodeURIComponent(order.id)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentUser.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          id: toFirestoreString(order.id),
          name: toFirestoreString(order.name),
          whatsapp: toFirestoreString(order.whatsapp),
          idea: toFirestoreString(order.idea),
          source: toFirestoreString(order.source),
          status: toFirestoreString(order.status),
          createdAt: toFirestoreString(order.createdAt),
          reference: toFirestoreString(order.reference),
          ownerId: toFirestoreString(currentUser.localId)
        }
      })
    }).then(async (response) => {
      if (!response.ok) {
        const message = await parseFirebaseApiError(response)
        throw new Error(message)
      }
    })
  }

  const patchOrderStatusToFirestore = async (order, currentUser) => {
    if (!FIREBASE_PROJECT_ID || !currentUser?.idToken) return
    await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${encodeURIComponent(order.id)}?updateMask.fieldPaths=status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${currentUser.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          status: toFirestoreString(order.status)
        }
      })
    }).then(async (response) => {
      if (!response.ok) {
        const message = await parseFirebaseApiError(response)
        throw new Error(message)
      }
    })
  }

  const fetchOrdersFromFirestore = async (currentUser) => {
    if (!FIREBASE_PROJECT_ID || !currentUser?.idToken || !currentUser?.localId) return []
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentUser.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'orders' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'ownerId' },
              op: 'EQUAL',
              value: toFirestoreString(currentUser.localId)
            }
          },
          orderBy: [
            {
              field: { fieldPath: 'createdAt' },
              direction: 'DESCENDING'
            }
          ],
          limit: 100
        }
      })
    })
    if (!response.ok) {
      const message = await parseFirebaseApiError(response)
      throw new Error(message)
    }
    const payload = await response.json()
    const docs = Array.isArray(payload)
      ? payload.map((entry) => entry.document).filter(Boolean)
      : []

    return docs
      .map((doc) => ({
        id: fromFirestoreString(doc.fields?.id) || doc.name?.split('/').pop(),
        name: fromFirestoreString(doc.fields?.name),
        whatsapp: fromFirestoreString(doc.fields?.whatsapp),
        idea: fromFirestoreString(doc.fields?.idea),
        source: fromFirestoreString(doc.fields?.source) || 'firebase_sync',
        status: fromFirestoreString(doc.fields?.status) || 'Recibido',
        createdAt: fromFirestoreString(doc.fields?.createdAt) || new Date().toISOString(),
        reference: fromFirestoreString(doc.fields?.reference),
        ownerId: fromFirestoreString(doc.fields?.ownerId)
      }))
      .filter((item) => item.ownerId === currentUser.localId)
  }

  const handleLogin = async (email, password) => {
    if (!isFirebaseConfigured) return
    setAuthError('')
    setAuthMessage('')
    setAuthReady(false)
    try {
      const payload = await callFirebaseAuth('accounts:signInWithPassword', email, password)
      const nextUser = {
        email: payload.email,
        idToken: payload.idToken,
        localId: payload.localId,
        refreshToken: payload.refreshToken
      }
      setAuthUser(nextUser)
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
      setAuthMessage('Sesión iniciada correctamente.')
    } catch (error) {
      setAuthError(normalizeFirebaseErrorMessage(error?.message))
    } finally {
      setAuthReady(true)
    }
  }

  const handleRegister = async (email, password) => {
    if (!isFirebaseConfigured) return
    setAuthError('')
    setAuthMessage('')
    setAuthReady(false)
    try {
      const payload = await callFirebaseAuth('accounts:signUp', email, password)
      const nextUser = {
        email: payload.email,
        idToken: payload.idToken,
        localId: payload.localId,
        refreshToken: payload.refreshToken
      }
      setAuthUser(nextUser)
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
      setAuthMessage('Cuenta creada correctamente.')
    } catch (error) {
      setAuthError(normalizeFirebaseErrorMessage(error?.message))
    } finally {
      setAuthReady(true)
    }
  }

  const handleLogout = async () => {
    setAuthError('')
    setAuthMessage('')
    setAuthUser(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthMessage('Sesión cerrada.')
  }

  const handleCreateOrder = (orderDraft) => {
    const reference = `AL-${Math.floor(1000 + Math.random() * 9000)}`
    const nextOrder = {
      id: `order-${Date.now()}`,
      reference,
      status: 'Recibido',
      createdAt: new Date().toISOString(),
      ownerId: authUser?.localId ?? 'guest',
      ...orderDraft
    }
    setOrders((items) => [nextOrder, ...items])
    if (authUser) {
      saveOrderToFirestore(nextOrder, authUser).catch((error) => {
        if (isFirebaseTokenError(error?.message)) {
          handleAuthSessionExpired()
        }
      })
    }
    return nextOrder
  }

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    setOrders((items) => {
      const updated = items.map((order) => (
        order.id === orderId ? { ...order, status: nextStatus } : order
      ))
      if (authUser) {
        const changed = updated.find((order) => order.id === orderId)
        if (changed) {
          patchOrderStatusToFirestore(changed, authUser).catch((error) => {
            if (isFirebaseTokenError(error?.message)) {
              handleAuthSessionExpired()
            }
          })
        }
      }
      return updated
    })
  }

  const handleSyncOrders = async () => {
    if (!authUser) {
      setSyncMessage('Inicia sesión para sincronizar pedidos.')
      return
    }
    if (!FIREBASE_PROJECT_ID) {
      setSyncMessage('Falta VITE_FIREBASE_PROJECT_ID para sincronizar con Firestore.')
      return
    }
    setIsSyncing(true)
    setSyncMessage('')

    const runSync = async (activeUser) => {
      for (const order of orders) {
        await saveOrderToFirestore(order, activeUser)
      }
      const remoteOrders = await fetchOrdersFromFirestore(activeUser)
      const localMap = new Map(orders.map((order) => [order.id, order]))
      for (const remoteOrder of remoteOrders) {
        localMap.set(remoteOrder.id, remoteOrder)
      }
      setOrders(Array.from(localMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    }

    try {
      await runSync(authUser)
      setSyncMessage('Pedidos sincronizados con Firebase correctamente.')
    } catch (error) {
      if (isFirebaseTokenError(error?.message)) {
        try {
          const refreshedUser = await refreshAuthSession(authUser)
          await runSync(refreshedUser)
          setSyncMessage('Sesión renovada y sincronización completada correctamente.')
        } catch (refreshError) {
          setSyncMessage(normalizeFirebaseErrorMessage(refreshError?.message))
          handleAuthSessionExpired()
        }
      } else {
        setSyncMessage(normalizeFirebaseErrorMessage(error?.message))
      }
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) return
      const normalized = parsed
        .filter((line) => line && typeof line.slug === 'string' && Number.isFinite(line.qty))
        .map((line) => ({ slug: line.slug, qty: Math.max(1, Math.floor(line.qty)) }))
      if (normalized.length > 0) {
        setCartItems(normalized)
      }
    } catch {
      // Si falla lectura, usamos carrito en memoria.
    }
  }, [])

  useEffect(() => {
    try {
      const savedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY)
      if (!savedOrders) return
      const parsed = JSON.parse(savedOrders)
      if (!Array.isArray(parsed)) return
      setOrders(parsed)
    } catch {
      // Si falla lectura, seguimos sin pedidos persistidos.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch {
      // Si falla guardado, el carrito sigue funcionando en memoria.
    }
  }, [cartItems])

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    } catch {
      // Si falla guardado, pedidos siguen en memoria.
    }
  }, [orders])

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
    if (!isFirebaseConfigured) return
    try {
      const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (!savedAuth) return
      const parsed = JSON.parse(savedAuth)
      if (!parsed?.email || !parsed?.idToken) return
      setAuthUser(parsed)
    } catch {
      // Si falla, no restauramos sesión.
    }
  }, [])

  useEffect(() => {
    loadShopProducts()
  }, [])

  useEffect(() => {
    document.title = routeTitles[route] || 'Atelier Lumière'
  }, [route])

  let page = <HomePage productsList={shopProducts} />
  if (route === '/coleccion') page = <CollectionPage onAddToCart={handleAddToCart} productsList={shopProducts} onRefreshCatalog={loadShopProducts} />
  if (route === '/producto') page = <ProductPage onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/carrito') page = <CartPage cartItems={cartItems} onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/acceder') {
    page = (
      <LoginPage
        user={authUser}
        authReady={authReady}
        authError={authError}
        authMessage={authMessage}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onSyncOrders={handleSyncOrders}
        syncMessage={syncMessage}
        isSyncing={isSyncing}
      />
    )
  }
  if (route === '/encargos') page = <OrdersPage />
  if (route === '/diario') page = <JournalPage onCreateOrder={handleCreateOrder} />
  if (route === '/sobre-mi') page = <AboutPage />
  if (route === '/contacto') page = <ContactPage />

  return (
    <div className={`page-shell ${getRouteClass(route)}`}>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <Header isScrolled={isScrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} route={route} cartCount={cartCount} />
      <main id="main-content" data-catalog-refresh={catalogRefreshTick}>{page}</main>
      <Footer />
    </div>
  )
}
