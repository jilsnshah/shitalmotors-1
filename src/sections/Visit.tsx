import { useRef } from 'react'
import { BUSINESS, OUTLETS, formatPhone, telHref } from '../data/business.ts'
import { Icon, Split } from '../components/primitives.tsx'
import { revealChildren, useGsap } from '../lib/hooks.ts'
import { openState } from '../lib/hours.ts'
import { openTestDrive, ui } from '../lib/store.ts'
import { useSectionLink } from '../components/Header.tsx'

const SHOWROOMS = OUTLETS.filter((o) => o.kind === 'showroom')

export default function Visit() {
  const root = useRef<HTMLElement>(null)
  const go = useSectionLink()
  useGsap(root, ({ reduced }) => revealChildren(root.current!, reduced))

  return (
    <section ref={root} className="section visit" id="visit" data-section="visit" data-theme="dark" aria-labelledby="visit-title">
      <div className="wrap visit__grid">
        <div>
          <p className="eyebrow" data-reveal>
            Visit a showroom
          </p>
          <h2 id="visit-title" className="visit__title display" data-reveal>
            <Split text={'Come see it\nin person.'} />
          </h2>
          <div className="visit__ctas" data-reveal>
            <button className="btn btn--lg" onClick={() => openTestDrive()}>
              Book a test drive <Icon name="arrow" />
            </button>
            <a className="btn btn--ghost" href={telHref(BUSINESS.phones.sales[0])}>
              <Icon name="phone" /> {formatPhone(BUSINESS.phones.sales[0])}
            </a>
          </div>
        </div>
        <ul className="visit__list" aria-label="Showrooms">
          {SHOWROOMS.map((o) => {
            const st = openState(o)
            return (
              <li key={o.id} data-reveal>
                <button
                  type="button"
                  onClick={() => {
                    ui.set({ outlet: o.id })
                    go('network')
                  }}
                >
                  <span className="visit__name">{o.name}</span>
                  <span className="mono visit__state">{st.label}</span>
                </button>
                <a href={telHref(o.phones[0])} className="visit__call" aria-label={`Call ${o.name} showroom ${formatPhone(o.phones[0])}`}>
                  <Icon name="phone" size={18} />
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
