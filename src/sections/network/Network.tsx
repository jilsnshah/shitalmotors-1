import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { OUTLETS, formatPhone, telHref } from '../../data/business.ts'
import type { Outlet } from '../../data/types.ts'
import { Icon, Img, Split } from '../../components/primitives.tsx'
import { ScrollTrigger } from '../../lib/scroll.ts'
import { revealChildren, useGsap, useInViewport } from '../../lib/hooks.ts'
import { useMotion } from '../../lib/motion.tsx'
import { openTestDrive, ui, useUI } from '../../lib/store.ts'
import { directionsUrl } from '../../lib/geo.ts'
import { openState } from '../../lib/hours.ts'
import NetworkMap2D from './NetworkMap2D.tsx'

const NetworkScene = lazy(() => import('./NetworkScene.tsx'))

type Filter = 'all' | 'showroom' | 'workshop'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'showroom', label: 'Showrooms' },
  { id: 'workshop', label: 'Workshops' },
]

/** Falls back to the 2D map if the WebGL chunk or context fails. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function OutletDetail({ o }: { o: Outlet }) {
  const state = openState(o)
  return (
    <article className="outlet-card" aria-live="polite">
      {o.photo && (
        <div className="outlet-card__photo">
          <Img src={o.photo} alt={`Shital Motors ${o.name} ${o.kind}`} sizes="(min-width: 960px) 28vw, 90vw" />
        </div>
      )}
      <p className="mono outlet-card__kind">
        <span className={`dot dot--${o.kind}`} /> {o.kind} · {o.city}
      </p>
      <h3 className="h3">Shital Motors – {o.name}</h3>
      <p className="muted">
        {o.address} – {o.pin}
      </p>
      <p className={`outlet-card__open mono ${state.open ? 'is-open' : ''}`}>{state.label}</p>
      <dl className="outlet-card__hours mono">
        {o.hours.map((h) => (
          <div key={h.days}>
            <dt>{h.days}</dt>
            <dd>{h.time}</dd>
          </div>
        ))}
      </dl>
      <div className="outlet-card__actions">
        {o.phones.map((p) => (
          <a key={p} className="btn btn--sm" href={telHref(p)}>
            <Icon name="phone" size={16} /> {formatPhone(p)}
          </a>
        ))}
        <a className="btn btn--sm btn--ghost" href={directionsUrl(o)} target="_blank" rel="noreferrer">
          <Icon name="pin" size={16} /> Directions
        </a>
        <button className="btn btn--sm btn--ghost" onClick={() => openTestDrive({ outlet: o.id, type: o.kind === 'workshop' ? 'service' : 'test-drive' })}>
          {o.kind === 'workshop' ? 'Request service' : 'Book test drive'}
        </button>
      </div>
    </article>
  )
}

export default function Network() {
  const root = useRef<HTMLElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const { allow3D } = useMotion()
  const selected = useUI((s) => s.outlet)
  const [filter, setFilter] = useState<Filter>('all')
  const [hovered, setHovered] = useState<string | null>(null)
  const [sceneFailed, setSceneFailed] = useState(false)
  const inView = useInViewport(mapRef, '200px')
  const [wantScene, setWantScene] = useState(false)

  useEffect(() => {
    if (inView) setWantScene(true)
  }, [inView])

  const visible = useMemo(() => new Set(OUTLETS.filter((o) => filter === 'all' || o.kind === filter).map((o) => o.id)), [filter])
  const list = OUTLETS.filter((o) => visible.has(o.id))
  const current = OUTLETS.find((o) => o.id === selected) ?? null

  useGsap(root, ({ reduced }) => {
    const el = root.current!
    revealChildren(el, reduced)
    const st = ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom bottom', onUpdate: (s) => (progress.current = s.progress) })
    return () => st.kill()
  })

  const select = (id: string | null) => ui.set({ outlet: id })
  const map2d = <NetworkMap2D outlets={OUTLETS} visible={visible} selected={selected} hovered={hovered} onSelect={select} onHover={setHovered} />
  const use3D = allow3D && !sceneFailed

  return (
    <section ref={root} className="section net" id="network" data-section="network" data-theme="dark" aria-labelledby="net-title">
      <div className="wrap net__head">
        <p className="eyebrow eyebrow--dot" data-reveal>
          Find us
        </p>
        <h2 id="net-title" className="h2" data-reveal>
          <Split text={`${OUTLETS.filter((o) => o.kind === 'showroom').length} showrooms. ${OUTLETS.filter((o) => o.kind === 'workshop').length} workshops. Three cities.`} />
        </h2>
      </div>

      <div className="net__layout wrap">
        <div className="net__panel">
          <div className="net__filters" role="group" aria-label="Filter outlets">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
                <span className="mono">{f.id === 'all' ? OUTLETS.length : OUTLETS.filter((o) => o.kind === f.id).length}</span>
              </button>
            ))}
          </div>

          <ul className="net__list" aria-label="Outlets">
            {list.map((o) => {
              const st = openState(o)
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    className={`net__item ${selected === o.id ? 'is-selected' : ''}`}
                    aria-pressed={selected === o.id}
                    aria-controls="outlet-detail"
                    onClick={() => select(selected === o.id ? null : o.id)}
                    onPointerEnter={() => setHovered(o.id)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(o.id)}
                    onBlur={() => setHovered(null)}
                  >
                    <span className={`dot dot--${o.kind}`} aria-hidden="true" />
                    <span className="net__item-main">
                      <span className="net__item-name">{o.name}</span>
                      <span className="mono muted">
                        {o.kind} · {o.city}
                      </span>
                    </span>
                    <span className={`net__item-state mono ${st.open ? 'is-open' : ''}`}>{st.open ? 'Open' : st.open === false ? 'Closed' : '—'}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div id="outlet-detail">
            {current ? (
              <OutletDetail o={current} />
            ) : (
              <p className="muted net__hint">Choose an outlet to see its address, today's hours, phone and directions.</p>
            )}
          </div>
        </div>

        <div className="net__map" ref={mapRef}>
          <div className="net__canvas" aria-hidden="true">
          {use3D && wantScene ? (
            <SceneBoundary fallback={map2d}>
              <Suspense fallback={map2d}>
                <NetworkScene
                  outlets={OUTLETS}
                  visible={visible}
                  selected={selected}
                  hovered={hovered}
                  onSelect={select}
                  onHover={setHovered}
                  progress={progress}
                  active={inView}
                  onFail={() => setSceneFailed(true)}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            map2d
          )}
          </div>
          <div className="net__legend mono" aria-hidden="true">
            <span>
              <span className="dot dot--showroom" /> Showroom
            </span>
            <span>
              <span className="dot dot--workshop" /> Workshop
            </span>
            <span>Rings: distance from Ashram Road</span>
          </div>
          {current && (
            <button className="net__reset btn btn--sm btn--ghost" onClick={() => select(null)}>
              Show all
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
