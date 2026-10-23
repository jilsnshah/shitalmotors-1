// Production server: serves the built site from dist/ and the /api routes.
// Run with `npm start` after `npm run build`.
import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import { handleApi } from './api.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const port = Number(process.env.PORT) || 4173

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt'])

async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  let file = path.join(root, decodeURIComponent(url.pathname))
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  let info = await stat(file).catch(() => null)
  if (info?.isDirectory()) {
    file = path.join(file, 'index.html')
    info = await stat(file).catch(() => null)
  }
  // SPA fallback for client routes such as /models/thar-roxx
  if (!info && !path.extname(file)) {
    file = path.join(root, 'index.html')
    info = await stat(file).catch(() => null)
  }
  if (!info) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
    return
  }
  const ext = path.extname(file)
  const immutable = url.pathname.startsWith('/assets/')
  const headers: Record<string, string> = {
    'content-type': TYPES[ext] ?? 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    'x-content-type-options': 'nosniff',
  }
  const accepts = String(req.headers['accept-encoding'] ?? '')
  if (COMPRESSIBLE.has(ext) && /\bbr\b/.test(accepts)) {
    res.writeHead(200, { ...headers, 'content-encoding': 'br', vary: 'accept-encoding' })
    createReadStream(file).pipe(zlib.createBrotliCompress()).pipe(res)
  } else if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(accepts)) {
    res.writeHead(200, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' })
    createReadStream(file).pipe(zlib.createGzip()).pipe(res)
  } else {
    res.writeHead(200, { ...headers, 'content-length': String(info.size) })
    createReadStream(file).pipe(res)
  }
}

http
  .createServer(async (req, res) => {
    if (await handleApi(req, res)) return
    await serveStatic(req, res)
  })
  .listen(port, () => {
    const mode = process.env.ANTHROPIC_API_KEY ? 'live (Claude)' : 'offline (built-in answers)'
    console.log(`Shital Motors running at http://localhost:${port} — concierge: ${mode}`)
  })
