import { useRef } from 'react'
import { BUSINESS, OUTLETS, PHOTOS, SERVICE_OFFERINGS, formatPhone, telHref } from '../data/business.ts'
import { Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap } from '../lib/hooks.ts'
import { openTestDrive, ui } from '../lib/store.ts'
import { useSectionLink } from '../components/Header.tsx'

const WORKSHOPS = OUTLETS.filter((o) => o.kind === 'workshop')

export default function Service() {
  const root = useRef<HTMLElement>(null)
  const go = useSectionLink()

  useGsap(root, ({ reduced, desktop }) => {
    const el = root.current!
    revealChildren(el, reduced)
    if (reduced) return
    // The workshop photograph opens from a letterbox to full bleed.
    gsap
      .timeline({ scrollTrigger: { trigger: el.querySelector<HTMLElement>('.svc__reveal'), start: 'top top', end: desktop ? '+=120%' : '+=70%', pin: true, scrub: 0.6 } })
      .fromTo('.svc__frame', { clipPath: desktop ? 'inset(22% 26% 22% 26% round 24px)' : 'inset(18% 8% 18% 8% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut' }, 0)
      .fromTo('.svc__frame .img', { scale: 1.25 }, { scale: 1, ease: 'power2.inOut' }, 0)
      .fromTo('.svc__over .split-i', { yPercent: 115 }, { yPercent: 0, stagger: 0.04, ease: 'expo.out', duration: 0.5 }, 0.45)
      .fromTo('.svc__over-sub', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.7)
    gsap.utils.toArray<HTMLElement>('.svc__card', el).forEach((card, i, all) => {
      if (i === all.length - 1 || !desktop) return
      gsap.to(card, { scale: 0.94, filter: 'brightness(0.55)', ease: 'none', scrollTrigger: { trigger: all[i + 1], start: 'top bottom', end: 'top 20%', scrub: true } })
    })
  })

  return (
    <section ref={root} className="section svc" id="service" data-section="service" data-theme="dark" aria-labelledby="svc-title">
      <div className="svc__reveal">
        <div className="svc__frame">
          <Img src={PHOTOS.service[0]} alt="Service bays inside a Shital Motors Mahindra workshop" sizes="100vw" />
          <div className="svc__shade" aria-hidden="true" />
        </div>
        <div className="svc__over wrap">
          <p className="eyebrow">Service &amp; ownership</p>
          <h2 id="svc-title" className="svc__title display">
            <Split text={'Service at\npit-stop pace.'} />
          </h2>
          <p className="lead svc__over-sub">Scheduled service done in 90 minutes, body repairs estimated scientifically, and help on the road for up to 8 years.</p>
        </div>
      </div>

      <div className="wrap svc__body">
        <aside className="svc__aside">
          <div className="svc__book">
            <p className="eyebrow" data-reveal>
              Book a service
            </p>
            <a className="svc__phone display num" href={telHref(BUSINESS.phones.serviceBooking)} data-reveal>
              {formatPhone(BUSINESS.phones.serviceBooking)}
            </a>
            <p className="muted" data-reveal>
              Ahmedabad service booking line. Or request a slot online and the workshop will call you back.
            </p>
            <div className="svc__actions" data-reveal>
              <button className="btn btn--red" onClick={() => openTestDrive({ type: 'service' })}>
                Request a service slot
              </button>
              <a className="btn btn--ghost" href={telHref(BUSINESS.phones.serviceBooking)}>
                <Icon name="phone" /> Call
              </a>
            </div>
          </div>

          <ul className="svc__workshops" aria-label="Workshops">
            {WORKSHOPS.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    ui.set({ outlet: w.id })
                    go('network')
                  }}
                >
                  <span>
                    <span className="svc__ws-name">{w.name}</span>
                    <span className="mono muted">
                      {w.city} · {w.hours.map((h) => `${h.days} ${h.time}`).join(', ')}
                    </span>
                  </span>
                  <Icon name="pin" />
                </button>
              </li>
            ))}
          </ul>

          <div className="svc__links">
            <a href={BUSINESS.ownerApps.rsa} target="_blank" rel="noreferrer" className="link-arrow">
              Buy Roadside Assistance <Icon name="external" size={15} />
            </a>
            <a href={BUSINESS.ownerApps.shield} target="_blank" rel="noreferrer" className="link-arrow">
              Buy Mahindra Shield <Icon name="external" size={15} />
            </a>
          </div>
        </aside>

        <ol className="svc__cards">
          {SERVICE_OFFERINGS.map((s, i) => (
            <li key={s.id} className="svc__card" style={{ ['--i' as string]: i }}>
              <div className="svc__card-top mono">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>{s.title}</span>
              </div>
              <p className="svc__stat display num">
                {s.stat}
                <span className="svc__stat-unit mono">{s.statUnit}</span>
              </p>
              <h3 className="h3">{s.title}</h3>
              <p className="muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="wrap svc__gallery" aria-label="Inside our workshops">
        {PHOTOS.service.slice(1, 5).map((src, i) => (
          <figure key={src} data-reveal>
            <Img src={src} alt={['Customer lounge at a Shital Motors workshop', 'Waiting area with seating', 'Service advisor desks', 'Workshop entrance'][i]} sizes="(min-width: 960px) 25vw, 50vw" />
          </figure>
        ))}
      </div>
    </section>
  )
}
