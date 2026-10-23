import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
const tick = (time: number) => lenis?.raf(time * 1000)

/** Smooth wheel scrolling (touch stays native). Disabled entirely for reduced motion. */
export function enableSmoothScroll(enabled: boolean) {
  if (enabled && !lenis) {
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 0.9 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
  } else if (!enabled && lenis) {
    gsap.ticker.remove(tick)
    lenis.destroy()
    lenis = null
  }
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

export function scrollToTarget(target: string | HTMLElement | number, opts: { immediate?: boolean; offset?: number } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (el === null) return
  const reduced = document.documentElement.dataset.motion === 'reduced'
  if (lenis) {
    lenis.scrollTo(el, { offset: opts.offset ?? 0, immediate: opts.immediate || reduced, duration: 1.4 })
    return
  }
  const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0)
  window.scrollTo({ top, behavior: opts.immediate || reduced ? 'auto' : 'smooth' })
}

export { gsap, ScrollTrigger }
