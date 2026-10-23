import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll.ts'
import { useMotion } from '../lib/motion.tsx'

const WORD = 'SHITAL MOTORS'
const CRITICAL = ['/media/cars/mahindra-thar-roxx.webp', '/media/cars/mahindra-xuv-7xo.webp']

function preload(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

/** First-visit loader: waits for fonts and the hero photography (capped), then wipes away. */
export default function Loader({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const { reduced } = useMotion()
  const root = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const revealRef = useRef(onReveal)
  revealRef.current = onReveal

  useEffect(() => {
    let cancelled = false
    let done = 0
    const finish = () => doneRef.current()
    const tasks = [document.fonts?.ready.then(() => undefined) ?? Promise.resolve(), ...CRITICAL.map(preload)]
    tasks.forEach((t) =>
      t.then(() => {
        done += 1
        if (!cancelled) setProgress(done / tasks.length)
      }),
    )
    const minTime = new Promise((r) => setTimeout(r, reduced ? 150 : 1100))
    const cap = new Promise((r) => setTimeout(r, 2400))
    Promise.race([Promise.all([...tasks, minTime]), cap]).then(() => {
      if (cancelled || !root.current) return
      document.querySelector('.boot')?.remove()
      revealRef.current()
      if (reduced) {
        gsap.to(root.current, { opacity: 0, duration: 0.25, onComplete: finish })
        return
      }
      gsap
        .timeline({ onComplete: finish })
        .to(root.current.querySelectorAll('.loader__ch'), { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.02 })
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.25')
    })
    return () => {
      cancelled = true
    }
  }, [reduced])

  useEffect(() => {
    if (reduced || !root.current) return
    const tween = gsap.fromTo(root.current.querySelectorAll('.loader__ch'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.035, delay: 0.1 })
    return () => {
      tween.kill()
    }
  }, [reduced])

  return (
    <div className="loader" ref={root} role="status" aria-live="polite" aria-label="Loading Shital Motors">
      <div className="loader__word" aria-hidden="true">
        {WORD.split('').map((c, i) => (
          <span className="loader__mask" key={i}>
            <span className="loader__ch">{c === ' ' ? ' ' : c}</span>
          </span>
        ))}
      </div>
      <div className="loader__meta mono" aria-hidden="true">
        <span>Authorised Mahindra dealer</span>
        <span className="num">{String(Math.round(progress * 100)).padStart(3, '0')}</span>
      </div>
      <div className="loader__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  )
}
