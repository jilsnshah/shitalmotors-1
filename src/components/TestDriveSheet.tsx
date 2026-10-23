import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { BUSINESS, OUTLETS, formatPhone, telHref } from '../data/business.ts'
import { COMMERCIAL, MODELS } from '../data/models.generated.ts'
import { lockScroll } from '../lib/scroll.ts'
import { closeTestDrive, useUI, type UIState } from '../lib/store.ts'
import { Icon } from './primitives.tsx'

type Kind = NonNullable<UIState['testDrive']['type']>
type Status = { state: 'idle' } | { state: 'sending' } | { state: 'sent' } | { state: 'offline'; mailto: string } | { state: 'error'; message: string }

const KINDS: { id: Kind; label: string }[] = [
  { id: 'test-drive', label: 'Test drive' },
  { id: 'price', label: 'Price quote' },
  { id: 'service', label: 'Service' },
]

const vehicleName = (slug: string) => MODELS.find((m) => m.slug === slug)?.fullName ?? COMMERCIAL.find((c) => c.slug === slug)?.name ?? ''
const todayIST = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().slice(0, 10)

export default function TestDriveSheet() {
  const td = useUI((s) => s.testDrive)
  const [kind, setKind] = useState<Kind>('test-drive')
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const panel = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const id = useId()

  useEffect(() => {
    if (!td.open) return
    lastFocus.current = document.activeElement as HTMLElement
    setKind(td.type ?? (td.outlet && OUTLETS.find((o) => o.id === td.outlet)?.kind === 'workshop' ? 'service' : 'test-drive'))
    setStatus({ state: 'idle' })
    lockScroll(true)
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('input[name=name]')?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTestDrive()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lockScroll(false)
      lastFocus.current?.focus?.()
    }
  }, [td.open, td.type, td.outlet])

  const outlets = OUTLETS.filter((o) => (kind === 'service' ? o.kind === 'workshop' : o.kind === 'showroom'))
  const defaultOutlet = td.outlet && outlets.some((o) => o.id === td.outlet) ? td.outlet : ''

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd.entries()) as Record<string, string>
    const phone = data.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (data.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(phone)) {
      setStatus({ state: 'error', message: 'Please enter your name and a valid 10-digit mobile number.' })
      return
    }
    const payload = { ...data, phone, type: kind }
    setStatus({ state: 'sending' })
    const outlet = OUTLETS.find((o) => o.id === data.outlet)
    const body = [
      `Request: ${KINDS.find((k) => k.id === kind)!.label}`,
      `Name: ${data.name}`,
      `Mobile: ${phone}`,
      data.model && `Vehicle: ${vehicleName(data.model)}`,
      outlet && `Outlet: ${outlet.name} (${outlet.kind})`,
      data.date && `Preferred date: ${data.date}`,
      data.note && `Note: ${data.note}`,
    ]
      .filter(Boolean)
      .join('\n')
    const mailto = `mailto:${kind === 'service' ? BUSINESS.email.serviceCrm : BUSINESS.email.customerCare}?subject=${encodeURIComponent(
      `${KINDS.find((k) => k.id === kind)!.label} request — ${data.name}`,
    )}&body=${encodeURIComponent(body)}`
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) return setStatus({ state: 'sent' })
      if (res.status === 422) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        return setStatus({ state: 'error', message: j.error ?? 'Please check your details.' })
      }
      setStatus({ state: 'offline', mailto })
    } catch {
      setStatus({ state: 'offline', mailto })
    }
  }

  const callNumber = kind === 'service' ? BUSINESS.phones.serviceBooking : BUSINESS.phones.sales[0]
  return (
    <div className={`sheet ${td.open ? 'is-open' : ''}`} aria-hidden={!td.open} inert={td.open ? undefined : ''}>
      <div className="sheet__scrim" onClick={closeTestDrive} />
      <div className="sheet__panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="sheet__head">
          <h2 id={`${id}-title`} className="h3">
            {kind === 'service' ? 'Request a service slot' : kind === 'price' ? 'Get an on-road price' : 'Book a test drive'}
          </h2>
          <button className="sheet__close" onClick={closeTestDrive} aria-label="Close">
            <Icon name="close" size={22} />
          </button>
        </div>

        {status.state === 'sent' ? (
          <div className="sheet__done">
            <span className="sheet__tick">
              <Icon name="check" size={28} stroke={2} />
            </span>
            <p className="h3">Request received.</p>
            <p className="muted">
              The Shital Motors team will contact you on the number you shared. Prefer to talk now? Call{' '}
              <a href={telHref(callNumber)}>{formatPhone(callNumber)}</a>.
            </p>
            <button className="btn btn--ink" onClick={closeTestDrive}>
              Done
            </button>
          </div>
        ) : status.state === 'offline' ? (
          <div className="sheet__done">
            <p className="h3">We couldn't send this online.</p>
            <p className="muted">Your details are ready to go by email, or call us directly — both reach the dealership team.</p>
            <div className="sheet__alt">
              <a className="btn btn--ink" href={status.mailto}>
                <Icon name="mail" /> Send by email
              </a>
              <a className="btn btn--ghost" href={telHref(callNumber)}>
                <Icon name="phone" /> {formatPhone(callNumber)}
              </a>
            </div>
          </div>
        ) : (
          <form className="sheet__form" onSubmit={submit} noValidate key={`${td.model}-${td.outlet}-${kind}`}>
            <div className="seg sheet__kinds" role="radiogroup" aria-label="Request type">
              {KINDS.map((k) => (
                <button type="button" role="radio" aria-checked={kind === k.id} key={k.id} onClick={() => setKind(k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Your name</span>
              <input name="name" autoComplete="name" required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              <span>Mobile number</span>
              <input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required placeholder="10-digit mobile" maxLength={14} />
            </label>
            <label className="field">
              <span>{kind === 'service' ? 'Your vehicle (optional)' : 'Vehicle'}</span>
              <select name="model" defaultValue={td.model ?? ''}>
                <option value="">{kind === 'service' ? 'Select model' : 'Not sure yet'}</option>
                <optgroup label="SUVs">
                  {MODELS.filter((m) => m.category === 'suv').map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Electric SUVs">
                  {MODELS.filter((m) => m.category === 'esuv').map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                {kind !== 'test-drive' && (
                  <optgroup label="Commercial">
                    {COMMERCIAL.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label className="field">
              <span>{kind === 'service' ? 'Workshop' : 'Showroom'}</span>
              <select name="outlet" defaultValue={defaultOutlet}>
                <option value="">Nearest to me</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}, {o.city}
                  </option>
                ))}
              </select>
            </label>
            {kind !== 'price' && (
              <label className="field">
                <span>Preferred date (optional)</span>
                <input name="date" type="date" min={todayIST()} />
              </label>
            )}
            <label className="field">
              <span>Anything else? (optional)</span>
              <textarea name="note" rows={2} maxLength={500} />
            </label>
            {status.state === 'error' && (
              <p className="sheet__error" role="alert">
                {status.message}
              </p>
            )}
            <button className="btn btn--red sheet__submit" disabled={status.state === 'sending'}>
              {status.state === 'sending' ? 'Sending…' : 'Send request'}
            </button>
            <p className="mono muted sheet__fine">
              Your details go to Shital Motors to arrange this request. Or call <a href={telHref(callNumber)}>{formatPhone(callNumber)}</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
