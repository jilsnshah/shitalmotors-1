import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { gsap, ScrollTrigger } from './scroll.ts'
import { useMotion } from './motion.tsx'
import { ui } from './store.ts'

export interface GsapEnv {
  reduced: boolean
  desktop: boolean
}

/**
 * Runs GSAP setup scoped to `scope`, re-running when motion preference or the
 * desktop breakpoint changes. Everything created inside is reverted on cleanup.
 */
export function useGsap(scope: RefObject<HTMLElement | null>, setup: (env: GsapEnv) => void | (() => void), deps: unknown[] = []) {
  const { reduced } = useMotion()
  useLayoutEffect(() => {
    if (!scope.current) return
    const mm = gsap.matchMedia(scope.current)
    mm.add({ desktop: '(min-width: 960px)', mobile: '(max-width: 959.98px)' }, (ctx) => {
      return setup({ reduced, desktop: Boolean(ctx.conditions?.desktop) })
    })
    return () => mm.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps])
}

/** Tracks which [data-section] is at the viewport centre and its theme. */
export function useSectionTracker(deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          ui.set({ section: el.dataset.section!, theme: (el.dataset.theme as 'dark' | 'light') ?? 'dark' })
        }
      },
      { rootMargin: '-50% 0px -49.9% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** True once the element has come within `margin` of the viewport (for deferring heavy work). */
export function useNearViewport<T extends HTMLElement>(margin = '600px'): [RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (!ref.current || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: margin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near, margin])
  return [ref, near]
}

export function useInViewport<T extends HTMLElement>(ref: RefObject<T | null>, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/** Standard "rise into view" for elements marked [data-reveal] inside the scope. */
export function revealChildren(scope: HTMLElement, reduced: boolean) {
  const items = scope.querySelectorAll<HTMLElement>('[data-reveal]')
  if (reduced) return
  items.forEach((el) => {
    const words = el.querySelectorAll('.split-i')
    const targets = words.length ? words : [el]
    gsap.from(targets, {
      yPercent: words.length ? 110 : 0,
      y: words.length ? 0 : 28,
      opacity: words.length ? 1 : 0,
      duration: words.length ? 1.05 : 0.9,
      ease: 'expo.out',
      stagger: words.length ? 0.045 : 0,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
  })
}

export const refreshScroll = () => requestAnimationFrame(() => ScrollTrigger.refresh())
