import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MODELS } from '../data/models.generated.ts'
import { BUSINESS, formatLakh, formatPhone, telHref } from '../data/business.ts'
import { Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap, useSectionTracker } from '../lib/hooks.ts'
import { askConcierge, openTestDrive, ui } from '../lib/store.ts'
import NotFound from './NotFound.tsx'
import Studio3D from './Studio3D.tsx'
import { model3DFor } from '../data/models3d.ts'
import { useMotion } from '../lib/motion.tsx'

type SortKey = 'price' | 'name'

export default function ModelPage() {
  const { slug } = useParams()
  const m = MODELS.find((x) => x.slug === slug)
  if (!m) return <NotFound />
  return <ModelView key={m.slug} slug={m.slug} />
}

function ModelView({ slug }: { slug: string }) {
  const idx = MODELS.findIndex((x) => x.slug === slug)
  const m = MODELS[idx]
  const prev = MODELS[(idx - 1 + MODELS.length) % MODELS.length]
  const next = MODELS[(idx + 1) % MODELS.length]
  const root = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState(0)
  const [fuel, setFuel] = useState<string>('All')
  const [trans, setTrans] = useState<string>('All')
  const [sort, setSort] = useState<SortKey>('price')
  const { allow3D } = useMotion()
  const asset = model3DFor(slug)

  useSectionTracker([slug])

  useEffect(() => {
    document.title = `${m.fullName} — price from ${formatLakh(m.priceFrom)} | Shital Motors`
    ui.set({ section: 'model', theme: 'light' })
  }, [m])

  useGsap(
    root,
    ({ reduced }) => {
      const el = root.current!
      revealChildren(el, reduced)
      if (reduced) return
      gsap.fromTo('.mp__car', { xPercent: 14, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', delay: 0.1 })
      gsap.fromTo('.mp__name .split-i', { yPercent: 115 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.06 })
      gsap.to('.mp__car', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: el.querySelector<HTMLElement>('.mp__hero'), start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.mp__ghost', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: el.querySelector<HTMLElement>('.mp__hero'), start: 'top top', end: 'bottom top', scrub: true } })
    },
    [slug],
  )

  const variants = useMemo(() => {
    const vs = m.variants.filter((v) => (fuel === 'All' || v.fuel === fuel) && (trans === 'All' || v.transmission === trans))
    return [...vs].sort((a, b) => (sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name)))
  }, [m, fuel, trans, sort])

  const specLabel = m.category === 'esuv' ? 'Battery' : 'Engine'
  const c = m.colors[color]

  return (
    <div ref={root} className="mp">
      <section className="mp__hero on-light plate" data-section="model" data-theme="light" aria-labelledby="mp-title">
        <div className="mp__ghost display" aria-hidden="true">
          {m.name}
        </div>
        <div className="wrap mp__hero-inner">
          <nav className="mp__crumbs mono" aria-label="Breadcrumb">
            <Link to={m.category === 'esuv' ? '/#electric' : '/#lineup'}>
              <Icon name="arrowLeft" size={16} /> {m.category === 'esuv' ? 'Electric SUVs' : 'SUV line-up'}
            </Link>
          </nav>
          <div className="mp__intro">
            <p className="eyebrow eyebrow--dot">{m.category === 'esuv' ? 'Mahindra electric SUV' : 'Mahindra SUV'}</p>
            <h1 id="mp-title" className="mp__name display">
              <Split text={m.name} />
            </h1>
            <p className="mp__price">
              <span className="num">{formatLakh(m.priceFrom)}</span>
              {m.priceTo > m.priceFrom && (
                <>
                  <span className="muted"> – </span>
                  <span className="num">{formatLakh(m.priceTo)}</span>
                </>
              )}
              <span className="mono muted mp__price-note">ex-showroom Ahmedabad*</span>
            </p>
            <div className="mp__ctas">
              <button className="btn btn--red" onClick={() => openTestDrive({ model: m.slug })}>
                Book a test drive
              </button>
              <button className="btn btn--ghost" onClick={() => openTestDrive({ model: m.slug, type: 'price' })}>
                Get on-road price
              </button>
            </div>
          </div>
        </div>
        <div className="mp__car">
          <Img src={m.image} srcSet={`${m.imageSm} 560w, ${m.image} 930w`} sizes="(min-width: 960px) 64vw, 100vw" alt={`${m.fullName}, front three-quarter view`} lqip={m.lqip} className="feather" eager />
        </div>
      </section>

      <section className="mp__facts wrap" aria-label="Key facts">
        <dl>
          <div data-reveal>
            <dt className="mono">Fuel</dt>
            <dd>{m.fuels.join(' / ')}</dd>
          </div>
          <div data-reveal>
            <dt className="mono">Transmission</dt>
            <dd>{m.transmissions.join(' / ')}</dd>
          </div>
          {m.specs.map((s) => (
            <div key={s.label} data-reveal>
              <dt className="mono">{s.label}</dt>
              <dd>
                <span className="num">{s.value}</span> <span className="mono muted">{s.unit}</span>
              </dd>
            </div>
          ))}
          <div data-reveal>
            <dt className="mono">Variants</dt>
            <dd className="num">{m.variants.length}</dd>
          </div>
        </dl>
      </section>

      {asset && allow3D && <Studio3D model={m} asset={asset} color={color} onColor={setColor} />}

      {m.colors.length > 0 && (
        <section className="mp__colors wrap" aria-labelledby="mp-colors">
          <div className="mp__colors-head">
            <p className="eyebrow" data-reveal>
              Colours
            </p>
            <h2 id="mp-colors" className="h3" data-reveal>
              {m.colors.length} finishes listed for the {m.name}
            </h2>
          </div>
          <div className="mp__color-stage">
            <div className="mp__color-img" key={c.src}>
              <img src={c.src} alt={`${m.name} in ${c.name}`} width={500} height={350} loading="lazy" decoding="async" />
            </div>
            <div>
              <p className="mp__color-name" aria-live="polite">
                {c.name}
              </p>
              <div className="mp__swatches" role="radiogroup" aria-label="Choose a colour">
                {m.colors.map((col, i) => (
                  <button
                    key={col.src}
                    role="radio"
                    aria-checked={i === color}
                    aria-label={col.name}
                    title={col.name}
                    className="swatch"
                    style={{ ['--sw' as string]: col.hex }}
                    onClick={() => setColor(i)}
                  />
                ))}
              </div>
              <p className="mono muted mp__color-note">Colour availability varies by variant — please confirm at the showroom.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mp__variants wrap" aria-labelledby="mp-variants">
        <div className="mp__variants-head">
          <div>
            <p className="eyebrow" data-reveal>
              Variants &amp; prices
            </p>
            <h2 id="mp-variants" className="h2" data-reveal>
              <Split text="Pick your trim." />
            </h2>
          </div>
          <div className="mp__filters">
            {m.fuels.length > 1 && (
              <div className="seg" role="group" aria-label="Fuel">
                {['All', ...m.fuels].map((f) => (
                  <button key={f} aria-pressed={fuel === f} onClick={() => setFuel(f)}>
                    {f}
                  </button>
                ))}
              </div>
            )}
            {m.transmissions.length > 1 && (
              <div className="seg" role="group" aria-label="Transmission">
                {['All', ...m.transmissions].map((t) => (
                  <button key={t} aria-pressed={trans === t} onClick={() => setTrans(t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <table className="vt">
          <caption className="sr-only">
            {m.fullName} variants, ex-showroom Ahmedabad prices. Showing {variants.length} of {m.variants.length}.
          </caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={sort === 'name' ? 'ascending' : 'none'}>
                <button onClick={() => setSort('name')}>Variant</button>
              </th>
              <th scope="col">Fuel</th>
              <th scope="col">Transmission</th>
              <th scope="col">{specLabel}</th>
              <th scope="col" aria-sort={sort === 'price' ? 'ascending' : 'none'} className="vt__price">
                <button onClick={() => setSort('price')}>Ex-showroom</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.name}>
                <th scope="row">{v.name}</th>
                <td>{v.fuel}</td>
                <td>{v.transmission}</td>
                <td className="mono">{v.spec.replace(' CC', ' cc')}</td>
                <td className="vt__price num">{formatLakh(v.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {variants.length === 0 && <p className="muted">No variants match those filters.</p>}

        <div className="mp__help">
          <p className="muted">
            Prices as listed by Shital Motors and subject to change. For on-road price, offers, finance and stock, call sales on{' '}
            <a href={telHref(BUSINESS.phones.sales[0])}>{formatPhone(BUSINESS.phones.sales[0])}</a>.
          </p>
          <button className="btn btn--ghost btn--sm" onClick={() => askConcierge(`Which ${m.name} variant should I consider?`)}>
            <Icon name="spark" size={16} /> Ask the concierge
          </button>
        </div>
      </section>

      <nav className="mp__pager" aria-label="More models">
        {[prev, next].map((x, i) => (
          <Link key={x.slug} to={`/models/${x.slug}`} className={`mp__pager-link ${i ? 'is-next' : ''}`}>
            <span className="mono muted">{i ? 'Next' : 'Previous'}</span>
            <span className="mp__pager-name">{x.name}</span>
            <span className="mono">from {formatLakh(x.priceFrom)}</span>
            <div className="mp__pager-img plate">
              <Img src={x.imageSm} alt="" lqip={x.lqip} className="feather" width={560} height={373} />
            </div>
          </Link>
        ))}
      </nav>

      <div className="mp__sticky" role="region" aria-label={`${m.name} quick actions`}>
        <span>
          <span className="mp__sticky-name">{m.name}</span>
          <span className="mono">from {formatLakh(m.priceFrom)}*</span>
        </span>
        <button className="btn btn--red btn--sm" onClick={() => openTestDrive({ model: m.slug })}>
          Test drive
        </button>
      </div>
    </div>
  )
}
