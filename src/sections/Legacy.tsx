import { useRef } from 'react'
import { BUSINESS, OUTLETS, PHOTOS } from '../data/business.ts'
import { Counter, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap } from '../lib/hooks.ts'

const STATS: { value: number; label: string; from: number; suffix?: string }[] = [
  { value: BUSINESS.since, label: 'Serving customers since', from: 1990 },
  { value: 2, label: 'Customers served', suffix: ' lakh+', from: 0 },
  { value: OUTLETS.filter((o) => o.kind === 'showroom').length, label: 'Showrooms', from: 0 },
  { value: OUTLETS.filter((o) => o.kind === 'workshop').length, label: 'Workshops', from: 0 },
  { value: 3, label: 'Sales · Service · Spares', suffix: 'S', from: 0 },
]

const COLLAGE = [
  { src: PHOTOS.showroom[2], alt: 'Customers gathered around a new Mahindra SUV at a Shital Motors showroom', speed: -14 },
  { src: PHOTOS.deliveries[0], alt: 'A family receiving their new Mahindra SUV from the Shital Motors team', speed: 10 },
  { src: PHOTOS.facilities[0], alt: 'Shital Motors Mahindra workshop on S.P. Ring Road, Bopal', speed: -6 },
  { src: PHOTOS.deliveries[7], alt: 'Delivery celebration with the Shital Motors key board', speed: 16 },
]

export default function Legacy() {
  const root = useRef<HTMLElement>(null)

  useGsap(root, ({ reduced, desktop }) => {
    const el = root.current!
    revealChildren(el, reduced)
    if (reduced) return
    el.querySelectorAll<HTMLElement>('[data-speed]').forEach((p) => {
      gsap.fromTo(
        p,
        { yPercent: -Number(p.dataset.speed) * (desktop ? 1 : 0.5) },
        { yPercent: Number(p.dataset.speed) * (desktop ? 1 : 0.5), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    })
    gsap.fromTo('.legacy__rule', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el.querySelector<HTMLElement>('.legacy__stats'), start: 'top 85%', end: 'bottom 60%', scrub: true } })
  })

  return (
    <section ref={root} className="section legacy" id="legacy" data-section="legacy" data-theme="dark" aria-labelledby="legacy-title">
      <div className="wrap legacy__grid">
        <div className="legacy__text">
          <p className="eyebrow" data-reveal>
            Since {BUSINESS.since}
          </p>
          <h2 id="legacy-title" className="h2" data-reveal>
            <Split text="More than two decades of Mahindra in Gujarat." />
          </h2>
          <p className="lead muted" data-reveal>
            One of the oldest and leading authorised channel partners of Mahindra &amp; Mahindra's automotive division in Gujarat — personal and
            commercial vehicles, with sales, service and spares under one name.
          </p>
          <p className="legacy__values mono" data-reveal>
            {BUSINESS.values.map((v) => (
              <span key={v}>{v}</span>
            ))}
          </p>
        </div>

        <div className="legacy__collage" aria-hidden="false">
          {COLLAGE.map((c, i) => (
            <figure key={c.src} className={`legacy__photo legacy__photo--${i + 1}`} data-speed={c.speed}>
              <Img src={c.src} alt={c.alt} sizes="(min-width: 960px) 26vw, 50vw" />
            </figure>
          ))}
        </div>
      </div>

      <div className="wrap">
        <span className="legacy__rule" aria-hidden="true" />
        <dl className="legacy__stats">
          {STATS.map((s) => (
            <div key={s.label} className="legacy__stat">
              <dt className="mono">{s.label}</dt>
              <dd className="display num">
                <Counter value={s.value} from={s.from} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
