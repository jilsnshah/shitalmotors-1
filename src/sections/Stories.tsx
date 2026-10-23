import { useRef, useState } from 'react'
import { AWARDS, AWARD_NOTES, FILMS, PHOTOS } from '../data/business.ts'
import { TESTIMONIALS } from '../data/testimonials.generated.ts'
import { Icon, Img, Split } from '../components/primitives.tsx'
import { gsap } from '../lib/scroll.ts'
import { revealChildren, useGsap, useNearViewport } from '../lib/hooks.ts'

const ROW_A = PHOTOS.deliveries.slice(0, 9)
const ROW_B = PHOTOS.deliveries.slice(9)

function Film({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <figure className="film">
      <div className="film__frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button className="film__poster" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" width={480} height={360} />
            <span className="film__play">
              <Icon name="play" size={20} />
            </span>
          </button>
        )}
      </div>
      <figcaption className="mono">{title}</figcaption>
    </figure>
  )
}

export default function Stories() {
  const root = useRef<HTMLElement>(null)
  const [i, setI] = useState(0)
  const [filmsRef, filmsNear] = useNearViewport<HTMLDivElement>('400px')
  const t = TESTIMONIALS[i]

  useGsap(root, ({ reduced, desktop }) => {
    const el = root.current!
    revealChildren(el, reduced)
    if (reduced) return
    const st = { trigger: el.querySelector<HTMLElement>('.stories__reel'), start: 'top bottom', end: 'bottom top', scrub: 0.5 }
    gsap.fromTo('.stories__row--a', { xPercent: 0 }, { xPercent: desktop ? -28 : -45, ease: 'none', scrollTrigger: st })
    gsap.fromTo('.stories__row--b', { xPercent: desktop ? -28 : -45 }, { xPercent: 0, ease: 'none', scrollTrigger: st })
    gsap.utils.toArray<HTMLElement>('.award', el).forEach((a, k) => {
      gsap.from(a.querySelector('.award__img'), { y: 60 + k * 18, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el.querySelector<HTMLElement>('.awards'), start: 'top 75%', once: true } })
    })
  })

  const step = (d: number) => setI((n) => (n + d + TESTIMONIALS.length) % TESTIMONIALS.length)

  return (
    <section ref={root} className="section stories" id="stories" data-section="stories" data-theme="dark" aria-labelledby="stories-title">
      <div className="wrap stories__head">
        <p className="eyebrow" data-reveal>
          Delivering happiness
        </p>
        <h2 id="stories-title" className="h2" data-reveal>
          <Split text="Every handover is somebody's big day." />
        </h2>
      </div>

      <div className="stories__reel" aria-label="Delivery moments at Shital Motors">
        {[ROW_A, ROW_B].map((row, r) => (
          <ul key={r} className={`stories__row stories__row--${r ? 'b' : 'a'}`}>
            {[...row, ...row.slice(0, 3)].map((src, k) => (
              <li key={`${src}-${k}`} aria-hidden={k >= row.length}>
                <Img src={src} alt={k >= row.length ? '' : 'A Shital Motors customer family taking delivery of a new Mahindra'} sizes="(min-width: 960px) 24vw, 60vw" />
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="wrap quotes">
        <div className="quotes__meta">
          <p className="eyebrow">In their words</p>
          <p className="mono muted num">
            {String(i + 1).padStart(2, '0')} / {String(TESTIMONIALS.length).padStart(2, '0')}
          </p>
          <div className="quotes__nav">
            <button className="btn btn--ghost btn--sm" onClick={() => step(-1)} aria-label="Previous review">
              <Icon name="arrowLeft" />
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => step(1)} aria-label="Next review">
              <Icon name="arrow" />
            </button>
          </div>
          <p className="mono muted quotes__src">Verbatim reviews published on shitalmotors.com</p>
        </div>
        <figure className="quote" key={i} aria-live="polite">
          <div className="quote__stars" aria-label={`${t.rating} out of 5 stars`}>
            {'★★★★★'.slice(0, t.rating)}
          </div>
          <blockquote className="quote__text" lang={/[઀-૿]/.test(t.text) ? 'gu' : undefined}>
            “{t.text.length > 420 ? `${t.text.slice(0, t.text.lastIndexOf(' ', 400))}…` : t.text}”
          </blockquote>
          <figcaption>
            <span className="quote__author">{t.author}</span>
            <span className="chip">{t.context}</span>
          </figcaption>
        </figure>
      </div>

      <div className="awards">
        <div className="wrap">
          <div className="awards__head">
            <p className="eyebrow" data-reveal>
              Recognition from Mahindra
            </p>
            <ul className="awards__notes mono muted" data-reveal>
              {AWARD_NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <ul className="awards__row">
            {AWARDS.map((a) => (
              <li className="award" key={a.img}>
                <div className="award__img">
                  <Img src={a.img} alt={`${a.title} award`} sizes="(min-width: 960px) 22vw, 45vw" />
                </div>
                <p className="award__title">{a.title}</p>
                <p className="mono muted">
                  {a.detail}
                  {a.year && ` · ${a.year}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="wrap films" ref={filmsRef}>
        <div className="films__head">
          <p className="eyebrow" data-reveal>
            Films from the floor
          </p>
          <p className="muted" data-reveal>
            Published on the dealership's YouTube channel. Videos load only when you press play.
          </p>
        </div>
        <div className="films__row">{filmsNear ? FILMS.map((f) => <Film key={f.id} id={f.id} title={f.title} />) : FILMS.map((f) => <div key={f.id} className="film film--ph" />)}</div>
      </div>
    </section>
  )
}
