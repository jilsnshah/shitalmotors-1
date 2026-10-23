import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BUSINESS, formatPhone, telHref } from '../data/business.ts'
import { lockScroll, scrollToTarget } from '../lib/scroll.ts'
import { openTestDrive, ui, useUI } from '../lib/store.ts'
import { useMotion } from '../lib/motion.tsx'
import { Icon } from './primitives.tsx'

export const NAV = [
  { id: 'lineup', label: 'SUVs' },
  { id: 'electric', label: 'Electric' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'service', label: 'Service' },
  { id: 'network', label: 'Locations' },
  { id: 'stories', label: 'Stories' },
] as const

export function useSectionLink() {
  const location = useLocation()
  const navigate = useNavigate()
  return (id: string) => {
    ui.set({ menuOpen: false })
    if (location.pathname === '/') scrollToTarget(`#${id}`)
    else navigate(`/#${id}`)
  }
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark ${compact ? 'wordmark--compact' : ''}`}>
      <span className="wordmark__name">SHITAL MOTORS</span>
      {!compact && <span className="wordmark__sub mono">Authorised Mahindra Dealer</span>}
    </span>
  )
}

export default function Header() {
  const theme = useUI((s) => s.theme)
  const section = useUI((s) => s.section)
  const menuOpen = useUI((s) => s.menuOpen)
  const { reduced } = useMotion()
  const go = useSectionLink()
  const location = useLocation()
  const [hidden, setHidden] = useState(false)
  const [progress, setProgress] = useState(0)
  const lastY = useRef(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        const max = document.documentElement.scrollHeight - innerHeight
        setProgress(max > 0 ? y / max : 0)
        if (!reduced) setHidden(y > 240 && y > lastY.current + 4)
        if (y < lastY.current - 4 || y < 240) setHidden(false)
        lastY.current = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced])

  useEffect(() => {
    lockScroll(menuOpen)
    if (!menuOpen) return
    const first = menuRef.current?.querySelector<HTMLElement>('a,button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.set({ menuOpen: false })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => ui.set({ menuOpen: false }), [location.pathname])

  const effectiveTheme = menuOpen ? 'dark' : theme
  return (
    <>
      <header className={`header ${hidden && !menuOpen ? 'is-hidden' : ''}`} data-theme={effectiveTheme}>
        <div className="header__inner">
          <Link to="/" className="header__brand" aria-label="Shital Motors home" onClick={() => location.pathname === '/' && scrollToTarget(0)}>
            <Wordmark />
          </Link>
          <nav className="header__nav" aria-label="Primary">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`/#${n.id}`}
                aria-current={location.pathname === '/' && section === n.id ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  go(n.id)
                }}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="header__actions">
            <a className="header__call" href={telHref(BUSINESS.phones.sales[0])} aria-label={`Call sales ${formatPhone(BUSINESS.phones.sales[0])}`}>
              <Icon name="phone" size={17} />
              <span className="mono">{formatPhone(BUSINESS.phones.sales[0])}</span>
            </a>
            <button className="btn btn--red btn--sm header__cta" onClick={() => openTestDrive()}>
              Book a test drive
            </button>
            <button
              className="header__menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => ui.set({ menuOpen: !menuOpen })}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
        <div className="header__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </header>

      <div id="site-menu" className={`menu ${menuOpen ? 'is-open' : ''}`} ref={menuRef} aria-hidden={!menuOpen} inert={menuOpen ? undefined : ''}>
        <nav className="menu__nav" aria-label="Menu">
          {NAV.map((n, i) => (
            <a
              key={n.id}
              href={`/#${n.id}`}
              style={{ transitionDelay: menuOpen ? `${80 + i * 40}ms` : '0ms' }}
              onClick={(e) => {
                e.preventDefault()
                go(n.id)
              }}
            >
              <span className="mono menu__idx">0{i + 1}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <button className="btn btn--red" onClick={() => openTestDrive()}>
            Book a test drive
          </button>
          <a className="btn btn--ghost" href={telHref(BUSINESS.phones.sales[0])}>
            <Icon name="phone" /> Sales {formatPhone(BUSINESS.phones.sales[0])}
          </a>
          <a className="btn btn--ghost" href={telHref(BUSINESS.phones.serviceBooking)}>
            <Icon name="wheel" /> Service {formatPhone(BUSINESS.phones.serviceBooking)}
          </a>
        </div>
      </div>
    </>
  )
}
