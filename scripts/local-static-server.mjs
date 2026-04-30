import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { createServer } from 'node:http'

const rootDir = resolve(process.argv[2] || 'dist')
const host = process.argv[3] || '127.0.0.1'
const port = Number.parseInt(process.argv[4] || '4173', 10)

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
}

const safePathFromUrl = (requestUrl = '/') => {
  const [pathname] = requestUrl.split('?')
  const decodedPath = decodeURIComponent(pathname)
  const relativePath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '')
  return join(rootDir, relativePath === '/' ? 'index.html' : relativePath)
}

const resolveFilePath = (requestUrl) => {
  const directPath = safePathFromUrl(requestUrl)
  if (existsSync(directPath) && statSync(directPath).isFile()) return directPath

  const htmlPath = `${directPath}.html`
  if (existsSync(htmlPath) && statSync(htmlPath).isFile()) return htmlPath

  const nestedIndexPath = join(directPath, 'index.html')
  if (existsSync(nestedIndexPath) && statSync(nestedIndexPath).isFile()) return nestedIndexPath

  return join(rootDir, 'index.html')
}

const server = createServer((request, response) => {
  try {
    const filePath = resolveFilePath(request.url)
    const extension = extname(filePath).toLowerCase()
    const contentType = mimeTypes[extension] || 'application/octet-stream'

    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    })

    createReadStream(filePath).pipe(response)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(`Server error: ${error.message}`)
  }
})

server.listen(port, host, () => {
  console.log(`Local static server running at http://${host}:${port}`)
  console.log(`Serving ${rootDir}`)
})
