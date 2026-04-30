import { useEffect, useState } from 'react'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes
} from 'firebase/storage'
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
import { firebaseAuth, firebaseDb, firebaseStorage, isFirebaseConfigured } from './firebase'

const JOURNAL_CTA_METRICS_KEY = 'atelier-journal-cta-metrics-v1'
const JOURNAL_CTA_VARIANT_KEY = 'atelier-journal-cta-variant-v1'
const ORDERS_STORAGE_KEY = 'atelier-orders-v1'
const ORDERS_SYNC_QUEUE_KEY = 'atelier-orders-sync-queue-v1'
const PAYMENT_SETTINGS_STORAGE_KEY = 'atelier-payment-settings-v1'
const CATALOG_OVERRIDES_STORAGE_KEY = 'atelier-catalog-overrides-v1'
const CUSTOM_PRODUCTS_STORAGE_KEY = 'atelier-custom-products-v1'
const CATALOG_DELETED_STORAGE_KEY = 'atelier-deleted-products-v1'
const CART_STORAGE_KEY = 'atelier-cart-v1'
const CATALOG_API_STATUS_PATH = '__catalog/status'
const CATALOG_API_PRODUCT_PATH = '__catalog/product'
const PRODUCT_AVAILABILITY_OPTIONS = ['Disponible', 'Reservado', 'Vendido', 'Por encargo']
const PRODUCT_AVAILABLE_FOR_CART = new Set(['Disponible', 'Por encargo'])
const PRODUCT_AVAILABILITY_FILTERS = ['Todas', ...PRODUCT_AVAILABILITY_OPTIONS]
const ORDER_STATUS_OPTIONS = [
  'Recibido',
  'Presupuesto enviado',
  'Aprobado',
  'En producción',
  'Listo para entregar',
  'Enviado',
  'Entregado',
  'Cerrado'
]
const OPEN_ORDER_STATUSES = new Set(['Recibido', 'Presupuesto enviado', 'Aprobado', 'En producción', 'Listo para entregar', 'Enviado'])
const PAYMENT_STATUS_OPTIONS = ['Pendiente', 'Señal recibida', 'Pagado']
const SHIPPING_STATUS_OPTIONS = ['Sin preparar', 'Preparando', 'Enviado', 'Entregado']
const MANAGEMENT_BOARD_STATUSES = ['Recibido', 'Presupuesto enviado', 'Aprobado', 'En producción', 'Listo para entregar', 'Enviado']

const LOCAL_MEMORY_BLOCKS = [
  {
    key: CART_STORAGE_KEY,
    label: 'Carrito',
    description: 'Piezas que una clienta ha añadido antes de confirmar el pedido.'
  },
  {
    key: CUSTOM_PRODUCTS_STORAGE_KEY,
    label: 'Piezas creadas',
    description: 'Artículos nuevos publicados desde el panel de gestión.'
  },
  {
    key: CATALOG_OVERRIDES_STORAGE_KEY,
    label: 'Cambios de catálogo',
    description: 'Precios, stock, estado e imágenes modificadas en piezas existentes.'
  },
  {
    key: CATALOG_DELETED_STORAGE_KEY,
    label: 'Piezas retiradas',
    description: 'Piezas ocultas para que no salgan en la tienda publica.'
  },
  {
    key: ORDERS_STORAGE_KEY,
    label: 'Pedidos locales',
    description: 'Solicitudes guardadas en este navegador antes o después de sincronizar.'
  },
  {
    key: ORDERS_SYNC_QUEUE_KEY,
    label: 'Cola Firebase',
    description: 'Pedidos pendientes de subir cuando haya sesión y conexión.'
  },
  {
    key: PAYMENT_SETTINGS_STORAGE_KEY,
    label: 'Pagos y contacto',
    description: 'Bizum, PayPal, notas de envío y datos comerciales internos.'
  },
  {
    key: JOURNAL_CTA_METRICS_KEY,
    label: 'Métricas del diario',
    description: 'Clicks y pruebas locales para saber qué botones funcionan mejor.'
  },
  {
    key: JOURNAL_CTA_VARIANT_KEY,
    label: 'Variante diario',
    description: 'La versión A/B activa del botón principal del diario.'
  }
]

const readLocalMemoryValue = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const formatLocalMemorySize = (value) => {
  if (!value) return 'Vacío'
  const bytes = new Blob([value]).size
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const escapeCsvValue = (value) => {
  const text = String(value ?? '')
  if (!/[;"\n\r]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

const buildOrdersCsv = (orderList) => {
  const headers = [
    'Referencia',
    'Fecha',
    'Nombre',
    'Contacto',
    'Correo',
    'Estado',
    'Pago preferido',
    'Entrega',
    'Precio final',
    'Señal',
    'Método de pago usado',
    'Estado pago',
    'Estado envio',
    'Coste de envío',
    'Seguimiento',
    'Inventario',
    'Fecha objetivo',
    'Dirección',
    'Idea',
    'Piezas',
    'Notas internas'
  ]

  const rows = orderList.map((order) => [
    order.reference,
    order.createdAt ? new Date(order.createdAt).toLocaleString('es-ES') : '',
    order.name,
    order.whatsapp,
    order.customerEmail,
    order.status,
    order.paymentPreference,
    order.deliveryPreference,
    order.finalPrice,
    order.depositAmount,
    order.paymentMethodUsed,
    order.paymentStatus,
    order.shippingStatus,
    order.shippingCost,
    order.trackingCode,
    order.inventoryStatus,
    order.targetDate,
    order.shippingAddress,
    order.idea,
    Array.isArray(order.cartLines)
      ? order.cartLines.map((line) => `${line.title || line.slug} x${line.qty || 1}`).join(' | ')
      : '',
    order.internalNotes
  ])

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(';'))
    .join('\n')
}

const downloadTextFile = (content, fileName, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

const parseEuroAmount = (value) => {
  const normalized = String(value ?? '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const amount = Number.parseFloat(normalized)
  return Number.isFinite(amount) ? amount : 0
}

const formatEuroAmount = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
}).format(value)

const getOrderStatusClass = (value) => String(value || 'Recibido')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const getOrderSourceLabel = (source) => ({
  cart_checkout: 'Carrito',
  orders_quick_form: 'Encargo',
  journal_quick_form: 'Diario',
  firebase_sync: 'Firebase'
}[source] || 'Web')

const getOrderNextStep = (order) => {
  const status = normalizeOrderStatus(order.status)
  if (status === 'Recibido') return 'El atelier revisa disponibilidad, plazo y forma de pago.'
  if (status === 'Presupuesto enviado') return 'Revisa el presupuesto y confirma si quieres continuar.'
  if (status === 'Aprobado') return 'Pedido aprobado. El atelier prepara la pieza o reserva.'
  if (status === 'En producción') return 'La pieza está en trabajo dentro del atelier.'
  if (status === 'Listo para entregar') return 'Pedido listo para recogida o envío.'
  if (status === 'Enviado') return 'Pedido enviado. Revisa los datos de entrega.'
  if (status === 'Entregado') return 'Pedido entregado.'
  return 'Pedido cerrado.'
}

const getOrderItemsLabel = (order) => {
  if (!Array.isArray(order.cartLines) || order.cartLines.length === 0) return 'Sin piezas de carrito'
  const itemCount = order.cartLines.reduce((total, line) => total + (Number(line.qty) || 1), 0)
  return `${itemCount} pieza(s) · ${order.cartLines.length} referencia(s)`
}

const buildClientOrderMessage = (order) => [
  `Hola ${order.name || ''}, soy Atelier Lumière.`,
  `Te escribo sobre tu pedido ${order.reference || 'sin referencia'}.`,
  `Estado actual: ${normalizeOrderStatus(order.status)}.`,
  `Siguiente paso: ${getOrderNextStep(order)}`,
  order.finalPrice ? `Importe: ${order.finalPrice}.` : null,
  order.depositAmount ? `Señal registrada: ${order.depositAmount}.` : null,
  order.paymentMethodUsed ? `Pago por: ${order.paymentMethodUsed}.` : null,
  order.trackingCode ? `Seguimiento del envío: ${order.trackingCode}.` : null
].filter(Boolean).join('\n')

const buildOrderSheetText = (order) => {
  const cartLines = Array.isArray(order.cartLines) && order.cartLines.length > 0
    ? order.cartLines.map((line) => `- ${line.title || line.slug} x${line.qty || 1} (${line.price || 'sin precio'})`).join('\n')
    : 'Sin piezas asociadas al carrito.'

  return [
    'ATELIER LUMIERE - FICHA DE PEDIDO',
    '',
    `Referencia: ${order.reference || 'Sin referencia'}`,
    `Fecha: ${order.createdAt ? new Date(order.createdAt).toLocaleString('es-ES') : 'Sin fecha'}`,
    `Clienta: ${order.name || 'Sin nombre'}`,
    `Contacto: ${order.whatsapp || 'Sin contacto'}`,
    `Correo: ${order.customerEmail || 'Sin correo'}`,
    '',
    `Estado: ${order.status || 'Recibido'}`,
    `Pago preferido: ${order.paymentPreference || 'Por confirmar'}`,
    `Estado de pago: ${order.paymentStatus || 'Pendiente'}`,
    `Entrega: ${order.deliveryPreference || 'Por confirmar'}`,
    `Estado de envío: ${order.shippingStatus || 'Sin preparar'}`,
    `Coste de envío: ${order.shippingCost || 'Sin cerrar'}`,
    `Seguimiento: ${order.trackingCode || 'Sin seguimiento'}`,
    `Inventario: ${order.inventoryStatus || 'Sin actualizar'}`,
    `Fecha objetivo: ${order.targetDate || 'Sin fecha objetivo'}`,
    `Precio final: ${order.finalPrice || 'Sin cerrar'}`,
    `Señal: ${order.depositAmount || 'Sin señal'}`,
    `Método de pago usado: ${order.paymentMethodUsed || 'Por confirmar'}`,
    '',
    'Idea / solicitud:',
    order.idea || 'Sin detalle.',
    '',
    'Piezas:',
    cartLines,
    '',
    'Dirección de envío:',
    order.shippingAddress || 'Sin dirección guardada.',
    '',
    'Notas internas:',
    order.internalNotes || 'Sin notas internas.'
  ].join('\n')
}

const DEFAULT_BUSINESS_SETTINGS = {
  bizum: '',
  paypal: '',
  transferOwner: '',
  contactEmail: '',
  contactWhatsapp: '',
  paymentNote: '',
  shippingNote: ''
}

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS || import.meta.env.VITE_OWNER_EMAIL || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const isConfiguredOwnerEmail = (email) => OWNER_EMAILS.includes(normalizeEmail(email))
const normalizeProductAvailability = (value) => (
  PRODUCT_AVAILABILITY_OPTIONS.includes(value) ? value : 'Disponible'
)

const LEGACY_ORDER_STATUS_MAP = {
  'En proceso': 'En producción'
}

const normalizeOrderStatus = (value) => {
  const status = String(value || '').trim()
  return ORDER_STATUS_OPTIONS.includes(status) ? status : (LEGACY_ORDER_STATUS_MAP[status] || 'Recibido')
}

const getProductAvailabilityClass = (value) => (
  normalizeProductAvailability(value).toLowerCase().replace(/\s+/g, '-')
)

const readBusinessSettings = () => {
  try {
    const savedSettings = window.localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY)
    if (!savedSettings) return DEFAULT_BUSINESS_SETTINGS
    const parsedSettings = JSON.parse(savedSettings)
    return { ...DEFAULT_BUSINESS_SETTINGS, ...parsedSettings }
  } catch {
    return DEFAULT_BUSINESS_SETTINGS
  }
}

const readCatalogOverrides = () => {
  try {
    const savedOverrides = window.localStorage.getItem(CATALOG_OVERRIDES_STORAGE_KEY)
    if (!savedOverrides) return {}
    const parsedOverrides = JSON.parse(savedOverrides)
    return parsedOverrides && typeof parsedOverrides === 'object' ? parsedOverrides : {}
  } catch {
    return {}
  }
}

const slugifyProductValue = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || `pieza-${Date.now()}`

const readCustomProducts = () => {
  try {
    const savedProducts = window.localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY)
    if (!savedProducts) return []
    const parsedProducts = JSON.parse(savedProducts)
    return Array.isArray(parsedProducts) ? parsedProducts : []
  } catch {
    return []
  }
}

const writeCustomProducts = (items) => {
  window.localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(items))
}

const readDeletedProductSlugs = () => {
  try {
    const savedSlugs = window.localStorage.getItem(CATALOG_DELETED_STORAGE_KEY)
    if (!savedSlugs) return []
    const parsedSlugs = JSON.parse(savedSlugs)
    return Array.isArray(parsedSlugs) ? parsedSlugs : []
  } catch {
    return []
  }
}

const writeDeletedProductSlugs = (items) => {
  window.localStorage.setItem(CATALOG_DELETED_STORAGE_KEY, JSON.stringify(items))
}

const applyCatalogOverrides = (items) => {
  const overrides = readCatalogOverrides()
  return items.map((item) => ({ ...item, ...(overrides[item.slug] || {}) }))
}

const mergeCatalogProducts = (baseProducts, customProducts = readCustomProducts()) => (
  applyCatalogOverrides([...customProducts, ...baseProducts].map(normalizeShopProduct))
    .filter((product) => !readDeletedProductSlugs().includes(product.slug))
)

const routeTitles = {
  '/': 'Atelier Lumière',
  '/coleccion': 'Colección · Atelier Lumière',
  '/producto': 'Producto · Atelier Lumière',
  '/carrito': 'Carrito · Atelier Lumière',
  '/acceder': 'Acceder · Atelier Lumière',
  '/gestion': 'Acceso privado · Atelier Lumière',
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

const FIREBASE_ERROR_MESSAGES = {
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/missing-password': 'Introduce la contraseña para poder continuar.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión.',
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

const LEGACY_FIREBASE_ERROR_CODES = {
  'auth/wrong-password': 'INVALID_PASSWORD',
  'auth/user-disabled': 'USER_DISABLED',
  'auth/email-already-in-use': 'EMAIL_EXISTS',
  'auth/too-many-requests': 'TOO_MANY_ATTEMPTS_TRY_LATER',
  'auth/operation-not-allowed': 'OPERATION_NOT_ALLOWED',
  'auth/invalid-credential': 'INVALID_PASSWORD',
  'auth/invalid-login-credentials': 'INVALID_PASSWORD',
  'auth/invalid-email': 'auth/invalid-email',
  'auth/missing-password': 'auth/missing-password',
  'auth/weak-password': 'auth/weak-password',
  'auth/network-request-failed': 'auth/network-request-failed',
  'permission-denied': 'PERMISSION_DENIED',
  unauthenticated: 'UNAUTHENTICATED'
}

const normalizeFirebaseErrorMessage = (errorCode) => {
  if (!errorCode) return 'No se pudo completar la operación en Firebase.'
  const normalizedErrorCode = LEGACY_FIREBASE_ERROR_CODES[errorCode] || errorCode
  return FIREBASE_ERROR_MESSAGES[normalizedErrorCode] || `Error Firebase: ${errorCode}`
}

const getShopCategories = (productList) => [
  'Todos',
  ...Array.from(new Set(productList.map((product) => product.category).filter(Boolean)))
]

const resolveAppPath = (value) => `${import.meta.env.BASE_URL}${value.replace(/^\.\//, '')}`

const normalizeAssetPath = (value) => {
  if (typeof value !== 'string' || value.length === 0) return value
  if (value.startsWith('data:')) return value
  if (/^(https:)\/\//.test(value)) return value
  if (value.startsWith('/')) return resolveAppPath(value)
  if (value.startsWith('./')) return resolveAppPath(value)
  return value
}

const readImageFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve('')
    return
  }

  if (!file.type.startsWith('image/')) {
    reject(new Error('El archivo debe ser una imagen.'))
    return
  }

  if (file.size > 2.5 * 1024 * 1024) {
    reject(new Error('La imagen pesa demasiado. Prueba con una imagen de menos de 2,5 MB.'))
    return
  }

  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
  reader.readAsDataURL(file)
})

const validateImageFile = (file) => {
  if (!file) return 'Selecciona una imagen.'
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen.'
  if (file.size > 4 * 1024 * 1024) return 'La imagen pesa demasiado. Prueba con una imagen de menos de 4 MB.'
  return ''
}

const buildStorageImagePath = (slug, file) => {
  const extension = file?.name?.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const cleanSlug = slugifyProductValue(slug || 'pieza')
  return `catalogo/${cleanSlug}/${Date.now()}.${extension}`
}

const normalizeProductStock = (value) => {
  const numberValue = Number.parseInt(value, 10)
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 1
}

const isProductAvailableForCart = (product) => (
  PRODUCT_AVAILABLE_FOR_CART.has(normalizeProductAvailability(product.availability))
  && normalizeProductStock(product.stock) > 0
)

const normalizeShopProduct = (product) => ({
  ...product,
  image: normalizeAssetPath(product.image),
  localVideo: normalizeAssetPath(product.video || product.localVideo),
  availability: normalizeProductAvailability(product.availability),
  stock: normalizeProductStock(product.stock)
})

const buildUserProfilePayload = (user) => {
  const now = new Date().toISOString()
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Cliente',
    role: 'customer',
    createdAt: now,
    updatedAt: now
  }
}

const getAccessProfile = (user, profile = null) => {
  const baseProfile = profile || buildUserProfilePayload(user)

  if (isConfiguredOwnerEmail(user.email)) {
    return {
      ...baseProfile,
      role: 'owner',
      ownerSource: 'local-config'
    }
  }

  return baseProfile
}

const buildAuthUserState = (user, profile = null) => {
  const accessProfile = getAccessProfile(user, profile)

  return {
    uid: user.uid,
    localId: user.uid,
    email: user.email || '',
    profile: accessProfile,
    isOwner: accessProfile?.role === 'owner'
  }
}

const normalizeOrderRecord = (id, payload) => ({
  id,
  name: payload.name || '',
  whatsapp: payload.whatsapp || '',
  customerEmail: payload.customerEmail || '',
  paymentPreference: payload.paymentPreference || '',
  deliveryPreference: payload.deliveryPreference || '',
  idea: payload.idea || '',
  source: payload.source || 'firebase_sync',
  status: normalizeOrderStatus(payload.status),
  createdAt: payload.createdAt || new Date().toISOString(),
  reference: payload.reference || '',
  ownerId: payload.ownerId || '',
  finalPrice: payload.finalPrice || '',
  depositAmount: payload.depositAmount || '',
  paymentMethodUsed: payload.paymentMethodUsed || '',
  paymentStatus: payload.paymentStatus || 'Pendiente',
  shippingStatus: payload.shippingStatus || 'Sin preparar',
  shippingCost: payload.shippingCost || '',
  trackingCode: payload.trackingCode || '',
  targetDate: payload.targetDate || '',
  shippingAddress: payload.shippingAddress || '',
  internalNotes: payload.internalNotes || '',
  inventoryStatus: payload.inventoryStatus || '',
  inventoryUpdatedAt: payload.inventoryUpdatedAt || '',
  cartLines: Array.isArray(payload.cartLines) ? payload.cartLines : []
})

const mergeOrdersById = (localOrders, remoteOrders) => {
  const orderMap = new Map(localOrders.map((order) => [order.id, order]))

  for (const remoteOrder of remoteOrders) {
    const existingOrder = orderMap.get(remoteOrder.id)
    orderMap.set(remoteOrder.id, existingOrder ? { ...existingOrder, ...remoteOrder } : remoteOrder)
  }

  return Array.from(orderMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}


function Header({ isScrolled, menuOpen, setMenuOpen, route, cartCount, cartPulse }) {
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
          <a className="site-nav__mobile-tool" href="#/carrito" onClick={() => setMenuOpen(false)}>
            Carrito {cartCount}
          </a>
          <a className="site-nav__mobile-tool" href="#/acceder" onClick={() => setMenuOpen(false)}>
            Acceder
          </a>
        </nav>

        <div className="header-tools" aria-label="Accesos rápidos">
          <a className={`cart-pill ${cartPulse ? 'is-pulsing' : ''}`} href="#/carrito" onClick={() => setMenuOpen(false)}>
            Carrito {cartCount}
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

function SmartVideo({ primarySrc, fallbackSrc, poster, className = '', controls = true, autoPlay = false, loop = false, muted = false, ...videoProps }) {
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
      {...videoProps}
    >
      <source src={primarySrc} type="video/mp4" />
      {fallbackSrc ? <source src={fallbackSrc} type="video/mp4" /> : null}
      Tu navegador no puede reproducir este vídeo.
    </video>
  )
}

function SmartVideoSegment({
  primarySrc,
  fallbackSrc,
  poster,
  className = '',
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  loopStart = 0,
  loopEnd = null
}) {
  const hasCustomLoopRange = Number.isFinite(loopEnd) && loopEnd > loopStart

  const handleLoadedMetadata = (event) => {
    if (loopStart > 0) {
      event.currentTarget.currentTime = loopStart
    }
  }

  const handleTimeUpdate = (event) => {
    if (!hasCustomLoopRange) {
      return
    }

    const video = event.currentTarget

    if (video.currentTime >= loopEnd) {
      video.currentTime = loopStart

      if (!video.paused) {
        const playPromise = video.play()

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {})
        }
      }
    }
  }

  return (
    <SmartVideo
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop && !hasCustomLoopRange}
      muted={muted}
      poster={poster}
      primarySrc={primarySrc}
      fallbackSrc={fallbackSrc}
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
    />
  )
}

function HomePage({ productsList }) {
  const collectionPreview = productsList.slice(0, 3)

  return (
    <>
      <section id="inicio" className="collection-hero collection-hero--home">
        <div className="collection-hero__media">
          {mediaConfig.heroVideoEnabled ? (
            <SmartVideo autoPlay loop muted controls={false} poster={mediaConfig.heroPoster} primarySrc={mediaConfig.heroVideoSrc} fallbackSrc={mediaConfig.atelierVideo} />
          ) : (
            <img src={mediaConfig.heroPoster} alt="Artesana bordando junto a una ventana luminosa" />
          )}
        </div>
        <div className="collection-hero__veil" />
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy collection-hero__copy--home">
            <p className="eyebrow">Atelier francés · bordado artesanal</p>
            <h1>Atelier Lumière</h1>
            <p className="hero-v4__lead">
              Piezas bordadas a mano, accesorios delicados y encargos creados con calma para convertir una idea en algo único.
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
          </div>
        </div>
      </section>

      <PageSection id="home-collection" className="section-block--tinted">
        <div className="container">
          <SectionIntro
            eyebrow="Colección destacada"
            title="Piezas listas para descubrir"
            text="Una selección breve para entrar en el universo del atelier sin perderse entre demasiadas opciónes."
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
        <div className="container">
          <article className="story-card story-card--premium story-card--home-focus">
            <img loading="lazy" src={mediaConfig.portrait} alt="Retrato cercano de la creadora bordando" />
            <div className="story-card__body">
              <p className="eyebrow">Encargos personalizados</p>
              <h2>Piezas únicas creadas para momentos con historia</h2>
              <p>
                Si tienes una idea, un nombre o una fecha especial, la convertimos en una pieza bordada con formato, color y acabado definidos contigo.
              </p>
              <div className="hero-actions">
                <a className="button button--dark" href="#/encargos">
                  Solicitar un encargo
                </a>
                <a className="button button--secondary" href="#/sobre-mi">
                  Conocer el atelier
                </a>
              </div>
            </div>
          </article>

        </div>
      </PageSection>

      <PageSection id="home-journal" className="section-block--soft">
        <div className="container">
          <article className="collection-service-cta collection-service-cta--home">
            <div>
              <p className="eyebrow">Diario del taller</p>
              <h3>Proceso, inspiración y piezas en marcha</h3>
              <p>Un espacio breve para ver cómo nacen los bordados antes de llegar a la colección.</p>
            </div>
            <div className="collection-service-cta__actions">
              <a className="button button--primary" href="#/diario">Entrar al diario</a>
              <a className="button button--secondary" href="#/contacto">Contactar</a>
            </div>
          </article>
        </div>
      </PageSection>
    </>
  )
}

function PageHero({
  eyebrow,
  title,
  text,
  image,
  alt,
  videoSrc,
  videoFallbackSrc = mediaConfig.atelierVideo,
  videoLoopStart = 0,
  videoLoopEnd = null,
  actions = []
}) {
  return (
    <section className="page-hero page-hero--premium">
      <div className="container page-hero__grid">
        <div className="page-hero__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{text}</p>
          {actions.length > 0 ? (
            <div className="hero-actions">
              {actions.map((action) => {
                const isExternal = /^https:\/\//.test(action.href)

                return (
                  <a
                    key={action.href}
                    className={`button ${action.kind === 'secondary' ? 'button--secondary' : 'button--primary'}`}
                    href={action.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer' : undefined}
                  >
                    {action.label}
                  </a>
                )
              })}
            </div>
          ) : null}
        </div>

        <figure className="page-hero__media">
          {videoSrc ? (
            <SmartVideoSegment
              className="page-hero__video"
              controls={false}
              autoPlay
              loop
              muted
              poster={image}
              primarySrc={videoSrc}
              fallbackSrc={videoFallbackSrc}
              loopStart={videoLoopStart}
              loopEnd={videoLoopEnd}
            />
          ) : (
            <img src={image} alt={alt} />
          )}
        </figure>
      </div>
    </section>
  )
}

function CollectionPage({ onAddToCart, productsList }) {
  const allProducts = productsList
  const categories = getShopCategories(allProducts)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [activeAvailability, setActiveAvailability] = useState('Todas')
  const [businessSettings, setBusinessSettings] = useState(DEFAULT_BUSINESS_SETTINGS)
  const [cartNotice, setCartNotice] = useState('')

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory
    const matchesAvailability = activeAvailability === 'Todas'
      || normalizeProductAvailability(product.availability) === activeAvailability
    return matchesCategory && matchesAvailability
  })
  const sortedProducts = [...filteredProducts].sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
  const categoryCounts = allProducts.reduce((acc, product) => {
    if (!product.category) return acc
    acc[product.category] = (acc[product.category] ?? 0) + 1
    return acc
  }, {})
  const availabilityCounts = allProducts.reduce((acc, product) => {
    const availability = normalizeProductAvailability(product.availability)
    acc[availability] = (acc[availability] ?? 0) + 1
    return acc
  }, {})
  const paymentMethods = [
    businessSettings.bizum ? 'Bizum' : null,
    businessSettings.paypal ? 'PayPal' : null,
    businessSettings.transferOwner ? 'Transferencia' : null
  ].filter(Boolean)

  const scrollToPieces = () => {
    document.getElementById('piezas-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleAddProductToCart = (product) => {
    onAddToCart(product)
    setCartNotice(`${product.title} se ha añadido al carrito.`)
  }

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
            <h1>Colección Atelier</h1>
            <p>Piezas bordadas, accesorios y encargos reunidos en un catálogo más directo.</p>
            <button type="button" className="button button--primary" onClick={scrollToPieces}>
              Ver piezas disponibles
            </button>
          </div>
        </div>
      </section>

      <PageSection id="piezas-disponibles">
        <div className="container">
          <div className="collection-catalog-head">
            <div>
              <p className="eyebrow">Catálogo</p>
              <h2>Piezas disponibles</h2>
            </div>
            <p>{allProducts.length} piezas publicadas en {categories.length - 1} categorías.</p>
          </div>

          <div className="pill-list pill-list--shop">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={'editorial-pill editorial-pill--category ' + (activeCategory === category ? 'is-active' : '')}
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

          <div className="pill-list pill-list--shop">
            {PRODUCT_AVAILABILITY_FILTERS.map((availability) => (
              <button
                key={availability}
                type="button"
                className={'editorial-pill editorial-pill--category ' + (activeAvailability === availability ? 'is-active' : '')}
                onClick={() => setActiveAvailability(availability)}
                aria-pressed={activeAvailability === availability}
              >
                {availability}
                <span className="editorial-pill__count">
                  {availability === 'Todas' ? allProducts.length : (availabilityCounts[availability] ?? 0)}
                </span>
              </button>
            ))}
          </div>

          <div className="shop-toolbar">
            <p>{cartNotice || `${filteredProducts.length} pieza(s) visibles.`}</p>
            {cartNotice || activeCategory !== 'Todos' || activeAvailability !== 'Todas' ? (
              <div className="shop-toolbar__actions">
                {cartNotice ? <a className="editorial-pill editorial-pill--cart" href="#/carrito">Ver carrito</a> : null}
                {activeCategory !== 'Todos' || activeAvailability !== 'Todas' ? (
                  <button
                    type="button"
                    className="editorial-pill"
                    onClick={() => {
                      setActiveCategory('Todos')
                      setActiveAvailability('Todas')
                    }}
                  >
                    Limpiar
                  </button>
                ) : null}
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
                    <span className={'product-availability product-availability--' + getProductAvailabilityClass(product.availability)}>
                      {normalizeProductAvailability(product.availability)}
                    </span>
                  </div>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="product-card__meta">
                    <strong>{product.price}</strong>
                    <span>{normalizeProductStock(product.stock)} unidad(es)</span>
                  </div>
                  <div className="product-card__actions product-card__actions--shop">
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => handleAddProductToCart(product)}
                      disabled={!isProductAvailableForCart(product)}
                    >
                      {isProductAvailableForCart(product) ? 'Añadir al carrito' : 'No disponible'}
                    </button>
                    <a className="button button--secondary" href="#/producto">
                      Ver detalle
                    </a>
                  </div>
                </div>
              </article>
            )) : (
              <article className="quote-panel quote-panel--signature">
                <p className="eyebrow">Sin resultados</p>
                <h3>No hay piezas en esta categoría por ahora</h3>
                <p>Prueba otra selección o vuelve a Todos para ver la colección completa.</p>
                <a className="button button--secondary" href="#/encargos">
                  Solicitar pieza a medida
                </a>
              </article>
            )}
          </div>

          <article className="collection-service-cta">
            <div>
              <p className="eyebrow">Asesoría del atelier</p>
              <h3>¿Buscas algo a medida?</h3>
              <p>Cuéntame la idea y preparo una recomendación sencilla de formato, color y acabado.</p>
            </div>
            <div className="collection-service-cta__actions">
              <a className="button button--primary" href="#/contacto">Pedir recomendación</a>
              <a className="button button--secondary" href="#/encargos">Encargo personalizado</a>
            </div>
          </article>

          <article className="quote-panel collection-support-panel">
            <p className="eyebrow">Compra y reserva</p>
            <h3>La colección ya está preparada para vender dentro de la web</h3>
            <p>Las piezas terminadas pueden pedirse desde el carrito. Los encargos y variantes siguen mejor desde la parte de encargos.</p>
            <ul className="note-list">
              <li>{paymentMethods.length > 0 ? `Métodos disponibles: ${paymentMethods.join(', ')}.` : 'El método de pago se confirmará al revisar el pedido.'}</li>
              {businessSettings.contactEmail ? <li>Correo del atelier: {businessSettings.contactEmail}</li> : null}
              {businessSettings.contactWhatsapp ? <li>WhatsApp del atelier: {businessSettings.contactWhatsapp}</li> : null}
              {businessSettings.shippingNote ? <li>{businessSettings.shippingNote}</li> : null}
            </ul>
          </article>
        </div>
      </PageSection>
    </>
  )
}

function ProductPage({ onAddToCart, productsList }) {
  const featured = productsList[0]
  const [businessSettings, setBusinessSettings] = useState(DEFAULT_BUSINESS_SETTINGS)
  const paymentMethods = [
    businessSettings.bizum ? 'Bizum' : null,
    businessSettings.paypal ? 'PayPal' : null,
    businessSettings.transferOwner ? 'Transferencia' : null
  ].filter(Boolean)

  useEffect(() => {
    setBusinessSettings(readBusinessSettings())
  }, [])

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
              <span className={`product-availability product-availability--${getProductAvailabilityClass(featured.availability)}`}>
                {normalizeProductAvailability(featured.availability)}
              </span>
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
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => onAddToCart(featured)}
                  disabled={!PRODUCT_AVAILABLE_FOR_CART.has(normalizeProductAvailability(featured.availability))}
                >
  {PRODUCT_AVAILABLE_FOR_CART.has(normalizeProductAvailability(featured.availability)) ? 'Añadir al carrito' : 'No disponible'}
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

            <article className="quote-panel quote-panel--product">
              <p className="eyebrow">Reserva y pago</p>
              <h3>Antes de cerrar la compra te enseñamos cómo continuar</h3>
              <ul className="note-list">
                <li>{paymentMethods.length > 0 ? `Métodos disponibles: ${paymentMethods.join(', ')}.` : 'El método de pago se confirmará al revisar el pedido.'}</li>
                {businessSettings.paymentNote ? <li>{businessSettings.paymentNote}</li> : <li>Cuando completes el pedido, recibirás la referencia para confirmar disponibilidad y pago.</li>}
                {businessSettings.contactEmail ? <li>Correo de apoyo: {businessSettings.contactEmail}</li> : null}
                {businessSettings.contactWhatsapp ? <li>WhatsApp de apoyo: {businessSettings.contactWhatsapp}</li> : null}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}

function CartPage({ cartItems, onAddToCart, onSetCartQuantity, onRemoveFromCart, onCreateOrder, onClearCart, productsList }) {
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    paymentPreference: 'Por confirmar',
    deliveryPreference: 'Envío',
    shippingAddress: '',
    notes: '',
    acceptedReview: false
  })
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [lastOrder, setLastOrder] = useState(null)
  const [businessSettings, setBusinessSettings] = useState(DEFAULT_BUSINESS_SETTINGS)
  const lines = cartItems
    .map((line) => {
      const product = productsList.find((item) => item.slug === line.slug)
      return product ? { ...line, product } : null
    })
    .filter(Boolean)
  const orderSummary = lines.map((line) => `${line.product.title} x${line.qty} (${line.product.price})`).join('\n')
  const paymentMethods = [
    businessSettings.bizum ? 'Bizum' : null,
    businessSettings.paypal ? 'PayPal' : null,
    businessSettings.transferOwner ? 'Transferencia' : null
  ].filter(Boolean)
  const paymentOptions = ['Por confirmar', ...paymentMethods]
  const itemCount = lines.reduce((total, line) => total + line.qty, 0)
  const pricedTotal = lines.reduce((total, line) => total + (parseEuroAmount(line.product.price) * line.qty), 0)
  const hasPriceToConfirm = lines.some((line) => parseEuroAmount(line.product.price) === 0)
  const orderTotalLabel = pricedTotal > 0
    ? `${formatEuroAmount(pricedTotal)}${hasPriceToConfirm ? ' + piezas a confirmar' : ''}`
    : 'Precio a confirmar'

  useEffect(() => {
    setBusinessSettings(readBusinessSettings())
  }, [])

  const handleCheckoutSubmit = (event) => {
    event.preventDefault()
    const name = checkoutForm.name.trim()
    const email = checkoutForm.email.trim()
    const whatsapp = checkoutForm.whatsapp.trim()
    const paymentPreference = checkoutForm.paymentPreference
    const deliveryPreference = checkoutForm.deliveryPreference
    const shippingAddress = checkoutForm.shippingAddress.trim()
    const notes = checkoutForm.notes.trim()

    if (lines.length === 0) {
      setCheckoutMessage('Añade alguna pieza antes de finalizar.')
      return
    }

    if (name.length < 2 || whatsapp.length < 6) {
      setCheckoutMessage('Completa nombre y WhatsApp para crear la solicitud.')
      return
    }

    if (email && !email.includes('@')) {
      setCheckoutMessage('Revisa el correo o deja ese campo vacío.')
      return
    }

    if (deliveryPreference === 'Envío' && shippingAddress.length < 8) {
      setCheckoutMessage('Añade una dirección de entrega o cambia la entrega a recoger/confirmar.')
      return
    }

    if (!checkoutForm.acceptedReview) {
      setCheckoutMessage('Confirma que el pago se revisará antes de enviar datos o reservar la pieza.')
      return
    }

    const createdOrder = onCreateOrder({
      name,
      whatsapp,
      customerEmail: email,
      paymentPreference,
      deliveryPreference,
      shippingAddress,
      finalPrice: hasPriceToConfirm ? 'Pendiente de confirmar' : formatEuroAmount(pricedTotal),
      idea: `Pedido desde carrito:
${orderSummary}\n\nTotal orientativo: ${orderTotalLabel}\nPago preferido: ${paymentPreference}\nEntrega: ${deliveryPreference}${shippingAddress ? `\nDirección: ${shippingAddress}` : ''}${email ? `\nCorreo: ${email}` : ''}${notes ? `\n\nNotas: ${notes}` : ''}`,
      source: 'cart_checkout',
      cartLines: lines.map((line) => ({
        slug: line.slug,
        title: line.product.title,
        price: line.product.price,
        qty: line.qty
      }))
    })

    setLastOrder(createdOrder)
    onClearCart()
    setCheckoutForm({
      name: '',
      email: '',
      whatsapp: '',
      paymentPreference: 'Por confirmar',
      deliveryPreference: 'Envío',
      shippingAddress: '',
      notes: '',
      acceptedReview: false
    })
    setCheckoutMessage(`Pedido guardado. Referencia: ${createdOrder.reference}. Podrás revisarlo desde tu acceso.`)
  }

  return (
    <>
      <PageHero
        eyebrow="Carrito"
        title="Tu selección del atelier"
        text="Revisa tus piezas y crea una solicitud con referencia para confirmar disponibilidad, tiempos y entrega."
        image={mediaConfig.visualLead}
        alt="Mesa del atelier con piezas seleccionadas"
      />

      <PageSection className="section-block--soft">
        <div className="container">
          {lines.length === 0 && lastOrder ? (
            <article className="quote-panel quote-panel--signature cart-confirmation-panel">
              <p className="eyebrow">Pedido creado</p>
              <h3>Referencia {lastOrder.reference}</h3>
              <p>Tu solicitud ha quedado guardada. La pieza no se cobra automáticamente: primero se revisa disponibilidad, pago y entrega.</p>
              <ul className="note-list">
                <li>Estado inicial: {normalizeOrderStatus(lastOrder.status)}</li>
                <li>Pago elegido: {lastOrder.paymentPreference || 'Por confirmar'}</li>
                <li>Total orientativo: {lastOrder.finalPrice || 'Pendiente de confirmar'}</li>
              </ul>
              <div className="collection-service-cta__actions">
                <a className="button button--primary" href="#/acceder">Ver seguimiento</a>
                <a className="button button--secondary" href="#/coleccion">Seguir mirando piezas</a>
              </div>
            </article>
          ) : lines.length === 0 ? (
            <article className="quote-panel quote-panel--signature">
                <p className="eyebrow">Carrito vacío</p>
                <h3>Aún no has añadido ninguna pieza</h3>
                <p>Explora la colección y guarda tus favoritas para continuar después.</p>
                <a className="button button--primary" href="#/coleccion">
                  Ir a colección
                </a>
            </article>
          ) : (
            <div className="cart-checkout-layout">
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
                      <div className="cart-line-controls" aria-label={'Cantidad de ' + line.product.title}>
                        <button type="button" className="cart-line-stepper" onClick={() => onSetCartQuantity(line.slug, line.qty - 1)}>
                          -
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" className="cart-line-stepper" onClick={() => onSetCartQuantity(line.slug, line.qty + 1)} disabled={line.qty >= normalizeProductStock(line.product.stock)}>
                          +
                        </button>
                        <button type="button" className="button button--secondary cart-line-remove" onClick={() => onRemoveFromCart(line.slug)}>
                          Quitar
                        </button>
                      </div>
                      <div className="product-card__actions product-card__actions--shop">
                        <button type="button" className="button button--secondary" onClick={() => onAddToCart(line.product)}>
                          Añadir otra
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <form className="cart-checkout-form" onSubmit={handleCheckoutSubmit}>
                <p className="eyebrow">Finalizar pedido</p>
                <h3>Crear solicitud con referencia</h3>
                <p>Guardaremos este carrito como pedido para que puedas seguirlo desde tu acceso.</p>
                <div className="cart-summary-strip" aria-label="Resumen del carrito">
                  <span>{itemCount} pieza(s)</span>
                  <span>{lines.length} referencia(s)</span>
                  <span>{orderTotalLabel}</span>
                  <span>{paymentMethods.length > 0 ? paymentMethods.join(' / ') : 'Pago a confirmar'}</span>
                </div>
                <div className="cart-payment-panel">
                  <strong>Pago y confirmación</strong>
                  <p>{paymentMethods.length > 0 ? 'Métodos activos: ' + paymentMethods.join(', ') + '.' : 'El pago se confirmará contigo al revisar la solicitud.'}</p>
                  {businessSettings.bizum ? <p>Bizum: {businessSettings.bizum}</p> : null}
                  {businessSettings.paypal ? <p>PayPal: {businessSettings.paypal}</p> : null}
                  {businessSettings.contactEmail ? <p>Correo: {businessSettings.contactEmail}</p> : null}
                  {businessSettings.contactWhatsapp ? <p>WhatsApp del atelier: {businessSettings.contactWhatsapp}</p> : null}
                  {businessSettings.paymentNote ? <p>{businessSettings.paymentNote}</p> : null}
                  {businessSettings.shippingNote ? <p>{businessSettings.shippingNote}</p> : null}
                </div>
                <label>
                  Nombre
                  <input
                    type="text"
                    value={checkoutForm.name}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Tu nombre"
                  />
                </label>
                <label>
                  Correo
                  <input
                    type="email"
                    value={checkoutForm.email}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="tu@email.com"
                  />
                </label>
                <label>
                  Contactar
                  <input
                    type="text"
                    value={checkoutForm.whatsapp}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, whatsapp: event.target.value }))}
                    placeholder="+34..."
                  />
                </label>
                <label>
                  Pago preferido
                  <select
                    value={checkoutForm.paymentPreference}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, paymentPreference: event.target.value }))}
                  >
                    {paymentOptions.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Entrega
                  <select
                    value={checkoutForm.deliveryPreference}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, deliveryPreference: event.target.value }))}
                  >
                    <option value="Envío">Envío</option>
                    <option value="Recogida">Recogida</option>
                    <option value="Por confirmar">Por confirmar</option>
                  </select>
                </label>
                <label>
                  Dirección de entrega
                  <textarea
                    rows={3}
                    value={checkoutForm.shippingAddress}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, shippingAddress: event.target.value }))}
                    placeholder="Dirección, código postal y ciudad si quieres envío"
                  />
                </label>
                <label>
                  Notas
                  <textarea
                    rows={3}
                    value={checkoutForm.notes}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Plazo, dudas o preferencias"
                  />
                </label>
                <label className="cart-checkout-consent">
                  <input
                    type="checkbox"
                    checked={checkoutForm.acceptedReview}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, acceptedReview: event.target.checked }))}
                  />
                  <span>Entiendo que el atelier revisará disponibilidad, entrega y forma de pago antes de confirmar la compra.</span>
                </label>
                <button type="submit" className="button button--primary">
                  Crear solicitud
                </button>
                {checkoutMessage ? <p className="journal-quick-form__message">{checkoutMessage}</p> : null}
              </form>
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
  isSyncing,
  pendingSyncCount,
  ownerAccessRequired = false
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('Todos')
  const isOwnerAccount = Boolean(user?.profile?.role === 'owner')
  const canSubmitAccess = authReady && email.trim().length > 0 && password.length >= 6

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    await onLogin(email, password)
  }

  const handleRegister = async () => {
    await onRegister(email, password)
  }

  const customerOrders = user
    ? orders.filter((order) => order.ownerId === user.localId)
    : []
  const baseOrders = isOwnerAccount ? orders : customerOrders
  const visibleOrders = orderStatusFilter === 'Todos'
    ? baseOrders
    : baseOrders.filter((order) => normalizeOrderStatus(order.status) === orderStatusFilter)

  return (
    <>
      <PageHero
        eyebrow="Acceso Atelier"
        title="Tu espacio privado"
        text="Entra con tu correo para consultar pedidos, referencias y mensajes del atelier."
        image={mediaConfig.accessImage}
        alt="Mesa del atelier con hilos, flores y bordado preparado"
      />
      <PageSection className="section-block--soft">
        <div className="container split-panels split-panels--single">
          {ownerAccessRequired ? (
            <article className="quote-panel quote-panel--signature">
              <p className="eyebrow">Zona privada</p>
              <h3>Gestión solo para propietaria</h3>
              <p>Esta sección no está publicada para clientas. Entra con tu cuenta de propietaria para abrir la gestión interna.</p>
            </article>
          ) : null}

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
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
                      required
                    />
                  </label>
                </>
              )}

              {!user ? (
                <p className="management-note">Usa una contraseña de al menos 6 caracteres. No la compartas conmigo.</p>
              ) : null}
              {authError ? <p className="collection-upload-form__error">{authError}</p> : null}
              {authMessage ? <p className="collection-upload-form__message">{authMessage}</p> : null}

              {user ? (
                <button type="button" className="button button--secondary" onClick={onLogout}>
                  Cerrar sesión</button>
              ) : (
                <div className="product-card__actions product-card__actions--shop">
                  <button type="submit" className="button button--primary" disabled={!canSubmitAccess}>
                    Entrar
                  </button>
                  <button type="button" className="button button--secondary" onClick={handleRegister} disabled={!canSubmitAccess}>
                    Crear cuenta cliente
                  </button>
                </div>
              )}
            </form>
          )}

          {isOwnerAccount ? (
            <article className="quote-panel quote-panel--signature">
              <p className="eyebrow">Propietaria</p>
              <h3>Acceso interno</h3>
              <p>Tu cuenta ya tiene acceso a la parte privada. Desde aquí puedes entrar a gestión y seguir con pedidos, catálogo y ventas.</p>
              <a className="button button--primary" href="#/gestion">
                Abrir gestión
              </a>
            </article>
          ) : user ? (
            <article className="quote-panel quote-panel--signature login-account-panel">
              <p className="eyebrow">Cuenta cliente</p>
              <h3>Tu cuenta está lista</h3>
              <p>Desde aquí podrás consultar tus pedidos cuando haya solicitudes asociadas a este correo.</p>
              <div className="login-account-actions" aria-label="Accesos de cuenta">
                <a className="button button--primary" href="#/coleccion">Ver colección</a>
                <a className="button button--secondary" href="#/carrito">Ver carrito</a>
                <a className="button button--secondary" href="#/encargos">Nuevo encargo</a>
              </div>
              <p className="management-note">La gestión interna solo aparece en cuentas de propietaria.</p>
            </article>
          ) : null}

          {user ? (
            <article className="quote-panel quote-panel--signature login-orders-panel">
            <p className="eyebrow">{isOwnerAccount ? 'Gestión de pedidos' : 'Mis solicitudes'}</p>
            <h3>{isOwnerAccount ? 'Resumen de solicitudes' : 'Seguimiento de tus referencias'}</h3>
            {!user ? <p>Inicia sesión para ver tus pedidos y seguir su estado.</p> : null}
            {baseOrders.length > 0 ? (
              <label>
                Filtrar por estado
                <select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
                  <option value="Todos">Todos</option>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {visibleOrders.length === 0 ? (
              <div className="login-empty-state">
                <p>{isOwnerAccount ? 'Aún no hay solicitudes registradas.' : 'Aún no hay pedidos asociados a tu cuenta.'}</p>
                {!isOwnerAccount ? (
                  <a className="button button--secondary" href="#/encargos">Crear una solicitud</a>
                ) : null}
              </div>
            ) : (
              <div className="login-orders-list">
                {visibleOrders.map((order) => (
                  <article key={order.id} className="login-orders-item">
                    <div className="login-orders-item__header">
                      <strong>{isOwnerAccount ? (order.name || 'Sin nombre') : (order.reference || 'Sin referencia')}</strong>
                      <span className={`order-status-badge order-status-badge--${getOrderStatusClass(normalizeOrderStatus(order.status))}`}>
                        {normalizeOrderStatus(order.status)}
                      </span>
                    </div>
                    <div className="order-summary-chips" aria-label="Resumen del pedido">
                      <span>Ref: {order.reference || 'Sin referencia'}</span>
                      <span>{getOrderSourceLabel(order.source)}</span>
                      <span>{getOrderItemsLabel(order)}</span>
                      <span>Pago: {order.paymentPreference || 'Por confirmar'}</span>
                      <span>Entrega: {order.deliveryPreference || 'Por confirmar'}</span>
                      <span>Total: {order.finalPrice || 'Pendiente'}</span>
                    </div>
                    {isOwnerAccount ? <span>{order.whatsapp}</span> : null}
                    <p>{order.idea}</p>
                    <p className="order-next-step">{getOrderNextStep(order)}</p>
                    {Array.isArray(order.cartLines) && order.cartLines.length > 0 ? (
                      <ul className="management-cart-lines">
                        {order.cartLines.map((line) => (
                          <li key={`${order.id}-${line.slug || line.title}`}>
                            <span>{line.title || line.slug}</span>
                            <strong>x{line.qty || 1}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <small>{new Date(order.createdAt).toLocaleString('es-ES')}</small>
                    {isOwnerAccount ? (
                      <label>
                        Estado
                        <select value={normalizeOrderStatus(order.status)} onChange={(event) => onUpdateOrderStatus(order.id, event.target.value)}>
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="management-note">El estado se actualiza desde el atelier cuando el pedido avance.</p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {isOwnerAccount ? (
              <div className="login-orders-panel__actions">
                <button type="button" className="button button--secondary" onClick={onSyncOrders} disabled={!user || isSyncing}>
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar con Firebase'}
                </button>
                {pendingSyncCount > 0 ? <p>Pendientes de sincronizar: {pendingSyncCount}</p> : null}
                {syncMessage ? <p>{syncMessage}</p> : null}
              </div>
            ) : null}
          </article>
          ) : null}
        </div>
      </PageSection>
    </>
  )
}


function CatalogManagerPanel({ productsList, isVisible, onUpdateProduct, onCreateProduct, onDeleteProduct, onUploadProductImage, canUploadCloudImages }) {
  const [draft, setDraft] = useState({
    title: '',
    category: 'Piezas únicas',
    price: '',
    availability: 'Disponible',
    stock: '1',
    image: '',
    description: ''
  })
  const [message, setMessage] = useState('')
  const [uploadingImageKey, setUploadingImageKey] = useState('')

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setMessage('')
  }

  const handleDraftImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const validationError = validateImageFile(file)
      if (validationError) throw new Error(validationError)

      setUploadingImageKey('draft')
      if (canUploadCloudImages && onUploadProductImage) {
        const upload = await onUploadProductImage(file, draft.title || 'nueva-pieza')
        updateDraft('image', upload.url)
        setMessage(upload.message)
        return
      }

      const imageData = await readImageFileAsDataUrl(file)
      updateDraft('image', imageData)
      setMessage('Imagen cargada como vista previa local. Para verla en todos tus dispositivos habrá que activar Firebase Storage.')
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar la imagen.')
    } finally {
      setUploadingImageKey('')
    }
  }

  const handleProductImageUpload = async (product, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const validationError = validateImageFile(file)
      if (validationError) throw new Error(validationError)

      setUploadingImageKey(product.slug)
      if (canUploadCloudImages && onUploadProductImage) {
        const upload = await onUploadProductImage(file, product.slug)
        onUpdateProduct(product.slug, { image: upload.url, alt: product.alt || product.title, imageStoragePath: upload.storagePath || '' })
        setMessage(`${product.title}: ${upload.message}`)
        return
      }

      const imageData = await readImageFileAsDataUrl(file)
      onUpdateProduct(product.slug, { image: imageData, alt: product.alt || product.title })
      setMessage(`Imagen actualizada para ${product.title} como prueba local.`)
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar la imagen.')
    } finally {
      setUploadingImageKey('')
    }
  }

  const handleCreateSubmit = (event) => {
    event.preventDefault()
    const result = onCreateProduct(draft)

    if (!result.ok) {
      setMessage(result.message)
      return
    }

    setDraft({
      title: '',
      category: 'Piezas únicas',
      price: '',
      availability: 'Disponible',
      stock: '1',
      image: '',
      description: ''
    })
    setMessage(result.message)
  }

  return (
    <article id="gestion-catalogo" className="quote-panel management-catalog-panel">
      <p className="eyebrow">Catálogo</p>
      <h3>Edición de artículos</h3>
      <p>La edición del catálogo ya no aparece en la colección pública. Esta parte queda reservada para la gestión interna.</p>

      {isVisible ? (
        <>
          <div className="management-catalog-toolbar">
            <strong>{productsList.length} pieza(s) en catálogo</strong>
            <span>{canUploadCloudImages ? 'Las fotos se suben a Firebase Storage y el catálogo se actualiza desde aquí.' : 'Cambia precio, categoría y disponibilidad desde aquí. Las fotos se guardan en este navegador hasta activar Firebase Storage.'}</span>
          </div>

          <form className="management-create-product-form" onSubmit={handleCreateSubmit}>
            <div className="management-create-product-form__head">
              <div>
                <p className="eyebrow">Nueva pieza</p>
                <h4>Crear artículo para la colección</h4>
              </div>
              <button type="submit" className="button button--primary">Publicar pieza</button>
            </div>
            <div className="management-create-product-form__grid">
              <label>
                Nombre
                <input type="text" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} placeholder="Ej. Bolso Jardín" />
              </label>
              <label>
                Precio
                <input type="text" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} placeholder="Ej. 120 €" />
              </label>
              <label>
                Categoría
                <input type="text" value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} placeholder="Bolsos bordados" />
              </label>
              <label>
                Disponibilidad
                <select value={draft.availability} onChange={(event) => updateDraft('availability', event.target.value)}>
                  {PRODUCT_AVAILABILITY_OPTIONS.map((availability) => (
                    <option key={availability} value={availability}>{availability}</option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad
                <input type="number" min="0" step="1" value={draft.stock} onChange={(event) => updateDraft('stock', event.target.value)} placeholder="1" />
              </label>
              <label className="management-create-product-form__wide">
                Imagen
                <input type="text" value={draft.image} onChange={(event) => updateDraft('image', event.target.value)} placeholder="/media/imagen.png o https://..." />
              </label>
              <div className="management-image-uploader management-create-product-form__wide">
                <div>
                  <strong>Subir imagen desde este dispositivo</strong>
                  <span>{canUploadCloudImages ? 'Se subirá a Firebase Storage para usarla en la web publicada.' : 'Se guarda localmente en este navegador para probar el catálogo.'}</span>
                </div>
                <label className="button button--secondary">
                  {uploadingImageKey === 'draft' ? 'Subiendo...' : 'Elegir imagen'}
                  <input type="file" accept="image/*" onChange={handleDraftImageUpload} />
                </label>
                {draft.image ? (
                  <figure className="management-image-preview">
                    <img src={draft.image} alt="Vista previa de la nueva pieza" />
                  </figure>
                ) : null}
              </div>
              <label className="management-create-product-form__wide">
                Descripción
                <textarea rows={3} value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} placeholder="Describe materiales, estilo, medidas o intención de la pieza" />
              </label>
            </div>
            {message ? <p className="management-note">{message}</p> : null}
          </form>

          <div className="product-grid product-grid--shop">
            {productsList.map((product) => (
              <article key={'management-product-' + product.slug} className="product-card product-card--shop management-product-card">
                {product.localVideo ? (
                  <SmartVideo className="product-card__video" primarySrc={product.localVideo} controls />
                ) : (
                  <img src={product.image} alt={product.alt} />
                )}
                <div className="product-card__body">
                  <div className="product-card__labels">
                    <p className="collection-card__tag">{product.category}</p>
                    <span className={'product-availability product-availability--' + getProductAvailabilityClass(product.availability)}>
                      {normalizeProductAvailability(product.availability)}
                    </span>
                  </div>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="product-card__meta">
                    <strong>{product.price}</strong>
                  </div>
                  <div className="management-product-controls">
                    <label>
                      Precio
                      <input
                        type="text"
                        value={product.price}
                        onChange={(event) => onUpdateProduct(product.slug, { price: event.target.value })}
                      />
                    </label>
                    <label>
                      Categoría
                      <input
                        type="text"
                        value={product.category}
                        onChange={(event) => onUpdateProduct(product.slug, { category: event.target.value, tag: event.target.value })}
                      />
                    </label>
                    <label>
                      Disponibilidad
                      <select
                        value={normalizeProductAvailability(product.availability)}
                        onChange={(event) => onUpdateProduct(product.slug, { availability: event.target.value })}
                      >
                        {PRODUCT_AVAILABILITY_OPTIONS.map((availability) => (
                          <option key={availability} value={availability}>{availability}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Cantidad
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={normalizeProductStock(product.stock)}
                        onChange={(event) => onUpdateProduct(product.slug, { stock: normalizeProductStock(event.target.value) })}
                      />
                    </label>
                    <div className="management-image-uploader management-product-controls__wide">
                      <div>
                        <strong>Imagen del producto</strong>
                        <span>{canUploadCloudImages ? 'Sube una foto nueva desde PC o móvil y queda en la nube.' : 'Sube una foto nueva desde PC o móvil para probarla aquí.'}</span>
                      </div>
                      <label className="button button--secondary">
                        {uploadingImageKey === product.slug ? 'Subiendo...' : 'Subir imagen'}
                        <input type="file" accept="image/*" onChange={(event) => handleProductImageUpload(product, event)} />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="button button--secondary management-product-delete"
                      onClick={() => onDeleteProduct(product.slug)}
                    >
                      Retirar de tienda
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p>Abre el acceso privado para revisar el catálogo.</p>
      )}
    </article>
  )
}

function ManagementPage({
  user,
  orders,
  productsList,
  onUpdateOrderStatus,
  onUpdateOrderDetails,
  onSyncOrders,
  syncMessage,
  isSyncing,
  pendingSyncCount,
  onUpdateProduct,
  onCreateProduct,
  onDeleteProduct,
  onUploadProductImage,
  canUploadCloudImages
}) {
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [paymentFilter, setPaymentFilter] = useState('Todos')
  const [shippingFilter, setShippingFilter] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [saleDrafts, setSaleDrafts] = useState({})
  const [businessSettings, setBusinessSettings] = useState({
    bizum: '',
    paypal: '',
    transferOwner: '',
    contactEmail: '',
    contactWhatsapp: '',
    paymentNote: '',
    shippingNote: ''
  })
  const [settingsMessage, setSettingsMessage] = useState('')
  const [journalMetrics, setJournalMetrics] = useState(null)
  const [journalVariant, setJournalVariant] = useState('A')
  const [memoryMessage, setMemoryMessage] = useState('')
  const [memoryTick, setMemoryTick] = useState(0)

  const statusCounts = orders.reduce((acc, order) => {
    const status = normalizeOrderStatus(order.status)
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})
  const productAvailabilityCounts = productsList.reduce((acc, product) => {
    const availability = normalizeProductAvailability(product.availability)
    acc[availability] = (acc[availability] ?? 0) + 1
    return acc
  }, {})
  const catalogReadyCount = productsList.filter((product) => product.price !== 'Consultar').length
  const pendingOrders = orders.filter((order) => OPEN_ORDER_STATUSES.has(normalizeOrderStatus(order.status)))
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredOrders = orders
    .filter((order) => statusFilter === 'Todos' || normalizeOrderStatus(order.status) === statusFilter)
    .filter((order) => paymentFilter === 'Todos' || (order.paymentStatus || 'Pendiente') === paymentFilter)
    .filter((order) => shippingFilter === 'Todos' || (order.shippingStatus || 'Sin preparar') === shippingFilter)
    .filter((order) => {
      if (!normalizedSearchTerm) return true
      return [order.reference, order.name, order.whatsapp, order.idea, order.shippingAddress, order.internalNotes, order.trackingCode, order.paymentMethodUsed]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm))
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const boardOrdersByStatus = MANAGEMENT_BOARD_STATUSES.map((status) => ({
    status,
    orders: orders
      .filter((order) => normalizeOrderStatus(order.status) === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
  }))
  const orderAlerts = orders
    .map((order) => {
      const missing = [
        !order.finalPrice ? 'precio' : null,
        (order.paymentStatus || 'Pendiente') === 'Pendiente' ? 'pago' : null,
        order.deliveryPreference === 'Envío' && !order.shippingAddress ? 'dirección' : null,
        !order.targetDate && OPEN_ORDER_STATUSES.has(normalizeOrderStatus(order.status)) ? 'fecha' : null
      ].filter(Boolean)

      return { order, missing }
    })
    .filter((item) => item.missing.length > 0)
    .slice(0, 8)
  const paidOrders = orders.filter((order) => order.paymentStatus === 'Pagado')
  const signalOrders = orders.filter((order) => order.paymentStatus === 'Señal recibida')
  const pendingPaymentOrders = orders.filter((order) => (order.paymentStatus || 'Pendiente') === 'Pendiente')
  const shippingPendingOrders = orders.filter((order) => (order.shippingStatus || 'Sin preparar') !== 'Entregado')
  const productionOrders = orders.filter((order) => normalizeOrderStatus(order.status) === 'En producción')
  const paidTotal = paidOrders.reduce((total, order) => total + parseEuroAmount(order.finalPrice), 0)
  const signalTotal = signalOrders.reduce((total, order) => total + parseEuroAmount(order.depositAmount), 0)
  const pendingTotal = pendingPaymentOrders.reduce((total, order) => total + parseEuroAmount(order.finalPrice), 0)
  const readyToSendOrders = orders.filter((order) => (
    normalizeOrderStatus(order.status) === 'Listo para entregar'
    && (order.shippingStatus || 'Sin preparar') !== 'Entregado'
  ))
  const blockedOrders = orders.filter((order) => (
    OPEN_ORDER_STATUSES.has(normalizeOrderStatus(order.status))
    && (!order.finalPrice || (order.paymentStatus || 'Pendiente') === 'Pendiente')
  ))
  const configuredSettingCount = [
    businessSettings.bizum,
    businessSettings.paypal,
    businessSettings.transferOwner,
    businessSettings.contactEmail,
    businessSettings.contactWhatsapp
  ].filter(Boolean).length
  const localMemoryItems = LOCAL_MEMORY_BLOCKS.map((item) => {
    const value = readLocalMemoryValue(item.key)
    return {
      ...item,
      hasData: Boolean(value),
      size: formatLocalMemorySize(value)
    }
  })
  const localMemoryActiveCount = localMemoryItems.filter((item) => item.hasData).length

  useEffect(() => {
    setBusinessSettings(readBusinessSettings())
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
      setCopyMessage('Métricas del diario reiniciadas.')
    } catch {
      setCopyMessage('No se pudieron reiniciar las métricas en este navegador.')
    }
  }

  const scrollToCatalogManager = () => {
    document.getElementById('gestion-catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const buildOrderWhatsappHref = (order) => {
    const text = buildClientOrderMessage(order)
    const cleanPhone = String(order.whatsapp || '').replace(/[^\d+]/g, '')
    return cleanPhone
      ? `https://wa.me/${cleanPhone.replace(/^\+/, '')}?text=${encodeURIComponent(text)}`
      : `https://wa.me/34612345678?text=${encodeURIComponent(text)}`
  }

  const handleCopyReference = async (reference) => {
    if (!reference) return
    try {
      await navigator.clipboard.writeText(reference)
      setCopyMessage(`Referencia ${reference} copiada.`)
    } catch {
      setCopyMessage('No se pudo copiar la referencia en este navegador.')
    }
  }

  const handleCopyClientMessage = async (order) => {
    try {
      await navigator.clipboard.writeText(buildClientOrderMessage(order))
      setCopyMessage(`Mensaje del pedido ${order.reference || ''} copiado.`)
    } catch {
      setCopyMessage('No se pudo copiar el mensaje en este navegador.')
    }
  }

  const getSaleDraft = (order) => saleDrafts[order.id] || {
    finalPrice: order.finalPrice || '',
    depositAmount: order.depositAmount || '',
    paymentMethodUsed: order.paymentMethodUsed || order.paymentPreference || '',
    paymentStatus: order.paymentStatus || 'Pendiente',
    shippingStatus: order.shippingStatus || 'Sin preparar',
    shippingCost: order.shippingCost || '',
    trackingCode: order.trackingCode || '',
    targetDate: order.targetDate || '',
    shippingAddress: order.shippingAddress || '',
    internalNotes: order.internalNotes || ''
  }

  const handleSaleDraftChange = (order, field, value) => {
    setSaleDrafts((current) => ({
      ...current,
      [order.id]: {
        ...getSaleDraft(order),
        ...current[order.id],
        [field]: value
      }
    }))
  }

  const handleSaveSaleDetails = (order) => {
    const draft = getSaleDraft(order)
    onUpdateOrderDetails(order.id, draft)
  }

  const handleQuickOrderDetails = (order, details, message) => {
    const { status: nextStatus, ...saleDetails } = details
    if (Object.keys(saleDetails).length > 0) {
      onUpdateOrderDetails(order.id, saleDetails)
    }
    if (nextStatus) {
      onUpdateOrderStatus(order.id, nextStatus)
    }
    setSaleDrafts((current) => ({
      ...current,
      [order.id]: {
        ...getSaleDraft(order),
        ...current[order.id],
        ...saleDetails
      }
    }))
    setCopyMessage(message)
  }

  const handleApplyOrderInventory = (order, mode) => {
    if (!Array.isArray(order.cartLines) || order.cartLines.length === 0) {
      setCopyMessage('Este pedido no tiene piezas de carrito para actualizar inventario.')
      return
    }

    const missingProducts = []
    const shouldReduceStock = mode === 'sold' && order.inventoryStatus !== 'sold'

    order.cartLines.forEach((line) => {
      const product = productsList.find((item) => item.slug === line.slug)
      if (!product) {
        missingProducts.push(line.title || line.slug)
        return
      }

      const qty = Number(line.qty) || 1
      const nextAvailability = mode === 'sold' ? 'Vendido' : 'Reservado'
      const nextStock = mode === 'sold'
        ? (shouldReduceStock ? Math.max(0, normalizeProductStock(product.stock) - qty) : normalizeProductStock(product.stock))
        : normalizeProductStock(product.stock)

      onUpdateProduct(product.slug, {
        availability: nextAvailability,
        stock: nextStock
      })
    })

    const nextInventoryStatus = mode === 'sold' ? 'sold' : 'reserved'
    onUpdateOrderDetails(order.id, {
      inventoryStatus: nextInventoryStatus,
      inventoryUpdatedAt: new Date().toISOString()
    })

    setCopyMessage(
      missingProducts.length > 0
        ? `Inventario parcial: no encontré ${missingProducts.join(', ')} en el catálogo.`
        : (mode === 'sold' ? `Piezas de ${order.reference || ''} marcadas como vendidas.` : `Piezas de ${order.reference || ''} reservadas.`)
    )
  }

  const handleExportOrders = (orderList, scopeLabel) => {
    if (orderList.length === 0) {
      setCopyMessage('No hay pedidos para exportar con ese filtro.')
      return
    }

    try {
      const csv = buildOrdersCsv(orderList)
      const dateStamp = new Date().toISOString().slice(0, 10)
      downloadTextFile(csv, `atelier-lumiere-pedidos-${scopeLabel}-${dateStamp}.csv`, 'text/csv;charset=utf-8')
      setCopyMessage(`Pedidos exportados: ${orderList.length}.`)
    } catch {
      setCopyMessage('No se pudo preparar el archivo de pedidos.')
    }
  }

  const handleDownloadOrderSheet = (order) => {
    const safeReference = String(order.reference || order.id || 'pedido')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    downloadTextFile(buildOrderSheetText(order), `atelier-lumiere-ficha-${safeReference}.txt`)
    setCopyMessage(`Ficha ${order.reference || ''} descargada.`)
  }

  const handlePrintOrderSheet = (order) => {
    const printWindow = window.open('', '_blank', 'width=820,height=900')

    if (!printWindow) {
      setCopyMessage('No se pudo abrir la ventana de impresión. Puedes descargar la ficha.')
      return
    }

    const sheetText = buildOrderSheetText(order)
    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha ${order.reference || 'pedido'}</title>
          <style>
            body { font-family: Georgia, serif; color: #2f2722; padding: 32px; line-height: 1.55; }
            pre { white-space: pre-wrap; font: 16px/1.55 Georgia, serif; }
          </style>
        </head>
        <body>
          <pre>${sheetText.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleBusinessSettingChange = (field, value) => {
    setBusinessSettings((current) => ({
      ...current,
      [field]: value
    }))
    setSettingsMessage('')
  }

  const handleSaveBusinessSettings = () => {
    try {
      window.localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(businessSettings))
      setSettingsMessage('Configuración comercial guardada en este equipo.')
    } catch {
      setSettingsMessage('No se pudo guardar la configuración en este navegador.')
    }
  }

  const handleExportLocalMemory = () => {
    try {
      const storage = LOCAL_MEMORY_BLOCKS.reduce((acc, item) => {
        acc[item.key] = readLocalMemoryValue(item.key)
        return acc
      }, {})
      const backup = {
        project: 'Atelier Lumiere',
        exportedAt: new Date().toISOString(),
        storage
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'atelier-lumiere-memoria-local.json'
      link.click()
      URL.revokeObjectURL(url)
      setMemoryMessage('Copia descargada. Es un respaldo local de este navegador.')
    } catch {
      setMemoryMessage('No se pudo preparar la copia en este navegador.')
    }
  }

  const handleClearLocalMemory = (label, keys) => {
    const confirmed = window.confirm(`Vas a limpiar: ${label}. Esta acción solo afecta a la memoria local de este navegador. Quieres continuar?`)
    if (!confirmed) return

    try {
      keys.forEach((key) => window.localStorage.removeItem(key))
      setMemoryTick((current) => current + 1)
      setMemoryMessage(`${label} limpiado en este navegador. Recarga la pagina para ver todos los cambios aplicados.`)
    } catch {
      setMemoryMessage(`No se pudo limpiar ${label.toLowerCase()} en este navegador.`)
    }
  }

  const handleImportLocalMemory = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result || '{}'))
        const storage = backup?.storage

        if (!storage || typeof storage !== 'object') {
          setMemoryMessage('La copia no tiene el formato esperado.')
          return
        }

        const confirmed = window.confirm('Vas a restaurar una copia local. Esto puede sobrescribir carrito, catálogo, pedidos y ajustes guardados en este navegador. Quieres continuar?')
        if (!confirmed) return

        LOCAL_MEMORY_BLOCKS.forEach((item) => {
          if (!Object.prototype.hasOwnProperty.call(storage, item.key)) return

          const value = storage[item.key]
          if (typeof value === 'string') {
            window.localStorage.setItem(item.key, value)
          } else {
            window.localStorage.removeItem(item.key)
          }
        })

        setMemoryTick((current) => current + 1)
        setMemoryMessage('Copia restaurada en este navegador. Recarga la página para aplicar todos los cambios.')
      } catch {
        setMemoryMessage('No se pudo leer esa copia. Revisa que sea el JSON descargado desde esta web.')
      }
    }

    reader.onerror = () => {
      setMemoryMessage('No se pudo abrir el archivo de copia.')
    }

    reader.readAsText(file)
  }

  return (
    <>
      <PageHero
        eyebrow="Gestión privada"
        title="Ventas, pedidos y tienda"
        text="Un acceso interno para revisar solicitudes, ordenar la tienda y preparar la operativa real."
        image={mediaConfig.visualDetailA}
        alt="Mesa de trabajo con hilos y piezas preparadas"
        actions={[
          { label: 'Ver tienda', href: '#/coleccion' },
          { label: 'Volver a acceder', href: '#/acceder', kind: 'secondary' }
        ]}
      />

      <PageSection className="section-block--soft">
        <div className="container management-grid">
          <article className="quote-panel management-access-panel">
            <p className="eyebrow">Propietaria</p>
            <h2>Panel abierto</h2>
            <p>Esta zona queda solo para ti: pedidos, inventario, seguimiento y preparación de la tienda.</p>
            <div className="management-actions">
              <button type="button" className="button button--primary" onClick={scrollToCatalogManager}>Revisar catálogo</button>
              <button type="button" className="button button--secondary" onClick={onSyncOrders} disabled={!user || isSyncing}>
                {isSyncing ? 'Sincronizando...' : 'Sincronizar pedidos'}
              </button>
            </div>
            {!user ? <p className="management-note">Para sincronizar con Firebase, entra con tu cuenta en Acceder.</p> : null}
            {user?.profile?.ownerSource === 'local-config' ? (
              <p className="management-note">Modo propietaria local activo. La gestión se abre en este equipo; para sincronizar todos los pedidos en Firebase falta dejar el rol definitivo en la base de datos.</p>
            ) : null}
            {syncMessage ? <p className="management-note">{syncMessage}</p> : null}
            {copyMessage ? <p className="management-note">{copyMessage}</p> : null}
          </article>

          <div className="management-summary">
            <article className="mini-stat-card">
              <strong>{orders.length}</strong>
              <span>Solicitudes totales</span>
            </article>
            <article className="mini-stat-card">
              <strong>{pendingOrders.length}</strong>
              <span>Pendientes</span>
            </article>
            <article className="mini-stat-card">
              <strong>{catalogReadyCount}</strong>
              <span>Piezas con precio</span>
            </article>
            <article className="mini-stat-card">
              <strong>{pendingSyncCount}</strong>
              <span>Por sincronizar</span>
            </article>
            <article className="mini-stat-card">
              <strong>{paidOrders.length}</strong>
              <span>Pagados</span>
            </article>
            <article className="mini-stat-card">
              <strong>{shippingPendingOrders.length}</strong>
              <span>Por entregar</span>
            </article>
            <article className="mini-stat-card">
              <strong>{productionOrders.length}</strong>
              <span>En producción</span>
            </article>
          </div>

          <article className="quote-panel management-sales-health-panel">
            <div className="management-panel-head">
              <div>
                <p className="eyebrow">Ventas</p>
                <h3>Estado comercial</h3>
              </div>
              <span>{blockedOrders.length}</span>
            </div>
            <div className="management-sales-health-grid">
              <div>
                <strong>{formatEuroAmount(paidTotal)}</strong>
                <span>Cobrado</span>
              </div>
              <div>
                <strong>{formatEuroAmount(signalTotal)}</strong>
                <span>Señales</span>
              </div>
              <div>
                <strong>{formatEuroAmount(pendingTotal)}</strong>
                <span>Pendiente estimado</span>
              </div>
              <div>
                <strong>{readyToSendOrders.length}</strong>
                <span>Listos por entregar</span>
              </div>
            </div>
            {blockedOrders.length > 0 ? (
              <p className="management-note">{blockedOrders.length} pedido(s) abiertos necesitan precio o pago antes de avanzar.</p>
            ) : (
              <p className="management-note">No hay pedidos abiertos bloqueados por precio o pago.</p>
            )}
          </article>

          <article className="quote-panel management-metrics-panel">
            <p className="eyebrow">Métricas del diario</p>
            <h3>Conversión local</h3>
            <p>Variante activa para el botón principal: <strong>{journalVariant}</strong>.</p>
            <ul className="note-list">
              <li>Clicks CTA encargo: {journalMetrics?.journal_order_cta_A ?? 0} (A) / {journalMetrics?.journal_order_cta_B ?? 0} (B)</li>
              <li>Clicks CTA colección: {journalMetrics?.journal_collection_cta ?? 0}</li>
              <li>Solicitudes rápidas enviadas: {journalMetrics?.quick_order_submit ?? 0}</li>
            </ul>
            <button type="button" className="button button--secondary" onClick={resetJournalMetrics}>
              Reiniciar métricas
            </button>
          </article>

          <article className="quote-panel management-inventory-panel">
            <p className="eyebrow">Inventario</p>
            <h3>Estado actual de la tienda</h3>
            <div className="management-status-strip" aria-label="Resumen de inventario">
              <span>Disponible: {productAvailabilityCounts.Disponible ?? 0}</span>
              <span>Reservado: {productAvailabilityCounts.Reservado ?? 0}</span>
              <span>Vendido: {productAvailabilityCounts.Vendido ?? 0}</span>
              <span>Por encargo: {productAvailabilityCounts['Por encargo'] ?? 0}</span>
            </div>
          </article>

          <article className="quote-panel management-storage-panel">
            <p className="eyebrow">Memoria de la web</p>
            <h3>Dónde se guarda cada cosa</h3>
            <p>Ahora mismo hay {localMemoryActiveCount} bloques con datos guardados en este navegador.</p>
            <div className="management-memory-list" aria-live="polite">
              {localMemoryItems.map((item) => (
                <div className="management-memory-item" key={`${item.key}-${memoryTick}`}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                  <span className={`memory-status ${item.hasData ? 'is-filled' : ''}`}>
                    {item.hasData ? item.size : 'Vacío'}
                  </span>
                </div>
              ))}
            </div>
            <div className="management-actions">
              <button type="button" className="button button--primary" onClick={handleExportLocalMemory}>
                Descargar copia
              </button>
              <label className="button button--secondary management-memory-import">
                Restaurar copia
                <input type="file" accept="application/json,.json" onChange={handleImportLocalMemory} />
              </label>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => handleClearLocalMemory('Carrito', [CART_STORAGE_KEY])}
              >
                Vaciar carrito local
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => handleClearLocalMemory('Cambios del catálogo local', [
                  CUSTOM_PRODUCTS_STORAGE_KEY,
                  CATALOG_OVERRIDES_STORAGE_KEY,
                  CATALOG_DELETED_STORAGE_KEY
                ])}
              >
                Reiniciar catálogo local
              </button>
            </div>
            {memoryMessage ? <p className="management-note">{memoryMessage}</p> : null}
            <p className="management-note">Usuarios y acceso ya dependen de Firebase. El siguiente paso grande será mover catálogo y ventas definitivas a Firebase para que no dependan solo de este equipo.</p>
          </article>

          <article className="quote-panel management-payment-panel">
            <p className="eyebrow">Pagos</p>
            <h3>Primera fase de cobro</h3>
            <ul className="note-list">
              <li>Bizum manual para reservas rápidas.</li>
              <li>Transferencia para importes altos o encargos.</li>
              <li>PayPal manual como opción extra para clientas que lo prefieran.</li>
            </ul>
            <p className="management-note">Cuando la compra esté más cerrada, el siguiente paso natural es integrar PayPal o Stripe dentro de la web.</p>
          </article>

          <article className="quote-panel management-business-panel">
            <p className="eyebrow">Configuración comercial</p>
            <h3>Pagos, contacto y entrega</h3>
            <div className="management-status-strip" aria-label="Resumen de configuración comercial">
              <span>Campos activos: {configuredSettingCount}</span>
              <span>Bizum: {businessSettings.bizum ? 'Listo' : 'Pendiente'}</span>
              <span>PayPal: {businessSettings.paypal ? 'Listo' : 'Pendiente'}</span>
            </div>
            <div className="management-settings-form">
              <label>
                Bizum
                <input
                  type="text"
                  value={businessSettings.bizum}
                  onChange={(event) => handleBusinessSettingChange('bizum', event.target.value)}
                  placeholder="Teléfono o alias de Bizum"
                />
              </label>
              <label>
                PayPal
                <input
                  type="text"
                  value={businessSettings.paypal}
                  onChange={(event) => handleBusinessSettingChange('paypal', event.target.value)}
                  placeholder="Correo o enlace de PayPal"
                />
              </label>
              <label>
                Titular transferencia
                <input
                  type="text"
                  value={businessSettings.transferOwner}
                  onChange={(event) => handleBusinessSettingChange('transferOwner', event.target.value)}
                  placeholder="Nombre de la titular"
                />
              </label>
              <label>
                Correo de contacto
                <input
                  type="email"
                  value={businessSettings.contactEmail}
                  onChange={(event) => handleBusinessSettingChange('contactEmail', event.target.value)}
                  placeholder="correo@atelier.com"
                />
              </label>
              <label>
                WhatsApp de contacto
                <input
                  type="text"
                  value={businessSettings.contactWhatsapp}
                  onChange={(event) => handleBusinessSettingChange('contactWhatsapp', event.target.value)}
                  placeholder="+34..."
                />
              </label>
              <label className="management-settings-form__wide">
                Nota de pago
                <textarea
                  rows={3}
                  value={businessSettings.paymentNote}
                  onChange={(event) => handleBusinessSettingChange('paymentNote', event.target.value)}
                  placeholder="Reserva, señal o confirmación de pago"
                />
              </label>
              <label className="management-settings-form__wide">
                Nota de envío
                <textarea
                  rows={3}
                  value={businessSettings.shippingNote}
                  onChange={(event) => handleBusinessSettingChange('shippingNote', event.target.value)}
                  placeholder="Plazos, recogida, embalaje o entrega"
                />
              </label>
              <button type="button" className="button button--primary" onClick={handleSaveBusinessSettings}>
                Guardar configuración
              </button>
            </div>
            {settingsMessage ? <p className="management-note">{settingsMessage}</p> : null}
          </article>

          <article className="quote-panel management-board-panel">
            <div className="management-panel-head">
              <div>
                <p className="eyebrow">Fase 4 · Bandeja</p>
                <h3>Pedidos por estado</h3>
              </div>
              <span>{pendingOrders.length} abiertos</span>
            </div>
            <div className="management-board" aria-label="Bandeja de pedidos por estado">
              {boardOrdersByStatus.map((column) => (
                <section className="management-board-column" key={column.status}>
                  <div className="management-board-column__head">
                    <strong>{column.status}</strong>
                    <span>{statusCounts[column.status] ?? 0}</span>
                  </div>
                  {column.orders.length === 0 ? (
                    <p className="management-board-empty">Sin pedidos</p>
                  ) : (
                    column.orders.map((order) => (
                      <article className="management-board-card" key={`board-${column.status}-${order.id}`}>
                        <strong>{order.reference || 'Sin referencia'}</strong>
                        <span>{order.name || 'Sin nombre'}</span>
                        <small>{getOrderItemsLabel(order)}</small>
                        <div className="management-board-card__meta">
                          <span>{order.finalPrice || 'Sin precio'}</span>
                          <span>{order.paymentStatus || 'Pendiente'}</span>
                        </div>
                        <div className="management-board-card__actions">
                          <button type="button" onClick={() => handleCopyClientMessage(order)}>Mensaje</button>
                          {MANAGEMENT_BOARD_STATUSES.map((status, index) => (
                            status === normalizeOrderStatus(order.status) && MANAGEMENT_BOARD_STATUSES[index + 1] ? (
                              <button
                                type="button"
                                key={`${order.id}-${status}-next`}
                                onClick={() => onUpdateOrderStatus(order.id, MANAGEMENT_BOARD_STATUSES[index + 1])}
                              >
                                Pasar a {MANAGEMENT_BOARD_STATUSES[index + 1]}
                              </button>
                            ) : null
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </section>
              ))}
            </div>
          </article>

          <article className="quote-panel management-alerts-panel">
            <div className="management-panel-head">
              <div>
                <p className="eyebrow">Avisos internos</p>
                <h3>Pedidos que necesitan completar datos</h3>
              </div>
              <span>{orderAlerts.length}</span>
            </div>
            {orderAlerts.length === 0 ? (
              <p>No hay avisos pendientes ahora mismo.</p>
            ) : (
              <div className="management-alert-list">
                {orderAlerts.map(({ order, missing }) => (
                  <div className="management-alert-item" key={`alert-${order.id}`}>
                    <div>
                      <strong>{order.reference || 'Sin referencia'} · {order.name || 'Sin nombre'}</strong>
                      <span>Falta: {missing.join(', ')}</span>
                    </div>
                    <button type="button" className="button button--secondary" onClick={() => handleCopyReference(order.reference)}>
                      Copiar ref.
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>

          <CatalogManagerPanel
            productsList={productsList}
            isVisible
            onUpdateProduct={onUpdateProduct}
            onCreateProduct={onCreateProduct}
            onDeleteProduct={onDeleteProduct}
            onUploadProductImage={onUploadProductImage}
            canUploadCloudImages={canUploadCloudImages}
          />

          <article className="quote-panel management-orders-panel">
            <p className="eyebrow">Ventas y pedidos</p>
            <h3>Seguimiento de solicitudes</h3>
            {orders.length > 0 ? (
              <>
                <div className="management-status-strip" aria-label="Resumen por estado">
                  <span>Recibido: {statusCounts.Recibido ?? 0}</span>
                  <span>Presupuesto: {statusCounts['Presupuesto enviado'] ?? 0}</span>
                  <span>Producción: {statusCounts['En producción'] ?? 0}</span>
                  <span>Listo: {statusCounts['Listo para entregar'] ?? 0}</span>
                  <span>Entregado: {statusCounts.Entregado ?? 0}</span>
                  <span>Pagado: {paidOrders.length}</span>
                  <span>Señal: {signalOrders.length}</span>
                  <span>Pendiente pago: {pendingPaymentOrders.length}</span>
                </div>
                <div className="management-money-strip" aria-label="Resumen de importes">
                  <span>Cobrado: {formatEuroAmount(paidTotal)}</span>
                  <span>Pendiente estimado: {formatEuroAmount(pendingTotal)}</span>
                  <span>Pedidos visibles: {filteredOrders.length}</span>
                </div>
                <div className="management-export-bar">
                  <div>
                    <strong>Exportación comercial</strong>
                    <span>Descarga un CSV para abrirlo en Excel o guardarlo como copia externa.</span>
                  </div>
                  <div className="management-actions">
                    <button type="button" className="button button--secondary" onClick={() => handleExportOrders(filteredOrders, 'filtrados')}>
                      Exportar visibles
                    </button>
                    <button type="button" className="button button--secondary" onClick={() => handleExportOrders(orders, 'todos')}>
                      Exportar todos
                    </button>
                  </div>
                </div>
                <div className="management-filters">
                  <label>
                    Buscar
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Nombre, teléfono o referencia"
                    />
                  </label>
                  <label>
                    Estado
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option value="Todos">Todos</option>
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Pago
                    <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
                      <option value="Todos">Todos</option>
                      {PAYMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Envío
                    <select value={shippingFilter} onChange={(event) => setShippingFilter(event.target.value)}>
                      <option value="Todos">Todos</option>
                      {SHIPPING_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            ) : null}
            {orders.length === 0 ? (
              <p>Aún no hay solicitudes registradas.</p>
            ) : filteredOrders.length === 0 ? (
              <p>No hay pedidos con ese filtro.</p>
            ) : (
              <div className="login-orders-list">
                {filteredOrders.map((order) => (
                  <article key={`management-${order.id}`} className="login-orders-item">
                    <div className="login-orders-item__header">
                      <strong>{order.reference || 'Sin referencia'}</strong>
                      <span className={`order-status-badge order-status-badge--${getOrderStatusClass(normalizeOrderStatus(order.status))}`}>
                        {normalizeOrderStatus(order.status)}
                      </span>
                    </div>
                    <span>{order.name} · {order.whatsapp}</span>
                    <div className="order-summary-chips" aria-label="Resumen del pedido">
                      <span>{getOrderSourceLabel(order.source)}</span>
                      <span>{getOrderItemsLabel(order)}</span>
                      <span>Pago elegido: {order.paymentPreference || 'Por confirmar'}</span>
                      <span>Entrega: {order.deliveryPreference || 'Por confirmar'}</span>
                      <span>Total: {order.finalPrice || 'Pendiente'}</span>
                      {order.inventoryStatus ? <span>Inventario: {order.inventoryStatus === 'sold' ? 'vendido' : 'reservado'}</span> : null}
                      {order.depositAmount ? <span>Señal: {order.depositAmount}</span> : null}
                      {order.paymentMethodUsed ? <span>Pago usado: {order.paymentMethodUsed}</span> : null}
                      {order.shippingCost ? <span>Envío: {order.shippingCost}</span> : null}
                      {order.trackingCode ? <span>Seguimiento: {order.trackingCode}</span> : null}
                    </div>
                    <p>{order.idea}</p>
                    <p className="order-next-step">{getOrderNextStep(order)}</p>
                    {Array.isArray(order.cartLines) && order.cartLines.length > 0 ? (
                      <ul className="management-cart-lines">
                        {order.cartLines.map((line) => (
                          <li key={`management-line-${order.id}-${line.slug || line.title}`}>
                            <span>{line.title || line.slug}</span>
                            <strong>x{line.qty || 1}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <small>{new Date(order.createdAt).toLocaleString('es-ES')}</small>
                    <div className="management-order-actions">
                      <a className="button button--secondary" href={buildOrderWhatsappHref(order)} target="_blank" rel="noreferrer">
                        Contactar
                      </a>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleQuickOrderDetails(order, { paymentStatus: 'Señal recibida' }, `Pedido ${order.reference || ''} marcado con señal.`)}
                      >
                        Señal recibida
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleQuickOrderDetails(order, { paymentStatus: 'Pagado' }, `Pedido ${order.reference || ''} marcado como pagado.`)}
                      >
                        Pagado
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleQuickOrderDetails(order, { shippingStatus: 'Preparando' }, `Envío de ${order.reference || ''} marcado como preparando.`)}
                      >
                        Preparar envío
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => {
                          handleQuickOrderDetails(order, { shippingStatus: 'Entregado', status: 'Entregado' }, `Pedido ${order.reference || ''} marcado como entregado.`)
                          handleApplyOrderInventory(order, 'sold')
                        }}
                      >
                        Entregado
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleApplyOrderInventory(order, 'reserved')}
                      >
                        Reservar piezas
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleApplyOrderInventory(order, 'sold')}
                      >
                        Marcar vendidas
                      </button>
                      <button type="button" className="button button--secondary" onClick={() => handleCopyReference(order.reference)}>
                        Copiar ref.
                      </button>
                      <button type="button" className="button button--secondary" onClick={() => handleCopyClientMessage(order)}>
                        Copiar mensaje
                      </button>
                      <button type="button" className="button button--secondary" onClick={() => handleDownloadOrderSheet(order)}>
                        Descargar ficha
                      </button>
                      <button type="button" className="button button--secondary" onClick={() => handlePrintOrderSheet(order)}>
                        Imprimir
                      </button>
                    </div>
                    <label>
                      Estado
                      <select value={normalizeOrderStatus(order.status)} onChange={(event) => onUpdateOrderStatus(order.id, event.target.value)}>
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <details className="management-sale-card">
                      <summary>Ficha de venta</summary>
                      <div className="management-sale-form">
                        <label>
                          Precio final
                          <input
                            type="text"
                            value={getSaleDraft(order).finalPrice}
                            onChange={(event) => handleSaleDraftChange(order, 'finalPrice', event.target.value)}
                            placeholder="Ej. 120 EUR"
                          />
                        </label>
                        <label>
                          Señal
                          <input
                            type="text"
                            value={getSaleDraft(order).depositAmount}
                            onChange={(event) => handleSaleDraftChange(order, 'depositAmount', event.target.value)}
                            placeholder="Ej. 40 EUR"
                          />
                        </label>
                        <label>
                          Método usado
                          <input
                            type="text"
                            value={getSaleDraft(order).paymentMethodUsed}
                            onChange={(event) => handleSaleDraftChange(order, 'paymentMethodUsed', event.target.value)}
                            placeholder="Bizum, PayPal, transferencia..."
                          />
                        </label>
                        <label>
                          Pago
                          <select
                            value={getSaleDraft(order).paymentStatus}
                            onChange={(event) => handleSaleDraftChange(order, 'paymentStatus', event.target.value)}
                          >
                            {PAYMENT_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Envío
                          <select
                            value={getSaleDraft(order).shippingStatus}
                            onChange={(event) => handleSaleDraftChange(order, 'shippingStatus', event.target.value)}
                          >
                            {SHIPPING_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Coste de envío
                          <input
                            type="text"
                            value={getSaleDraft(order).shippingCost}
                            onChange={(event) => handleSaleDraftChange(order, 'shippingCost', event.target.value)}
                            placeholder="Ej. 6 EUR"
                          />
                        </label>
                        <label>
                          Fecha objetivo
                          <input
                            type="date"
                            value={getSaleDraft(order).targetDate}
                            onChange={(event) => handleSaleDraftChange(order, 'targetDate', event.target.value)}
                          />
                        </label>
                        <label>
                          Seguimiento
                          <input
                            type="text"
                            value={getSaleDraft(order).trackingCode}
                            onChange={(event) => handleSaleDraftChange(order, 'trackingCode', event.target.value)}
                            placeholder="Código o enlace de seguimiento"
                          />
                        </label>
                        <label className="management-sale-form__wide">
                          Dirección de envío
                          <textarea
                            rows={2}
                            value={getSaleDraft(order).shippingAddress}
                            onChange={(event) => handleSaleDraftChange(order, 'shippingAddress', event.target.value)}
                            placeholder="Dirección, código postal, ciudad"
                          />
                        </label>
                        <label className="management-sale-form__wide">
                          Notas internas
                          <textarea
                            rows={3}
                            value={getSaleDraft(order).internalNotes}
                            onChange={(event) => handleSaleDraftChange(order, 'internalNotes', event.target.value)}
                            placeholder="Materiales, medidas, acuerdos o dudas"
                          />
                        </label>
                        <button type="button" className="button button--primary" onClick={() => handleSaveSaleDetails(order)}>
                          Guardar ficha
                        </button>
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </PageSection>
    </>
  )
}

function QuickOrderForm({ onCreateOrder, source = 'orders_quick_form', title = 'Solicitud rápida', intro = 'Déjame una idea y preparo una referencia para seguir el encargo.' }) {
  const [form, setForm] = useState({ name: '', whatsapp: '', idea: '' })
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const whatsapp = form.whatsapp.trim()
    const idea = form.idea.trim()

    if (name.length < 2 || whatsapp.length < 6 || idea.length < 10) {
      setMessage('Completa nombre, contacto y una idea breve para crear la solicitud.')
      return
    }

    const order = onCreateOrder({ name, whatsapp, idea, source })
    setForm({ name: '', whatsapp: '', idea: '' })
    setMessage('Solicitud guardada. Referencia: ' + order.reference + '.')
  }

  return (
    <form className="journal-quick-form" onSubmit={handleSubmit}>
      <h3>{title}</h3>
      <p>{intro}</p>
      <div className="journal-quick-form__grid">
        <label>
          Nombre
          <input type="text" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Tu nombre" />
        </label>
        <label>
          Contacto
          <input type="text" value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="WhatsApp o teléfono" />
        </label>
      </div>
      <label>
        Idea del encargo
        <textarea rows={3} value={form.idea} onChange={(event) => setForm((current) => ({ ...current, idea: event.target.value }))} placeholder="Ejemplo: iniciales, flores, fecha especial o pieza deseada" />
      </label>
      <button type="submit" className="button button--primary">Crear referencia</button>
      {message ? <p className="journal-quick-form__message">{message}</p> : null}
    </form>
  )
}

function OrdersPage({ onCreateOrder }) {
  return (
    <>
      <PageHero
        eyebrow="Encargos personalizados"
        title="Bordamos tu idea"
        text="Nombres, fechas, flores, recuerdos o detalles especiales convertidos en una pieza hecha a mano."
        image={mediaConfig.portrait}
        alt="Creadora bordando una pieza personalizada junto a la ventana"
        videoSrc={mediaConfig.ordersVideoSrc}
        videoLoopEnd={6}
        actions={[
          { label: 'Crear solicitud', href: '#encargo-formulario' },
          { label: 'Ver colección', href: '#/coleccion', kind: 'secondary' }
        ]}
      />

      <PageSection className="section-block--soft">
        <div className="container process-layout">
          <div className="process-copy">
            <div className="section-heading section-heading--compact">
              <p className="eyebrow">Proceso</p>
              <h2>De la idea a la pieza final</h2>
              <p>Un encargo avanza en pocas decisiones claras: idea, boceto, bordado y entrega.</p>
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
            <p className="eyebrow">Para empezar</p>
            <h3>Cuéntame qué quieres bordar</h3>
            <ul className="note-list">
              <li>Tipo de pieza: bolso, cojín, prenda, bastidor o regalo.</li>
              <li>Motivo principal: iniciales, fecha, flores, frase o recuerdo.</li>
              <li>Plazo ideal y cualquier referencia visual que tengas.</li>
            </ul>
          </article>
        </div>
      </PageSection>

      <PageSection id="encargo-formulario" className="section-block--compact-top">
        <div className="container journal-conversion__grid journal-conversion__grid--simple">
          <article className="journal-conversion__card">
            <p className="eyebrow">Solicitud guiada</p>
            <h3>Abre una referencia para tu encargo</h3>
            <p>La solicitud queda guardada para poder revisarla después desde tu acceso.</p>
          </article>
          <QuickOrderForm onCreateOrder={onCreateOrder} source="orders_quick_form" intro="Déjame una idea y crearé una referencia para seguirla con calma." />
        </div>
      </PageSection>
    </>
  )
}

function JournalPage({ onCreateOrder }) {
  return (
    <>
      <section className="collection-hero collection-hero--journal">
        <div className="collection-hero__media">
          <SmartVideo controls={false} autoPlay loop muted poster={mediaConfig.heroPoster} primarySrc={mediaConfig.journalVideo} fallbackSrc={mediaConfig.atelierVideo} />
        </div>
        <div className="collection-hero__veil" />
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy">
            <p className="eyebrow">Diario del taller</p>
            <h2>Proceso, inspiración y piezas en marcha</h2>
            <p>Un cuaderno visual para ver cómo nacen los bordados antes de llegar a la colección.</p>
            <a className="button button--primary" href="#diario-entradas">Ver entradas</a>
          </div>
        </div>
      </section>

      <PageSection id="diario-entradas">
        <div className="container journal-grid journal-grid--large">
          {journalEntries.map((entry) => (
            <article key={entry.slug} className="journal-card journal-card--editorial">
              <img src={entry.image} alt={entry.alt} />
              <div className="journal-card__body">
                <p className="journal-card__meta">{entry.meta}</p>
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
                <a className="text-link" href="#/diario">Leer entrada</a>
              </div>
            </article>
          ))}
        </div>
      </PageSection>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <section className="collection-hero collection-hero--about">
        <div className="collection-hero__media">
          <img src={mediaConfig.portrait} alt="Retrato de la creadora en el atelier" />
        </div>
        <div className="collection-hero__veil" />
        <div className="container collection-hero__grid">
          <div className="collection-hero__copy">
            <p className="eyebrow">Sobre mí</p>
            <h1>La calma también se borda</h1>
            <p>Atelier Lumière nace de trabajar despacio, mirar los detalles y crear piezas que acompañan recuerdos reales.</p>
            <div className="hero-actions">
              <a className="button button--primary" href="#/encargos">Pedir un encargo</a>
              <a className="button button--secondary" href="#/contacto">Contactar</a>
            </div>
          </div>
        </div>
      </section>

      <PageSection>
        <div className="container about-brief">
          <div>
            <p className="eyebrow">Atelier Lumière</p>
            <h2>Una forma de crear pequeña, cuidada y personal</h2>
          </div>
          <ul className="note-list about-brief__notes">
            {aboutNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>
      </PageSection>
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

      <PageSection className="section-block--soft">
        <div className="container info-form-grid">
          <article className="contact-card">
            <p className="eyebrow">Información</p>
            <h3>Escríbeme y cuéntame tu idea</h3>
            <div className="contact-list">
              {contactDetails.map((item) => (
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
              ))}
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
            <button type="button" className="button button--primary">Preparar mensaje</button>
          </form>
        </div>
      </PageSection>
    </>
  )
}

const legalPages = {
  '/aviso-legal': {
    eyebrow: 'Aviso legal',
    title: 'Información del atelier',
    intro: 'Esta página recoge los datos básicos del proyecto y el uso general de la web.',
    sections: [
      {
        title: 'Titularidad',
        text: 'Atelier Lumière es una marca artesanal en preparación. Antes de publicar la tienda definitiva, sustituye este texto por el nombre legal, NIF/CIF, domicilio fiscal y correo de contacto reales.'
      },
      {
        title: 'Uso de la web',
        text: 'El contenido de la web presenta piezas bordadas, encargos personalizados, diario del taller y vías de contacto. Las imágenes, textos y diseños no deben reutilizarse sin autorización.'
      },
      {
        title: 'Contacto',
        text: 'Para cualquier consulta sobre la web, pedidos o encargos, puedes escribir al correo indicado en la página de contacto.'
      }
    ]
  },
  '/privacidad': {
    eyebrow: 'Privacidad',
    title: 'Cómo cuidamos tus datos',
    intro: 'La web solo debe pedir los datos necesarios para responder consultas, gestionar encargos y hacer seguimiento de pedidos.',
    sections: [
      {
        title: 'Datos que se solicitan',
        text: 'Nombre, correo, teléfono de contacto, dirección de envío cuando sea necesaria y detalles del encargo. Estos datos se usan para preparar presupuestos, pedidos y comunicaciones relacionadas.'
      },
      {
        title: 'Cuenta de cliente',
        text: 'Si creas una cuenta, se guarda tu correo y el historial asociado a tus solicitudes. Puedes pedir la revisión o eliminación de tus datos escribiendo al atelier.'
      },
      {
        title: 'Servicios externos',
        text: 'La web puede apoyarse en Firebase para autenticación y base de datos. Antes de lanzar la tienda, conviene revisar la configuración definitiva y añadir los enlaces legales de esos servicios si procede.'
      }
    ]
  },
  '/condiciones': {
    eyebrow: 'Condiciones',
    title: 'Encargos, pagos y envíos',
    intro: 'Estas condiciones ayudan a que cada compra o encargo tenga expectativas claras desde el principio.',
    sections: [
      {
        title: 'Encargos personalizados',
        text: 'Cada encargo se confirma después de revisar idea, materiales, plazo y presupuesto. Las piezas personalizadas pueden requerir una señal antes de empezar el trabajo.'
      },
      {
        title: 'Pagos y disponibilidad',
        text: 'Los precios mostrados pueden variar en piezas a medida según tamaño, técnica y materiales. Una pieza se considera reservada cuando el atelier confirma el pedido y las condiciones acordadas.'
      },
      {
        title: 'Envíos y devoluciones',
        text: 'Los plazos de envío dependen de la producción artesanal y del destino. En piezas personalizadas, las devoluciones deben tratarse caso por caso, salvo defecto o incidencia durante el envío.'
      }
    ]
  }
}

function LegalPage({ page }) {
  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        text={page.intro}
        image={mediaConfig.visualLead}
        alt="Mesa de atelier con materiales preparados"
      />

      <PageSection className="section-block--soft">
        <div className="container legal-layout">
          {page.sections.map((section) => (
            <article key={section.title} className="quote-panel legal-panel">
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </article>
          ))}
          <article className="quote-panel legal-panel legal-panel--note">
            <p className="eyebrow">Pendiente de publicar</p>
            <p>Antes de lanzar la tienda con ventas reales, revisa estos textos con tus datos legales definitivos.</p>
          </article>
        </div>
      </PageSection>
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

        <div className="footer-column footer-legal">
          <h2>Legal</h2>
          <a href="#/aviso-legal">Aviso legal</a>
          <a href="#/privacidad">Privacidad</a>
          <a href="#/condiciones">Condiciones</a>
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
  const [shopProducts, setShopProducts] = useState(() => mergeCatalogProducts(products))
  const [catalogRefreshTick, setCatalogRefreshTick] = useState(0)
  const [orders, setOrders] = useState([])
  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncQueue, setSyncQueue] = useState([])
  const [cartPulse, setCartPulse] = useState(false)

  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0)

  const handleAddToCart = (product) => {
    if (!isProductAvailableForCart(product)) {
      return
    }

    setCartItems((items) => {
      const stock = normalizeProductStock(product.stock)
      const existing = items.find((item) => item.slug === product.slug)
      if (existing) {
        return items.map((item) => (
          item.slug === product.slug ? { ...item, qty: Math.min(stock, item.qty + 1) } : item
        ))
      }
      return [...items, { slug: product.slug, qty: 1 }]
    })
    setCartPulse(true)
  }

  const handleSetCartQuantity = (slug, qty) => {
    setCartItems((items) => items.flatMap((item) => {
      if (item.slug !== slug) return [item]

      const product = shopProducts.find((entry) => entry.slug === slug)
      const stock = normalizeProductStock(product?.stock)
      const nextQty = Math.min(stock, Math.max(0, Number.parseInt(qty, 10) || 0))

      return nextQty > 0 ? [{ ...item, qty: nextQty }] : []
    }))
  }

  const handleRemoveFromCart = (slug) => {
    setCartItems((items) => items.filter((item) => item.slug !== slug))
  }

  const handleUploadCatalogImage = async (file, slug) => {
    const validationError = validateImageFile(file)
    if (validationError) throw new Error(validationError)
    if (!firebaseStorage) throw new Error('Firebase Storage no está configurado todavía.')
    if (authUser?.profile?.role !== 'owner') throw new Error('Solo la propietaria puede subir imágenes del catálogo.')

    const imagePath = buildStorageImagePath(slug, file)
    const reference = storageRef(firebaseStorage, imagePath)
    await uploadBytes(reference, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: authUser.email || 'owner',
        catalogSlug: String(slug || '')
      }
    })
    const url = await getDownloadURL(reference)

    return {
      url,
      storagePath: imagePath,
      message: 'Imagen subida a Firebase Storage y lista para la web publicada.'
    }
  }

  const loadShopProducts = async () => {
    try {
      const response = await fetch(`${resolveAppPath('data/shop-products.json')}?v=${Date.now()}`, {
        cache: 'no-store'
      })
      if (!response.ok) return false
      const payload = await response.json()
      if (Array.isArray(payload.products)) {
        setShopProducts(mergeCatalogProducts(payload.products))
        setCatalogRefreshTick((value) => value + 1)
        return true
      }
      return false
    } catch {
      // Si falla la carga remota, usamos el catálogo local por defecto.
      return false
    }
  }

  const handleUpdateCatalogProduct = (slug, changes) => {
    setShopProducts((items) => {
      const updatedAt = new Date().toISOString()
      const normalizedChanges = { ...changes, updatedAt }
      const nextItems = items.map((product) => (
        product.slug === slug ? normalizeShopProduct({ ...product, ...normalizedChanges }) : product
      ))

      try {
        const overrides = readCatalogOverrides()
        const currentOverride = overrides[slug] || {}
        window.localStorage.setItem(
          CATALOG_OVERRIDES_STORAGE_KEY,
          JSON.stringify({ ...overrides, [slug]: { ...currentOverride, ...normalizedChanges } })
        )
      } catch {
        // Si falla el guardado, al menos se ve actualizado durante la sesión.
      }

      return nextItems
    })
  }

  const handleCreateCatalogProduct = (draft) => {
    const title = draft.title.trim()
    const category = draft.category.trim()
    const price = draft.price.trim()
    const description = draft.description.trim()
    const stock = normalizeProductStock(draft.stock)
    const image = draft.image.trim() || './media/atelier-hero.png'

    if (title.length < 3) {
      return { ok: false, message: 'Escribe un nombre de al menos 3 caracteres.' }
    }

    if (category.length < 2) {
      return { ok: false, message: 'Indica una categoría.' }
    }

    if (!price) {
      return { ok: false, message: 'Indica un precio o escribe Consultar.' }
    }

    const existingSlugs = new Set(shopProducts.map((product) => product.slug))
    const baseSlug = slugifyProductValue(title)
    let slug = baseSlug
    let suffix = 2

    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    const nextProduct = {
      slug,
      title,
      category,
      tag: category,
      badge: 'Nuevo',
      featuredRank: 0,
      price,
      description: description || 'Pieza creada desde el panel de gestión.',
      image,
      alt: title,
      availability: normalizeProductAvailability(draft.availability),
      stock
    }

    try {
      const customProducts = readCustomProducts()
      writeCustomProducts([nextProduct, ...customProducts])
      const deletedSlugs = new Set(readDeletedProductSlugs())
      deletedSlugs.delete(slug)
      writeDeletedProductSlugs(Array.from(deletedSlugs))
      setShopProducts((items) => [normalizeShopProduct(nextProduct), ...items])
      setCatalogRefreshTick((value) => value + 1)
      return { ok: true, message: 'Pieza añadida al catálogo.' }
    } catch {
      return { ok: false, message: 'No se pudo guardar la pieza en este navegador.' }
    }
  }

  const handleDeleteCatalogProduct = (slug) => {
    const product = shopProducts.find((item) => item.slug === slug)
    const confirmed = window.confirm(`¿Retirar "${product?.title || 'esta pieza'}" de la tienda?`)

    if (!confirmed) return

    setShopProducts((items) => items.filter((product) => product.slug !== slug))
    setCartItems((items) => items.filter((item) => item.slug !== slug))

    try {
      const customProducts = readCustomProducts()
      const nextCustomProducts = customProducts.filter((product) => product.slug !== slug)
      writeCustomProducts(nextCustomProducts)

      const deletedSlugs = new Set(readDeletedProductSlugs())
      deletedSlugs.add(slug)
      writeDeletedProductSlugs(Array.from(deletedSlugs))
    } catch {
      // Si falla el guardado, al menos retiramos la pieza durante esta sesión.
    }
  }

  const loadUserProfile = async (user, createIfMissing = false) => {
    if (!firebaseDb || !user?.uid) return null

    const userRef = doc(firebaseDb, 'usuarios', user.uid)
    const snapshot = await getDoc(userRef)

    if (snapshot.exists()) {
      return snapshot.data()
    }

    if (!createIfMissing) {
      return null
    }

    const profilePayload = buildUserProfilePayload(user)
    await setDoc(userRef, profilePayload, { merge: true })
    return profilePayload
  }

  const saveUserProfile = async (user) => {
    if (!firebaseDb || !user?.uid) return null

    const userRef = doc(firebaseDb, 'usuarios', user.uid)
    const snapshot = await getDoc(userRef)
    const baseProfile = snapshot.exists() ? snapshot.data() : buildUserProfilePayload(user)
    const nextProfile = {
      ...baseProfile,
      uid: user.uid,
      email: user.email || '',
      displayName: baseProfile.displayName || user.displayName || user.email?.split('@')[0] || 'Cliente',
      updatedAt: new Date().toISOString()
    }

    if (!baseProfile.createdAt) {
      nextProfile.createdAt = new Date().toISOString()
    }

    await setDoc(userRef, nextProfile, { merge: true })
    return nextProfile
  }

  const enqueueSyncAction = (action) => {
    setSyncQueue((items) => [...items, { id: `sync-${Date.now()}-${Math.random()}`, ...action }])
  }

  const consumeSyncQueue = async (activeUser) => {
    if (syncQueue.length === 0) return
    const pending = []

    for (const action of syncQueue) {
      try {
        if (action.type === 'create') {
          await saveOrderToFirestore(action.order, activeUser)
        } else if (action.type === 'status' && action.order) {
          await patchOrderStatusToFirestore(action.order, activeUser)
        } else if (action.type === 'details' && action.order) {
          await patchOrderDetailsToFirestore(action.order, activeUser)
        }
      } catch {
        pending.push(action)
      }
    }

    setSyncQueue(pending)
  }

  const saveOrderToFirestore = async (order, currentUser) => {
    if (!firebaseDb || !currentUser?.localId) return

    await setDoc(doc(firebaseDb, 'orders', order.id), {
      ...order,
      ownerId: order.ownerId && order.ownerId !== 'guest' ? order.ownerId : currentUser.localId,
      updatedAt: new Date().toISOString()
    }, { merge: true })
  }

  const patchOrderStatusToFirestore = async (order, currentUser) => {
    if (!firebaseDb || !currentUser?.localId) return

    await updateDoc(doc(firebaseDb, 'orders', order.id), {
      status: order.status,
      updatedAt: new Date().toISOString()
    })
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  const patchOrderDetailsToFirestore = async (order, currentUser) => {
    if (!firebaseDb || !currentUser?.localId) return

    await setDoc(doc(firebaseDb, 'orders', order.id), {
      finalPrice: order.finalPrice || '',
      depositAmount: order.depositAmount || '',
      paymentMethodUsed: order.paymentMethodUsed || '',
      paymentStatus: order.paymentStatus || 'Pendiente',
      shippingStatus: order.shippingStatus || 'Sin preparar',
      shippingCost: order.shippingCost || '',
      trackingCode: order.trackingCode || '',
      targetDate: order.targetDate || '',
      shippingAddress: order.shippingAddress || '',
      internalNotes: order.internalNotes || '',
      inventoryStatus: order.inventoryStatus || '',
      inventoryUpdatedAt: order.inventoryUpdatedAt || '',
      updatedAt: new Date().toISOString()
    }, { merge: true })
  }

  const fetchOrdersFromFirestore = async (currentUser) => {
    if (!firebaseDb || !currentUser?.localId) return []

    const canReadAllOrders = currentUser?.profile?.role === 'owner'
      && currentUser?.profile?.ownerSource !== 'local-config'
    const ordersQuery = canReadAllOrders
      ? query(collection(firebaseDb, 'orders'), limit(200))
      : query(
        collection(firebaseDb, 'orders'),
        where('ownerId', '==', currentUser.localId),
        limit(100)
      )

    const snapshot = await getDocs(ordersQuery)

    return snapshot.docs
      .map((orderDoc) => normalizeOrderRecord(orderDoc.id, orderDoc.data()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const handleLogin = async (email, password) => {
    if (!isFirebaseConfigured || !firebaseAuth) return
    setAuthError('')
    setAuthMessage('')
    setAuthReady(false)
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence)
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
      const profile = await loadUserProfile(credential.user, true)
      setAuthUser(buildAuthUserState(credential.user, profile))
      setAuthMessage('Sesión iniciada correctamente.')
    } catch (error) {
      setAuthError(normalizeFirebaseErrorMessage(error?.code || error?.message))
    } finally {
      setAuthReady(true)
    }
  }

  const handleRegister = async (email, password) => {
    if (!isFirebaseConfigured || !firebaseAuth) return
    setAuthError('')
    setAuthMessage('')
    setAuthReady(false)
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence)
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)
      const profile = await saveUserProfile(credential.user)
      setAuthUser(buildAuthUserState(credential.user, profile))
      setAuthMessage('Cuenta creada correctamente.')
    } catch (error) {
      setAuthError(normalizeFirebaseErrorMessage(error?.code || error?.message))
    } finally {
      setAuthReady(true)
    }
  }

  const handleLogout = async () => {
    setAuthError('')
    setAuthMessage('')
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth)
      }
    } catch (error) {
      setAuthError(normalizeFirebaseErrorMessage(error?.code || error?.message))
      return
    }
    setAuthUser(null)
    setAuthMessage('Sesión cerrada.')
  }

  const handleCreateOrder = (orderDraft) => {
    const reference = `AL-${Math.floor(1000 + Math.random() * 9000)}`
    const nextOrder = {
      id: `order-${Date.now()}`,
      reference,
      status: 'Recibido',
      createdAt: new Date().toISOString(),
      ownerId: authUser?.localId || 'guest',
      customerEmail: '',
      paymentPreference: 'Por confirmar',
      deliveryPreference: 'Por confirmar',
      ...orderDraft
    }
    setOrders((items) => [nextOrder, ...items])
    if (authUser) {
      saveOrderToFirestore(nextOrder, authUser).catch(() => {
        enqueueSyncAction({ type: 'create', order: nextOrder })
      })
    } else {
      enqueueSyncAction({ type: 'create', order: nextOrder })
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
          patchOrderStatusToFirestore(changed, authUser).catch(() => {
            enqueueSyncAction({ type: 'status', order: changed })
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
    if (!firebaseDb) {
      setSyncMessage('Firebase no está disponible para sincronizar pedidos.')
      return
    }
    setIsSyncing(true)
    setSyncMessage('')

    try {
      await consumeSyncQueue(authUser)
      for (const order of orders) {
        await saveOrderToFirestore(order, authUser)
      }
      const remoteOrders = await fetchOrdersFromFirestore(authUser)
      setOrders((items) => mergeOrdersById(items, remoteOrders))
      setSyncMessage('Pedidos sincronizados con Firebase correctamente.')
    } catch (error) {
      setSyncMessage(normalizeFirebaseErrorMessage(error?.code || error?.message))
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUpdateOrderDetails = (orderId, details) => {
    setOrders((items) => {
      const updated = items.map((order) => (
        order.id === orderId ? { ...order, ...details, updatedAt: new Date().toISOString() } : order
      ))
      const changed = updated.find((order) => order.id === orderId)
      if (changed) {
        if (authUser) {
          patchOrderDetailsToFirestore(changed, authUser).catch(() => {
            enqueueSyncAction({ type: 'details', order: changed })
          })
        } else {
          enqueueSyncAction({ type: 'details', order: changed })
        }
      }
      return updated
    })
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
      const savedQueue = window.localStorage.getItem(ORDERS_SYNC_QUEUE_KEY)
      if (!savedQueue) return
      const parsed = JSON.parse(savedQueue)
      if (!Array.isArray(parsed)) return
      setSyncQueue(parsed)
    } catch {
      // Si falla lectura, seguimos sin cola de sincronización.
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
    if (!cartPulse) return undefined
    const timeoutId = window.setTimeout(() => setCartPulse(false), 720)
    return () => window.clearTimeout(timeoutId)
  }, [cartPulse])

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    } catch {
      // Si falla guardado, pedidos siguen en memoria.
    }
  }, [orders])

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_SYNC_QUEUE_KEY, JSON.stringify(syncQueue))
    } catch {
      // Si falla guardado, cola sigue en memoria.
    }
  }, [syncQueue])

  useEffect(() => {
    const onOnline = () => {
      if (authUser && syncQueue.length > 0) {
        handleSyncOrders()
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [authUser, syncQueue.length])

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
    if (!isFirebaseConfigured || !firebaseAuth) {
      setAuthReady(true)
      return undefined
    }

    let isMounted = true
    setAuthReady(false)

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!isMounted) return

      if (!user) {
        setAuthUser(null)
        setAuthReady(true)
        return
      }

      try {
        const profile = await loadUserProfile(user, true)
        const nextAuthUser = buildAuthUserState(user, profile)
        const remoteOrders = await fetchOrdersFromFirestore(nextAuthUser)

        if (!isMounted) return

        setAuthError('')
        setAuthUser(nextAuthUser)
        setOrders((items) => mergeOrdersById(items, remoteOrders))
      } catch (error) {
        if (!isMounted) return

        setAuthUser(buildAuthUserState(user))
        setAuthError(normalizeFirebaseErrorMessage(error?.code || error?.message))
      } finally {
        if (isMounted) {
          setAuthReady(true)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    loadShopProducts()
  }, [])

  useEffect(() => {
    document.title = routeTitles[route] || 'Atelier Lumière'
  }, [route])

  const canAccessManagement = Boolean(authUser?.profile?.role === 'owner')
  let page = <HomePage productsList={shopProducts} />
  if (route === '/coleccion') page = <CollectionPage onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/producto') page = <ProductPage onAddToCart={handleAddToCart} productsList={shopProducts} />
  if (route === '/carrito') {
    page = (
      <CartPage
        cartItems={cartItems}
        onAddToCart={handleAddToCart}
        onSetCartQuantity={handleSetCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onCreateOrder={handleCreateOrder}
        onClearCart={handleClearCart}
        productsList={shopProducts}
      />
    )
  }
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
        onUpdateOrderDetails={handleUpdateOrderDetails}
        onSyncOrders={handleSyncOrders}
        syncMessage={syncMessage}
        isSyncing={isSyncing}
        pendingSyncCount={syncQueue.length}
        ownerAccessRequired={false}
      />
    )
  }
  if (route === '/encargos') page = <OrdersPage onCreateOrder={handleCreateOrder} />
  if (route === '/diario') page = <JournalPage onCreateOrder={handleCreateOrder} />
  if (route === '/gestion') {
    page = canAccessManagement ? (
      <ManagementPage
        user={authUser}
        orders={orders}
        productsList={shopProducts}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateOrderDetails={handleUpdateOrderDetails}
        onSyncOrders={handleSyncOrders}
        syncMessage={syncMessage}
        isSyncing={isSyncing}
        pendingSyncCount={syncQueue.length}
        onRefreshCatalog={loadShopProducts}
        onUpdateProduct={handleUpdateCatalogProduct}
        onCreateProduct={handleCreateCatalogProduct}
        onDeleteProduct={handleDeleteCatalogProduct}
        onUploadProductImage={handleUploadCatalogImage}
        canUploadCloudImages={Boolean(firebaseStorage && authUser?.profile?.role === 'owner')}
      />
    ) : (
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
        onUpdateOrderDetails={handleUpdateOrderDetails}
        onSyncOrders={handleSyncOrders}
        syncMessage={syncMessage}
        isSyncing={isSyncing}
        pendingSyncCount={syncQueue.length}
        ownerAccessRequired={true}
      />
    )
  }

  if (route === '/sobre-mi') page = <AboutPage />
  if (route === '/contacto') page = <ContactPage />
  if (route === '/aviso-legal' || route === '/privacidad' || route === '/condiciones') {
    page = <LegalPage page={legalPages[route]} />
  }

  return (
    <div className={`page-shell ${getRouteClass(route)}`}>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <Header isScrolled={isScrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} route={route} cartCount={cartCount} cartPulse={cartPulse} />
      <main id="main-content" data-catalog-refresh={catalogRefreshTick}>{page}</main>
      <Footer />
    </div>
  )
}
