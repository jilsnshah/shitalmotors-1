// HTTP handlers shared by the Vite dev server (via middleware) and the production server.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '../src/lib/concierge/knowledge.ts'
import { answerLocally } from '../src/lib/concierge/local.ts'
import { COMMERCIAL, MODELS } from '../src/data/models.generated.ts'
import { OUTLETS } from '../src/data/business.ts'

const MODEL = process.env.CHAT_MODEL || 'claude-opus-5-5'
const SYSTEM_PROMPT = buildSystemPrompt()
const MAX_TURNS = 12
const MAX_CHARS = 1200

let client: Anthropic | null = null
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 })
  return client
}

// Small in-memory rate limiter: 20 requests per minute per IP.
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 20
}

async function readJson(req: IncomingMessage, limit = 32_000): Promise<unknown> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > limit) throw new Error('payload too large')
    chunks.push(chunk as Buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

interface ChatBody {
  messages?: { role: string; content: string }[]
  context?: { section?: string; modelSlug?: string; path?: string }
}

function sanitize(body: ChatBody): Anthropic.Beta.Messages.BetaMessageParam[] {
  const raw = Array.isArray(body.messages) ? body.messages : []
  const msgs = raw
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, MAX_CHARS) }))
  while (msgs.length && msgs[0].role !== 'user') msgs.shift()
  return msgs
}

function contextNote(ctx: ChatBody['context']): string {
  const parts: string[] = []
  const section = ctx?.section?.replace(/[^a-z-]/g, '').slice(0, 24)
  if (section) parts.push(`The visitor is currently looking at the "${section}" part of the page.`)
  const model = MODELS.find((m) => m.slug === ctx?.modelSlug)
  if (model) parts.push(`They are on the ${model.fullName} page; "it" or "this" likely refers to that model.`)
  return parts.join(' ')
}

async function handleChat(req: IncomingMessage, res: ServerResponse) {
  const body = (await readJson(req)) as ChatBody
  const messages = sanitize(body)
  const last = messages.at(-1)
  if (!last || last.role !== 'user') return json(res, 400, { error: 'A user message is required.' })

  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local'
  const writeHead = (mode: 'live' | 'offline') =>
    res.writeHead(200, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-concierge-mode': mode,
      'x-accel-buffering': 'no',
    })

  const offline = () => {
    writeHead('offline')
    res.end(answerLocally(last.content as string, { section: body.context?.section, modelSlug: body.context?.modelSlug }))
  }

  const anthropic = getClient()
  if (!anthropic || limited(ip)) return offline()

  const note = contextNote(body.context)
  const params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    // Page context rides in a mid-conversation system message so the cached prefix stays stable.
    messages: note ? [...messages, { role: 'system', content: note }] : messages,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  }

  let started = false
  const abort = new AbortController()
  res.on('close', () => abort.abort())
  try {
    const stream = anthropic.beta.messages.stream(params, { signal: abort.signal })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        if (!started) {
          writeHead('live')
          started = true
        }
        res.write(event.delta.text)
      }
    }
    const final = await stream.finalMessage()
    if (!started) {
      if (final.stop_reason === 'refusal') {
        writeHead('live')
        res.end("I can't help with that one, but I'm happy to answer questions about our vehicles, showrooms or service.")
        return
      }
      return offline()
    }
    res.end()
  } catch (err) {
    if (abort.signal.aborted) return
    if (err instanceof Anthropic.APIError) console.error(`[concierge] API error ${err.status}: ${err.message}`)
    else console.error('[concierge] request failed:', err)
    if (!started) return offline()
    res.end('\n\n(Connection interrupted — please ask again.)')
  }
}

const LEADS_FILE = path.resolve(process.cwd(), 'data/leads.ndjson')

async function handleLead(req: IncomingMessage, res: ServerResponse) {
  const b = (await readJson(req, 8_000)) as Record<string, unknown>
  const str = (k: string, max = 120) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '')
  const lead = {
    type: str('type', 20) || 'test-drive',
    name: str('name', 80),
    phone: str('phone', 20).replace(/[^\d+]/g, ''),
    model: str('model', 40),
    outlet: str('outlet', 40),
    date: str('date', 20),
    note: str('note', 500),
    receivedAt: new Date().toISOString(),
  }
  if (lead.name.length < 2 || !/^(\+?91)?[6-9]\d{9}$/.test(lead.phone)) return json(res, 422, { error: 'Please share your name and a valid 10-digit mobile number.' })
  if (lead.model && ![...MODELS, ...COMMERCIAL].some((m) => m.slug === lead.model)) lead.model = ''
  if (lead.outlet && !OUTLETS.some((o) => o.id === lead.outlet)) lead.outlet = ''
  await mkdir(path.dirname(LEADS_FILE), { recursive: true })
  await appendFile(LEADS_FILE, JSON.stringify(lead) + '\n')
  json(res, 200, { ok: true })
}

/** Returns true when the request was an /api route and has been handled. */
export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return false
  try {
    if (url.pathname === '/api/health') json(res, 200, { ok: true, concierge: getClient() ? 'live' : 'offline' })
    else if (url.pathname === '/api/chat' && req.method === 'POST') await handleChat(req, res)
    else if (url.pathname === '/api/lead' && req.method === 'POST') await handleLead(req, res)
    else json(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('[api]', err)
    if (!res.headersSent) json(res, 400, { error: 'Bad request' })
    else res.end()
  }
  return true
}
