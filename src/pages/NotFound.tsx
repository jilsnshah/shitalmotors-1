import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ui } from '../lib/store.ts'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found | Shital Motors'
    ui.set({ section: 'notfound', theme: 'dark' })
  }, [])
  return (
    <section className="notfound wrap" data-theme="dark">
      <p className="eyebrow">404</p>
      <h1 className="h2">Wrong turn.</h1>
      <p className="lead muted">That page isn't on our map. Head back to the showroom floor.</p>
      <Link to="/" className="btn btn--red">
        Back to home
      </Link>
    </section>
  )
}
