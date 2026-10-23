import { answerLocally } from '../../lib/concierge/local.ts'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type Mode = 'live' | 'offline'

/**
 * Streams a reply from /api/chat. Falls back to the built-in answer engine when the
 * endpoint is missing (static hosting) or unreachable, so the concierge always responds.
 */
export async function streamReply(
  messages: ChatMessage[],
  context: { section?: string; modelSlug?: string },
  onText: (full: string) => void,
  signal: AbortSignal,
): Promise<Mode> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages, context }),
      signal,
    })
  } catch (err) {
    if (signal.aborted) throw err
    return fallback()
  }
  if (!res.ok || !res.body || !(res.headers.get('content-type') ?? '').startsWith('text/plain')) return fallback()

  const mode = (res.headers.get('x-concierge-mode') as Mode) ?? 'live'
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    full += decoder.decode(value, { stream: true })
    onText(full)
  }
  full += decoder.decode()
  onText(full)
  return mode

  async function fallback(): Promise<Mode> {
    // A short pause so the reply doesn't flash in before the typing indicator registers.
    await new Promise((r) => setTimeout(r, 350))
    onText(answerLocally(lastUser, context))
    return 'offline'
  }
}

export interface Action {
  kind: 'model' | 'testdrive' | 'outlet' | 'call' | 'section'
  value: string
}

const TOKEN = /\[\[(model|testdrive|outlet|call|section):([a-z0-9-]*)\]\]/g

/** Splits a reply into display text and action chips; hides a token still being streamed. */
export function parseReply(text: string): { body: string; actions: Action[] } {
  const actions: Action[] = []
  const seen = new Set<string>()
  let body = text.replace(TOKEN, (_, kind: Action['kind'], value: string) => {
    const key = `${kind}:${value}`
    if (!seen.has(key)) {
      seen.add(key)
      actions.push({ kind, value })
    }
    return ''
  })
  body = body.replace(/\[\[[^\]]*$/, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return { body, actions }
}
