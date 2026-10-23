import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MODELS } from '../data/models.generated.ts'
import { formatLakh } from '../data/business.ts'
import { Counter, Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap } from '../lib/hooks.ts'
import { openTestDrive } from '../lib/store.ts'

const range = (slug: string) => Number(MODELS.find((m) => m.slug === slug)!.specs.find((s) => s.unit === 'km/charge')?.value ?? 0)
const battery = (slug: string) => MODELS.find((m) => m.slug === slug)!.specs.find((s) => s.unit === 'kWh')?.value ?? ''
const EVS = MODELS.filter((m) => m.category === 'esuv').sort((a, b) => range(a.slug) - range(b.slug) || a.priceFrom - b.priceFrom)
const MAX = 700

export default function Electric() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(EVS.length - 1)
  const [pinned, setPinned] = useState(false)

  useGsap(root, ({ reduced, desktop }) => {
    const el = root.current!
    revealChildren(el, reduced)
    if (reduced || !desktop) {
      setPinned(false)
      setActive(EVS.length - 1)
      return
    }
    setPinned(true)
    setActive(0)
    let current = 0
    const show = (i: number) => {
      if (i === current) return
      current = i
      setActive(i)
    }
    gsap.timeline({
      scrollTrigger: {
        trigger: el.querySelector('.ev__pin'),
        start: 'top top',
        end: `+=${EVS.length * 70}%`,
        pin: true,
        scrub: true,
        onUpdate: (st) => show(Math.min(EVS.length - 1, Math.floor(st.progress * EVS.length))),
      },
    })
    gsap.fromTo('.ev__glow', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: true } })
    return () => setPinned(false)
  })

  const m = EVS[active]
  return (
    <section ref={root} className={`section ev ${pinned ? 'is-pinned' : ''}`} id="electric" data-section="electric" data-theme="dark" aria-labelledby="ev-title">
      <div className="ev__glow" aria-hidden="true" />
      <div className="ev__pin">
        <div className="wrap ev__grid">
          <div className="ev__copy">
            <p className="eyebrow eyebrow--dot" data-reveal>
              Electric SUVs
            </p>
            <h2 id="ev-title" className="h2" data-reveal>
              <Split text={`Up to ${range(EVS[EVS.length - 1].slug)} km on a charge.`} />
            </h2>
            <p className="muted ev__note" data-reveal>
              Five Mahindra eSUVs, ranked by the claimed range listed for each — from the XUV400 EV to the XEV 9S.
            </p>

            <ol className="ev__bars" aria-label="Claimed range by model">
              {EVS.map((e, i) => (
                <li key={e.slug} className={i === active ? 'is-active' : ''}>
                  <button type="button" onClick={() => setActive(i)} aria-pressed={i === active}>
                    <span className="ev__bar-label">{e.name}</span>
                    <span className="ev__bar-track" aria-hidden="true">
                      <span className="ev__bar-fill" style={{ transform: `scaleX(${range(e.slug) / MAX})` }} />
                    </span>
                    <span className="ev__bar-val mono num">{range(e.slug)} km</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="ev__stage">
            <div className="ev__readout" aria-live="polite">
              <Counter className="ev__num display num" value={range(m.slug)} />
              <span className="ev__unit mono">
                km/charge
                <br />
                claimed range
              </span>
            </div>
            <div className="ev__plates">
              {EVS.map((e, i) => (
                <div key={e.slug} className={`ev__plate plate ${i === active ? 'is-active' : ''} ${i < active ? 'is-past' : ''}`} aria-hidden={i !== active}>
                  <Img src={e.image} srcSet={`${e.imageSm} 560w, ${e.image} 930w`} sizes="(min-width: 960px) 44vw, 90vw" alt={`${e.fullName}`} lqip={e.lqip} className="feather" />
                </div>
              ))}
            </div>
            <div className="ev__meta" key={m.slug}>
              <div>
                <h3 className="h3">{m.fullName}</h3>
                <p className="mono muted">
                  {battery(m.slug)} kWh battery (up to) · from {formatLakh(m.priceFrom)}*
                </p>
              </div>
              <div className="ev__actions">
                <Link className="btn btn--sm" to={`/models/${m.slug}`}>
                  Explore <Icon name="arrow" />
                </Link>
                <button className="btn btn--sm btn--ghost" onClick={() => openTestDrive({ model: m.slug })}>
                  Test drive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
