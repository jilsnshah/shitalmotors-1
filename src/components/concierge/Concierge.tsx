import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MODELS, COMMERCIAL } from '../../data/models.generated.ts'
import { OUTLETS, formatPhone, telHref } from '../../data/business.ts'
import { openTestDrive, ui, useUI } from '../../lib/store.ts'
import { useSectionLink } from '../Header.tsx'
import { useMediaQuery } from '../../lib/hooks.ts'
import { lockScroll } from '../../lib/scroll.ts'
import { Icon } from '../primitives.tsx'
import { parseReply, streamReply, type Action, type ChatMessage, type Mode } from './client.ts'

const STORE_KEY = 'sm-concierge'

function suggestionsFor(section: string, modelSlug?: string): string[] {
  const m = MODELS.find((x) => x.slug === modelSlug)
  if (m) return [`${m.name} variants and prices`, `What colours does the ${m.name} come in?`, `Book a ${m.name} test drive`]
  switch (section) {
    case 'lineup':
      return ['Compare Thar ROXX and Scorpio', 'SUVs under ₹10 lakh', 'Which SUVs come with automatic?']
    case 'electric':
      return ['Which eSUV has the longest range?', 'XEV 9e prices', 'Compare XEV 9e and XEV 9S']
    case 'commercial':
      return ['Pick-ups and their prices', 'Which Supro models run on CNG?', 'Get a quote for a pick-up']
    case 'service':
      return ['Book a service', 'What is Qwik Service?', 'Tell me about Roadside Assistance']
    case 'network':
      return ['Which showrooms open on Sunday?', 'Nearest workshop to Bopal', 'Surendranagar showroom address']
    case 'stories':
      return ['How long have you been a Mahindra dealer?', 'Where can I take delivery?', 'Book a test drive']
    default:
      return ['Which SUV fits a ₹12 lakh budget?', 'Where is your nearest showroom?', 'Show me the electric SUVs']
  }
}

function actionLabel(a: Action): string | null {
  switch (a.kind) {
    case 'model': {
      const m = MODELS.find((x) => x.slug === a.value)
      return m ? `View ${m.name}` : null
    }
    case 'testdrive': {
      const m = MODELS.find((x) => x.slug === a.value)
      return m ? `Test drive the ${m.name}` : 'Book a test drive'
    }
    case 'outlet': {
      const o = OUTLETS.find((x) => x.id === a.value)
      return o ? `Show ${o.name} ${o.kind}` : null
    }
    case 'call':
      return /^\d{10}$/.test(a.value) ? `Call ${formatPhone(a.value)}` : null
    case 'section':
      return (
        { lineup: 'See SUV line-up', electric: 'See electric SUVs', commercial: 'See commercial vehicles', service: 'Service options', network: 'Open the map', stories: 'Customer stories', visit: 'Visit a showroom' } as Record<string, string>
      )[a.value] ?? null
  }
}

function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/)
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter(Boolean)
        const bullets = lines.filter((l) => /^\s*([•\-*]|\d+\.)\s+/.test(l))
        if (bullets.length >= 2 && bullets.length >= lines.length - 1) {
          const lead = lines.length > bullets.length ? lines[0] : null
          return (
            <div key={i}>
              {lead && <p>{lead}</p>}
              <ul>
                {bullets.map((l, k) => (
                  <li key={k}>{l.replace(/^\s*([•\-*]|\d+\.)\s+/, '')}</li>
                ))}
              </ul>
            </div>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, k) => (
              <span key={k}>
                {k > 0 && <br />}
                {l}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}

export default function Concierge() {
  const open = useUI((s) => s.conciergeOpen)
  const ask = useUI((s) => s.conciergeAsk)
  const section = useUI((s) => s.section)
  const sheetOpen = useUI((s) => s.testDrive.open)
  const menuOpen = useUI((s) => s.menuOpen)
  const location = useLocation()
  const navigate = useNavigate()
  const go = useSectionLink()
  const mobile = useMediaQuery('(max-width: 640px)')
  const modelSlug = location.pathname.startsWith('/models/') ? location.pathname.split('/')[2] : undefined

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY) ?? '[]') as ChatMessage[]
    } catch {
      return []
    }
  })
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const [announce, setAnnounce] = useState('')

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-20)))
    } catch {
      /* storage unavailable */
    }
  }, [messages])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, open])

  const close = useCallback(() => {
    ui.set({ conciergeOpen: false })
    requestAnimationFrame(() => launcherRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 220)
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    if (mobile) lockScroll(true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      if (mobile) lockScroll(false)
    }
  }, [open, mobile, close])

  const send = useCallback(
    async (text: string) => {
      const q = text.trim().slice(0, 1000)
      if (!q || busy) return
      const history: ChatMessage[] = [...messages, { role: 'user', content: q }]
      setMessages([...history, { role: 'assistant', content: '' }])
      setDraft('')
      setBusy(true)
      setAnnounce('')
      const ac = new AbortController()
      abortRef.current = ac
      let final = ''
      try {
        const m = await streamReply(
          history,
          { section, modelSlug },
          (full) => {
            final = full
            setMessages([...history, { role: 'assistant', content: full }])
          },
          ac.signal,
        )
        setMode(m)
      } catch {
        if (!final) setMessages([...history, { role: 'assistant', content: 'Stopped.' }])
      } finally {
        setBusy(false)
        abortRef.current = null
        setAnnounce(parseReply(final).body.slice(0, 400))
      }
    },
    [busy, messages, section, modelSlug],
  )

  // A question queued from elsewhere on the page (e.g. "Ask the concierge" on a model page).
  useEffect(() => {
    if (open && ask) {
      ui.set({ conciergeAsk: null })
      void send(ask)
    }
  }, [open, ask, send])

  const runAction = (a: Action) => {
    if (mobile) ui.set({ conciergeOpen: false })
    switch (a.kind) {
      case 'model':
        navigate(`/models/${a.value}`)
        break
      case 'testdrive': {
        const isCommercial = COMMERCIAL.some((c) => c.slug === a.value)
        openTestDrive({ model: a.value || undefined, type: isCommercial ? 'price' : 'test-drive' })
        break
      }
      case 'outlet':
        ui.set({ outlet: a.value })
        go('network')
        break
      case 'section':
        go(a.value)
        break
      case 'call':
        window.location.href = telHref(a.value)
        break
    }
  }

  const suggestions = useMemo(() => suggestionsFor(section, modelSlug), [section, modelSlug])
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(draft)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(draft)
    }
  }

  const hidden = sheetOpen || menuOpen
  return (
    <>
      <button
        ref={launcherRef}
        className={`concierge-launch ${open || hidden ? 'is-hidden' : ''} ${modelSlug ? 'is-raised' : ''}`}
        onClick={() => ui.set({ conciergeOpen: true })}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="concierge"
        tabIndex={open || hidden ? -1 : 0}
      >
        <span className="concierge-orb" aria-hidden="true" />
        <span>Ask Shital</span>
      </button>

      <section
        id="concierge"
        className={`concierge ${open && !hidden ? 'is-open' : ''}`}
        role="dialog"
        aria-modal={mobile ? 'true' : 'false'}
        aria-labelledby="concierge-title"
        aria-hidden={!open || hidden}
        inert={open && !hidden ? undefined : ''}
      >
        {mobile && <div className="concierge__scrim" onClick={close} />}
        <div className="concierge__panel">
          <header className="concierge__head">
            <span className="concierge-orb concierge-orb--sm" aria-hidden="true" />
            <div>
              <h2 id="concierge-title">Shital concierge</h2>
              <p className="mono">{mode === 'offline' ? 'Quick answers from dealership data' : 'AI assistant · answers from dealership data'}</p>
            </div>
            {messages.length > 0 && (
              <button
                className="concierge__icon"
                onClick={() => {
                  abortRef.current?.abort()
                  setMessages([])
                }}
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <Icon name="spark" size={18} />
              </button>
            )}
            <button className="concierge__icon" onClick={close} aria-label="Close concierge">
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="concierge__log" ref={logRef} role="log" aria-label="Conversation">
            <div className="cmsg cmsg--assistant">
              <p>Namaste — I can answer questions about Mahindra models and prices, our showrooms and workshops, service, or set up a test drive.</p>
            </div>
            {messages.map((msg, i) => {
              if (msg.role === 'user')
                return (
                  <div key={i} className="cmsg cmsg--user">
                    <p>{msg.content}</p>
                  </div>
                )
              const { body, actions } = parseReply(msg.content)
              const streaming = busy && i === messages.length - 1
              return (
                <div key={i} className="cmsg cmsg--assistant" aria-busy={streaming}>
                  {body ? <Body text={body} /> : streaming ? <span className="typing" aria-label="Typing"><i /><i /><i /></span> : null}
                  {!streaming && actions.length > 0 && (
                    <div className="cmsg__actions">
                      {actions.map((a) => {
                        const label = actionLabel(a)
                        if (!label) return null
                        return a.kind === 'call' ? (
                          <a key={a.kind + a.value} className="cchip" href={telHref(a.value)}>
                            <Icon name="phone" size={14} /> {label}
                          </a>
                        ) : (
                          <button key={a.kind + a.value} className="cchip" onClick={() => runAction(a)}>
                            {label} <Icon name="arrow" size={14} />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {!busy && (
              <div className="concierge__suggest" aria-label="Suggested questions">
                {suggestions.map((s) => (
                  <button key={s} className="cchip cchip--ghost" onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>

          <form className="concierge__form" onSubmit={onSubmit}>
            <label htmlFor="concierge-input" className="sr-only">
              Ask a question
            </label>
            <textarea
              id="concierge-input"
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={1000}
              placeholder="Ask about a model, price or outlet…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {busy ? (
              <button type="button" className="concierge__send" onClick={() => abortRef.current?.abort()} aria-label="Stop">
                <span className="concierge__stop" />
              </button>
            ) : (
              <button type="submit" className="concierge__send" disabled={!draft.trim()} aria-label="Send">
                <Icon name="send" size={18} />
              </button>
            )}
          </form>
          <p className="concierge__fine mono">AI can make mistakes. Prices are ex-showroom and can change — confirm with the showroom.</p>
        </div>
      </section>
    </>
  )
}
