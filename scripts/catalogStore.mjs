import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(repoRoot, 'public')
const catalogFile = path.join(publicDir, 'data', 'shop-products.json')
const uploadsDir = path.join(publicDir, 'uploads')
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const DEFAULT_VIDEO_POSTER = './media/atelier-hero.png'
const PRODUCT_AVAILABILITY_OPTIONS = new Set(['Disponible', 'Reservado', 'Vendido', 'Por encargo'])

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg'])

const ensureCatalogShape = (payload) => ({
  products: Array.isArray(payload?.products) ? payload.products : []
})

const slugify = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || `pieza-${Date.now()}`

const extensionFromMimeType = (mimeType) => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    case 'video/mp4':
      return '.mp4'
    case 'video/webm':
      return '.webm'
    case 'video/ogg':
      return '.ogv'
    default:
      return ''
  }
}

const parseDataUrl = (value) => {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(String(value ?? ''))
  if (!match) {
    throw Object.assign(new Error('Formato de archivo no valido.'), { statusCode: 400 })
  }

  const mimeType = match[1]
  const buffer = Buffer.from(match[2], 'base64')

  return {
    mimeType,
    buffer
  }
}

const assertValidCatalogInput = (input, isEditing) => {
  if (!input?.title || input.title.trim().length < 3) {
    throw Object.assign(new Error('Escribe un titulo de al menos 3 caracteres.'), { statusCode: 400 })
  }

  if (!input?.price || !/^\d+(?:[.,]\d{1,2})?\s?\u20ac?$/.test(input.price.trim())) {
    throw Object.assign(new Error('Usa un precio valido. Ejemplo: 120 o 120 EUR.'), { statusCode: 400 })
  }

  if (!input?.category || input.category.trim().length < 2) {
    throw Object.assign(new Error('Indica una categoria valida.'), { statusCode: 400 })
  }

  if (input?.description && input.description.trim().length > 240) {
    throw Object.assign(new Error('La descripcion no puede superar 240 caracteres.'), { statusCode: 400 })
  }

  if (input?.availability && !PRODUCT_AVAILABILITY_OPTIONS.has(input.availability)) {
    throw Object.assign(new Error('Indica una disponibilidad valida.'), { statusCode: 400 })
  }

  if (!isEditing && !input?.file) {
    throw Object.assign(new Error('Selecciona una imagen o un video.'), { statusCode: 400 })
  }
}

const saveUploadAsset = async (file, preferredName) => {
  if (!file?.dataUrl) return null

  const { mimeType, buffer } = parseDataUrl(file.dataUrl)
  const isImage = IMAGE_MIME_TYPES.has(mimeType)
  const isVideo = VIDEO_MIME_TYPES.has(mimeType)

  if (!isImage && !isVideo) {
    throw Object.assign(new Error('Solo se permiten imagenes o videos compatibles.'), { statusCode: 400 })
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw Object.assign(new Error('El archivo no puede superar 15 MB.'), { statusCode: 400 })
  }

  await mkdir(uploadsDir, { recursive: true })

  const originalName = path.parse(file.name || preferredName || 'catalogo').name
  const safeBaseName = slugify(originalName || preferredName)
  const extension = extensionFromMimeType(mimeType)
  const fileName = `${safeBaseName}-${Date.now()}${extension}`
  const absolutePath = path.join(uploadsDir, fileName)

  await writeFile(absolutePath, buffer)

  return {
    publicPath: `./uploads/${fileName}`,
    mediaType: isVideo ? 'video' : 'image'
  }
}

export const readCatalogStore = async () => {
  try {
    const raw = await readFile(catalogFile, 'utf8')
    return ensureCatalogShape(JSON.parse(raw))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { products: [] }
    }

    throw error
  }
}

export const writeCatalogStore = async (products) => {
  await mkdir(path.dirname(catalogFile), { recursive: true })
  const payload = JSON.stringify({ products }, null, 2) + '\n'
  await writeFile(catalogFile, payload, 'utf8')
  return { products }
}

export const upsertCatalogProduct = async (input) => {
  const catalog = await readCatalogStore()
  const existingIndex = input?.existingSlug
    ? catalog.products.findIndex((product) => product.slug === input.existingSlug)
    : -1
  const existingProduct = existingIndex >= 0 ? catalog.products[existingIndex] : null

  if (input?.existingSlug && !existingProduct) {
    throw Object.assign(new Error('La pieza a editar ya no existe en el catalogo.'), { statusCode: 404 })
  }

  assertValidCatalogInput(input, Boolean(existingProduct))

  const savedAsset = await saveUploadAsset(input.file, existingProduct?.slug || input.title)
  const slug = existingProduct?.slug || slugify(input.title)
  const nextProduct = {
    ...(existingProduct ?? {}),
    slug,
    title: input.title.trim(),
    category: input.category.trim(),
    tag: input.category.trim(),
    badge: existingProduct?.badge ?? 'Nuevo',
    featuredRank: existingProduct?.featuredRank ?? 0,
    price: input.price.trim(),
    availability: input.availability || existingProduct?.availability || 'Disponible',
    description: input.description?.trim() || 'Pieza subida desde tu ordenador.',
    alt: input.title.trim()
  }

  if (savedAsset?.mediaType === 'video') {
    nextProduct.video = savedAsset.publicPath
    nextProduct.image = existingProduct?.image || DEFAULT_VIDEO_POSTER
  } else if (savedAsset?.mediaType === 'image') {
    nextProduct.image = savedAsset.publicPath
    delete nextProduct.video
  } else if (!nextProduct.image) {
    nextProduct.image = DEFAULT_VIDEO_POSTER
  }

  const nextProducts = [...catalog.products]

  if (existingIndex >= 0) {
    nextProducts[existingIndex] = nextProduct
  } else {
    nextProducts.unshift(nextProduct)
  }

  await writeCatalogStore(nextProducts)

  return {
    product: nextProduct,
    products: nextProducts
  }
}

export const deleteCatalogProduct = async (slug) => {
  const catalog = await readCatalogStore()
  const nextProducts = catalog.products.filter((product) => product.slug !== slug)

  if (nextProducts.length === catalog.products.length) {
    throw Object.assign(new Error('La pieza ya no existe en el catalogo.'), { statusCode: 404 })
  }

  await writeCatalogStore(nextProducts)

  return {
    products: nextProducts
  }
}
