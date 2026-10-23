import { Link } from 'react-router-dom'
import { BUSINESS, OUTLETS, formatPhone, telHref } from '../data/business.ts'
import { MODELS } from '../data/models.generated.ts'
import { useMotion, type MotionPreference } from '../lib/motion.tsx'
import { NAV, Wordmark, useSectionLink } from './Header.tsx'
import { MODELS_3D } from '../data/models3d.ts'

export default function Footer() {
  const { preference, setPreference, systemReduced, allow3D } = useMotion()
  const go = useSectionLink()
  return (
    <footer className="footer" data-section="footer" data-theme="dark">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <Wordmark />
          <p className="muted">
            Authorised Mahindra dealer for personal and commercial vehicles in Gujarat since {BUSINESS.since}. Sales, service and spares across Ahmedabad,
            Sanand and Surendranagar.
          </p>
          <div className="footer__social">
            <a href={BUSINESS.social.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={BUSINESS.social.facebook} target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href={BUSINESS.social.twitter} target="_blank" rel="noreferrer">
              X / Twitter
            </a>
          </div>
        </div>

        <div>
          <h2 className="footer__h mono">Contact</h2>
          <ul className="footer__list">
            <li>
              Sales{' '}
              {BUSINESS.phones.sales.map((p, i) => (
                <span key={p}>
                  {i > 0 && ' / '}
                  <a href={telHref(p)}>{formatPhone(p)}</a>
                </span>
              ))}
            </li>
            <li>
              Service{' '}
              {BUSINESS.phones.service.map((p, i) => (
                <span key={p}>
                  {i > 0 && ' / '}
                  <a href={telHref(p)}>{formatPhone(p)}</a>
                </span>
              ))}
            </li>
            <li>
              <a href={`mailto:${BUSINESS.email.customerCare}`}>{BUSINESS.email.customerCare}</a>
            </li>
            <li className="muted">Working hours {BUSINESS.workingHours}</li>
          </ul>
        </div>

        <div>
          <h2 className="footer__h mono">Models</h2>
          <ul className="footer__list footer__cols">
            {MODELS.map((m) => (
              <li key={m.slug}>
                <Link to={`/models/${m.slug}`}>{m.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="footer__h mono">Explore</h2>
          <ul className="footer__list">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`/#${n.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    go(n.id)
                  }}
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li className="muted">
              {OUTLETS.filter((o) => o.kind === 'showroom').length} showrooms · {OUTLETS.filter((o) => o.kind === 'workshop').length} workshops
            </li>
          </ul>
        </div>
      </div>

      <div className="wrap footer__base">
        <fieldset className="motion-toggle">
          <legend className="mono">Motion</legend>
          {(['auto', 'full', 'reduced'] as MotionPreference[]).map((p) => (
            <label key={p}>
              <input type="radio" name="motion" value={p} checked={preference === p} onChange={() => setPreference(p)} />
              <span>{p === 'auto' ? `Auto${systemReduced ? ' (reduced)' : ''}` : p === 'full' ? 'Full' : 'Reduced'}</span>
            </label>
          ))}
          <span className="mono muted motion-toggle__note">{allow3D ? '3D map on' : '3D map off · 2D map shown'}</span>
        </fieldset>
        <p className="footer__credits muted">
          3D models (CC BY 4.0, via Sketchfab, optimised for the web):{' '}
          {MODELS_3D.map((a, i) => (
            <span key={a.slug}>
              {i > 0 && ' · '}“<a href={a.sourceUrl} target="_blank" rel="noreferrer">{a.title}</a>” by {a.author}
            </span>
          ))}
          . Community-made models; details may differ from production vehicles.
        </p>
        <p className="footer__legal muted">
          Prices are ex-showroom Ahmedabad as listed by Shital Motors and are subject to change; contact the showroom for on-road prices, offers and
          availability. Vehicle images are representative. © {new Date().getFullYear()} {BUSINESS.legalName}.
        </p>
      </div>
    </footer>
  )
}
