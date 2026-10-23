import { useEffect } from 'react'
import Hero from '../sections/Hero.tsx'
import Legacy from '../sections/Legacy.tsx'
import Lineup from '../sections/Lineup.tsx'
import Electric from '../sections/Electric.tsx'
import Commercial from '../sections/Commercial.tsx'
import Service from '../sections/Service.tsx'
import Network from '../sections/network/Network.tsx'
import Stories from '../sections/Stories.tsx'
import Visit from '../sections/Visit.tsx'
import { useSectionTracker, refreshScroll } from '../lib/hooks.ts'

export default function Home({ ready }: { ready: boolean }) {
  useSectionTracker()
  useEffect(() => {
    document.title = 'Shital Motors — Authorised Mahindra Dealer, Ahmedabad'
    // Pins depend on final layout; re-measure once fonts and images settle.
    const onLoad = () => refreshScroll()
    window.addEventListener('load', onLoad)
    document.fonts?.ready.then(onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return (
    <>
      <Hero ready={ready} />
      <Legacy />
      <Lineup />
      <Electric />
      <Commercial />
      <Service />
      <Network />
      <Stories />
      <Visit />
    </>
  )
}
