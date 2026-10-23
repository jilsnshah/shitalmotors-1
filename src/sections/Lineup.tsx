import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MODELS } from '../data/models.generated.ts'
import { formatLakh } from '../data/business.ts'
import type { Model } from '../data/types.ts'
import { model3DFor } from '../data/models3d.ts'
import { Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap } from '../lib/hooks.ts'

const SUVS = MODELS.filter((m) => m.category === 'suv')

export function ModelCard({ m, index, total }: { m: Model; index: number; total: number }) {
  return (
    <Link to={`/models/${m.slug}`} className="mcard" aria-label={`${m.fullName}, from ${formatLakh(m.priceFrom)} ex-showroom`}>
      <div className="mcard__top mono">
        <span className="num">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span>
          {model3DFor(m.slug) && <span className="mcard__3d">360°</span>}
          {m.fuels.join(' · ')}
        </span>
      </div>
      <div className="mcard__img plate">
        <Img src={m.image} srcSet={`${m.imageSm} 560w, ${m.image} 930w`} sizes="(min-width: 960px) 34vw, 82vw" alt="" lqip={m.lqip} className="feather" />
      </div>
      <div className="mcard__body">
        <h3 className="mcard__name">{m.name}</h3>
        <p className="mcard__price">
          <span className="mono muted">from</span> <span className="num">{formatLakh(m.priceFrom)}</span>
          <span className="mono muted">*</span>
        </p>
        <div className="mcard__chips">
          {m.specs.slice(0, 1).map((s) => (
            <span className="chip" key={s.label}>
              {s.value} {s.unit}
            </span>
          ))}
          <span className="chip">{m.transmissions.length > 1 ? 'MT · AT' : m.transmissions[0] === 'Manual' ? 'Manual' : 'Automatic'}</span>
          <span className="chip">{m.variants.length} variants</span>
        </div>
        <span className="mcard__cta">
          Explore <Icon name="arrow" />
        </span>
      </div>
    </Link>
  )
}

export default function Lineup() {
  const root = useRef<HTMLElement>(null)
  const [pos, setPos] = useState(0)

  useGsap(root, ({ reduced, desktop }) => {
    const el = root.current!
    revealChildren(el, reduced)
    if (reduced || !desktop) return
    const track = el.querySelector<HTMLElement>('.lineup__track')!
    const distance = () => track.scrollWidth - window.innerWidth
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el.querySelector('.lineup__pin'),
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (st) => setPos(st.progress),
      },
    })
    // Cars drift slightly against the track for depth.
    gsap.utils.toArray<HTMLElement>('.mcard__img .img', el).forEach((img) => {
      gsap.fromTo(img, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: el.querySelector('.lineup__pin'), start: 'top top', end: () => `+=${distance()}`, scrub: true } })
    })
  })

  const minPrice = Math.min(...SUVS.map((m) => m.priceFrom))
  return (
    <section ref={root} className="section lineup on-light plate" id="lineup" data-section="lineup" data-theme="light" aria-labelledby="lineup-title">
      <div className="lineup__pin">
        <div className="wrap lineup__head">
          <div>
            <p className="eyebrow" data-reveal>
              The SUV line-up
            </p>
            <h2 id="lineup-title" className="h2" data-reveal>
              <Split text={`${SUVS.length} SUVs. Find your fit.`} />
            </h2>
          </div>
          <p className="lead muted lineup__sub" data-reveal>
            From the {SUVS.find((m) => m.priceFrom === minPrice)!.name} at {formatLakh(minPrice)} to the XUV 7XO — every price shown is
            ex-showroom Ahmedabad, as listed.
          </p>
        </div>
        <ul className="lineup__track" aria-label="SUV models">
          {SUVS.map((m, i) => (
            <li key={m.slug}>
              <ModelCard m={m} index={i} total={SUVS.length} />
            </li>
          ))}
          <li className="lineup__end">
            <p className="h3">Thinking electric?</p>
            <a className="link-arrow" href="#electric">
              Five eSUVs <Icon name="arrow" />
            </a>
          </li>
        </ul>
        <div className="wrap lineup__progress" aria-hidden="true">
          <span className="mono lineup__hint-d">Keep scrolling</span>
          <span className="mono lineup__hint-m">Swipe to browse</span>
          <span className="lineup__bar">
            <span style={{ transform: `scaleX(${Math.max(0.04, pos)})` }} />
          </span>
        </div>
      </div>
    </section>
  )
}
