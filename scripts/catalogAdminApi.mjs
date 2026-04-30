import { deleteCatalogProduct, readCatalogStore, upsertCatalogProduct } from './catalogStore.mjs'

const readJsonBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')

  if (!rawBody) return {}

  try {
    return JSON.parse(rawBody)
  } catch {
    throw Object.assign(new Error('El cuerpo JSON no es valido.'), { statusCode: 400 })
  }
}

const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

export const createCatalogAdminPlugin = () => ({
  name: 'catalog-admin-api',
  configureServer(server) {
    server.middlewares.use('/__catalog', async (request, response, next) => {
      const url = new URL(request.url || '/', 'http://localhost')

      try {
        if (request.method === 'GET' && url.pathname === '/status') {
          sendJson(response, 200, { available: true })
          return
        }

        if (request.method === 'GET' && url.pathname === '/products') {
          const catalog = await readCatalogStore()
          sendJson(response, 200, catalog)
          return
        }

        if (request.method === 'POST' && url.pathname === '/product') {
          const body = await readJsonBody(request)
          const result = await upsertCatalogProduct(body)
          sendJson(response, 200, result)
          return
        }

        if (request.method === 'DELETE' && url.pathname.startsWith('/product/')) {
          const slug = decodeURIComponent(url.pathname.slice('/product/'.length))
          const result = await deleteCatalogProduct(slug)
          sendJson(response, 200, result)
          return
        }
      } catch (error) {
        sendJson(response, error?.statusCode || 500, {
          error: error?.message || 'No se pudo procesar el catalogo.'
        })
        return
      }

      next()
    })
  }
})
