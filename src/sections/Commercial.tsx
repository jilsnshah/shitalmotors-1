import { useRef, useState } from 'react'
import { COMMERCIAL } from '../data/models.generated.ts'
import { formatLakh } from '../data/business.ts'
import { Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap, useMediaQuery } from '../lib/hooks.ts'
import { openTestDrive } from '../lib/store.ts'

const GROUPS = [
  { type: 'Mini Truck', title: 'Small commercial vehicles', items: COMMERCIAL.filter((c) => c.type === 'Mini Truck') },
  { type: 'Pick-Up', title: 'Pick-ups', items: COMMERCIAL.filter((c) => c.type === 'Pick-Up') },
] as const

export default function Commercial() {
  const root = useRef<HTMLElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine) and (min-width: 960px)')
  const feature = COMMERCIAL.find((c) => c.slug === 'bolero-maxx-pik-up-hd')!

  useGsap(root, ({ reduced }) => {
    const el = root.current!
    revealChildren(el, reduced)
    if (reduced) return
    const hero = el.querySelector<HTMLElement>('.comm__hero')
    gsap.fromTo('.comm__hero .img', { scale: 1.18, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top bottom', end: 'bottom top', scrub: true } })
    gsap.fromTo('.comm__hero', { clipPath: 'inset(12% 8% 12% 8% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: hero, start: 'top 95%', end: 'top 25%', scrub: true } })
    gsap.from('.comm__row', { y: 30, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el.querySelector<HTMLElement>('.comm__lists'), start: 'top 80%', once: true } })
  })

  const onMove = (e: React.PointerEvent) => {
    if (!floatRef.current || !finePointer) return
    gsap.to(floatRef.current, { x: e.clientX, y: e.clientY, duration: 0.6, ease: 'expo.out' })
  }

  const hovered = COMMERCIAL.find((c) => c.slug === hover)
  return (
    <section ref={root} className="section comm on-light" id="commercial" data-section="commercial" data-theme="light" aria-labelledby="comm-title" onPointerMove={onMove}>
      <div className="wrap comm__head">
        <p className="eyebrow" data-reveal>
          Commercial vehicles
        </p>
        <h2 id="comm-title" className="h2" data-reveal>
          <Split text="Built for the working day." />
        </h2>
        <p className="lead muted comm__sub" data-reveal>
          Mahindra mini trucks and pick-ups for Gujarat's businesses, from {formatLakh(Math.min(...COMMERCIAL.map((c) => c.priceFrom)))} ex-showroom.
        </p>
      </div>

      <figure className="comm__hero">
        <Img src={feature.image} alt={`${feature.name} pick-up`} lqip={feature.lqip} sizes="100vw" />
        <figcaption className="wrap mono">{feature.name}</figcaption>
      </figure>

      <div className="wrap comm__lists">
        {GROUPS.map((g) => (
          <div key={g.type} className="comm__group">
            <h3 className="comm__group-title mono">
              {g.title} <span className="muted">({g.items.length})</span>
            </h3>
            <ul>
              {g.items.map((c) => (
                <li key={c.slug} className="comm__row">
                  <button
                    type="button"
                    className="comm__btn"
                    onPointerEnter={() => setHover(c.slug)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(c.slug)}
                    onBlur={() => setHover(null)}
                    onClick={() => openTestDrive({ type: 'price', model: c.slug })}
                    aria-label={`${c.name}, from ${formatLakh(c.priceFrom)}. Request a quote`}
                  >
                    <span className="comm__thumb plate" aria-hidden="true">
                      <Img src={c.image} alt="" lqip={c.lqip} sizes="160px" />
                    </span>
                    <span className="comm__name">{c.name}</span>
                    <span className="comm__type mono muted">{c.type}</span>
                    <span className="comm__price num">
                      <span className="mono muted">from</span> {formatLakh(c.priceFrom)}
                    </span>
                    <span className="comm__go" aria-hidden="true">
                      <span className="mono">Get a quote</span>
                      <Icon name="arrow" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {finePointer && (
        <div className={`comm__float ${hovered ? 'is-on' : ''}`} ref={floatRef} aria-hidden="true">
          {COMMERCIAL.map((c) => (
            <Img key={c.slug} src={c.image} alt="" lqip={c.lqip} sizes="360px" className={c.slug === hover ? 'is-current' : ''} />
          ))}
        </div>
      )}
    </section>
  )
}
