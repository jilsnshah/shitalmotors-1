import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useMotion } from './lib/motion.tsx'
import { enableSmoothScroll, scrollToTarget, ScrollTrigger } from './lib/scroll.ts'
import Header from './components/Header.tsx'
import Footer from './components/Footer.tsx'
import Loader from './components/Loader.tsx'
import TestDriveSheet from './components/TestDriveSheet.tsx'
import Concierge from './components/concierge/Concierge.tsx'
import Home from './pages/Home.tsx'

const ModelPage = lazy(() => import('./pages/ModelPage.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))

export default function App() {
  const { reduced } = useMotion()
  const location = useLocation()
  const [booted, setBooted] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    enableSmoothScroll(!reduced)
    ScrollTrigger.refresh()
  }, [reduced])

  // Route changes: jump to a hash target if present, otherwise to the top.
  useEffect(() => {
    const id = location.hash.slice(1)
    const t = window.setTimeout(() => {
      if (id && document.getElementById(id)) scrollToTarget(`#${id}`, { immediate: true })
      else window.scrollTo(0, 0)
      ScrollTrigger.refresh()
    }, 30)
    return () => window.clearTimeout(t)
  }, [location.pathname, location.hash])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!booted && <Loader onReveal={() => setRevealed(true)} onDone={() => setBooted(true)} />}
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home ready={revealed} />} />
            <Route path="/models/:slug" element={<ModelPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <TestDriveSheet />
      <Concierge />
    </>
  )
}
