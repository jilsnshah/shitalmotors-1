import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MODELS } from '../data/models.generated.ts'
import { BUSINESS, OUTLETS, formatLakh } from '../data/business.ts'
import { model3DFor } from '../data/models3d.ts'
import { Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { useGsap, useInViewport, useMediaQuery } from '../lib/hooks.ts'
import { useMotion } from '../lib/motion.tsx'
import { openTestDrive } from '../lib/store.ts'
import { useSectionLink } from '../components/Header.tsx'

const HeroCar = lazy(() => import('../three/HeroCar.tsx'))

// Photo mode (no WebGL / reduced motion): three featured models cross the studio.
const FEATURED = ['thar-roxx', 'xuv-7xo', 'xev-9e'].map((s) => MODELS.find((m) => m.slug === s)!)
// 3D mode: the Thar ROXX in three of its listed colours.
const ROXX = MODELS.find((m) => m.slug === 'thar-roxx')!
const ROXX_3D = model3DFor('thar-roxx')!
const PAINTS = ['Nebula Blue', 'Tango Red', 'Everest White'].map((n) => ROXX.colors.find((c) => c.name === n)!).filter(Boolean)

const SHOWROOMS = OUTLETS.filter((o) => o.kind === 'showroom').length
const WORKSHOPS = OUTLETS.filter((o) => o.kind === 'workshop').length

class Fallback extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const progress = useRef(0)
  const [active, setActive] = useState(0)
  const [carReady, setCarReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const { reduced, allow3D } = useMotion()
  const compact = useMediaQuery('(max-width: 959.98px)')
  const inView = useInViewport(root)
  const go = useSectionLink()
  const use3D = allow3D && !failed
  const steps = use3D ? PAINTS.length : FEATURED.length

  // Scroll choreography: pin the studio; 3D mode orbits the car and changes paint,
  // photo mode slides the three featured models through.
  useGsap(
    root,
    ({ reduced, desktop }) => {
      const el = root.current!
      if (reduced) return
      const cars = gsap.utils.toArray<HTMLElement>('.hero__car', el)
      if (!use3D) gsap.set(cars.slice(1), { autoAlpha: 0, xPercent: 40 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: desktop ? '+=220%' : '+=160%',
          pin: el.querySelector<HTMLElement>('.hero__pin'),
          scrub: 0.6,
          onUpdate: (st) => {
            progress.current = st.progress
            setActive(Math.min(steps - 1, Math.floor(st.progress * steps * 0.999 + 0.12)))
          },
        },
      })
      tl.to('.hero__word', { xPercent: -18 }, 0)
      if (!use3D)
        cars.forEach((car, i) => {
          if (i === 0) return
          const at = i - 0.55
          tl.to(cars[i - 1], { xPercent: -45, autoAlpha: 0, scale: 0.92, duration: 0.5, ease: 'power2.in' }, at)
          tl.to(car, { xPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, at + 0.3)
        })
      tl.to('.hero__copy', { yPercent: -12, autoAlpha: 0, duration: 0.6 }, 0.15)
      tl.to({}, { duration: use3D ? 1.6 : 0.35 })
      return () => {
        progress.current = 0
        setActive(0)
      }
    },
    [use3D],
  )

  // Intro once the loader starts to wipe away.
  useEffect(() => {
    if (!ready || reduced || !root.current) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.hero__title .split-i', { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.08 }, 0)
        .fromTo('.hero__word', { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1.8 }, 0)
        .fromTo('.hero__car-intro', { xPercent: 18, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1.6 }, 0.15)
        .fromTo('.hero__fade', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.45)
    }, root)
    return () => ctx.revert()
  }, [ready, reduced])

  const m = use3D ? ROXX : FEATURED[active]
  const paint = PAINTS[Math.min(active, PAINTS.length - 1)]
  return (
    <section ref={root} className="section hero on-light plate" id="top" data-section="hero" data-theme="light" aria-labelledby="hero-title">
      <div className="hero__pin">
        <div className="hero__word display" aria-hidden="true">
          SINCE&nbsp;{BUSINESS.since}
        </div>

        <div className={`hero__stage ${use3D ? 'is-3d' : ''} ${carReady ? 'is-ready' : ''}`}>
          {(use3D ? [ROXX] : FEATURED).map((f, i) => (
            <div key={f.slug} className="hero__car hero__photo" aria-hidden={i !== active}>
              <div className={i === 0 ? 'hero__car-intro' : undefined}>
                <Img
                  src={f.image}
                  srcSet={`${f.imageSm} 560w, ${f.image} 930w`}
                  sizes="(min-width: 960px) 62vw, 100vw"
                  alt={`${f.fullName}, front three-quarter view`}
                  className="feather"
                  lqip={f.lqip}
                  eager={i === 0}
                  width={930}
                  height={620}
                />
              </div>
            </div>
          ))}
          {use3D && (
            <div className="hero__3d hero__car-intro" aria-hidden="true">
              <Fallback onError={() => setFailed(true)}>
                <Suspense fallback={null}>
                  <HeroCar
                    asset={ROXX_3D}
                    paint={paint?.hex ?? '#3c5c76'}
                    progress={progress}
                    active={inView}
                    compact={compact}
                    onReady={() => setCarReady(true)}
                    onFail={() => setFailed(true)}
                  />
                </Suspense>
              </Fallback>
            </div>
          )}
        </div>

        <div className="hero__copy wrap">
          <p className="eyebrow eyebrow--dot hero__fade">Authorised Mahindra dealer · Gujarat</p>
          <h1 id="hero-title" className="hero__title display">
            <Split text={'Shital\nMotors'} />
          </h1>
          <p className="lead hero__lead hero__fade">
            Mahindra SUVs, electric SUVs and commercial vehicles — {SHOWROOMS} showrooms and {WORKSHOPS} workshops across Ahmedabad, Sanand and
            Surendranagar.
          </p>
          <div className="hero__ctas hero__fade">
            <button className="btn btn--ink" onClick={() => go('lineup')}>
              Explore the line-up <Icon name="arrow" />
            </button>
            <button className="btn btn--ghost" onClick={() => openTestDrive({ model: m.slug })}>
              Book a test drive
            </button>
          </div>
        </div>

        <div className="hero__caption wrap hero__fade" aria-live="polite">
          <div className="hero__count mono num" aria-hidden="true">
            <span>0{active + 1}</span>
            <span className="hero__count-bar">
              <span style={{ transform: `scaleX(${(active + 1) / steps})` }} />
            </span>
            <span>0{steps}</span>
          </div>
          <Link to={`/models/${m.slug}`} className="hero__model" key={use3D ? paint?.name : m.slug}>
            {use3D && paint && <span className="hero__swatch" style={{ background: paint.hex }} aria-hidden="true" />}
            <span className="hero__model-name">{m.fullName}</span>
            <span className="mono hero__model-price">{use3D && paint ? `${paint.name} · ` : ''}from {formatLakh(m.priceFrom)}*</span>
            <Icon name="arrow" />
          </Link>
        </div>
        {use3D && carReady && (
          <p className="hero__credit mono">
            3D: “{ROXX_3D.title}” by {ROXX_3D.author}, {ROXX_3D.license}
          </p>
        )}

        <div className="hero__scroll mono" aria-hidden="true">
          <span>Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </div>
    </section>
  )
}
