import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { MEDIA } from '../data/media.generated.ts'
import { gsap } from '../lib/scroll.ts'
import { useMotion } from '../lib/motion.tsx'

interface ImgProps {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  sizes?: string
  srcSet?: string
  lqip?: string
  eager?: boolean
  width?: number
  height?: number
}

/** Image with a blurred placeholder that cross-fades once decoded. */
export function Img({ src, alt, className = '', style, sizes, srcSet, lqip, eager, width, height }: ImgProps) {
  const meta = MEDIA[src]
  const [loaded, setLoaded] = useState(false)
  const placeholder = lqip ?? meta?.lqip
  return (
    <div className={`img ${loaded ? 'is-loaded' : ''} ${className}`} style={{ ...(placeholder && !loaded ? { backgroundImage: `url(${placeholder})` } : {}), ...style }}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width ?? meta?.w}
        height={height ?? meta?.h}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        // @ts-expect-error fetchpriority is valid HTML but not yet in React 18 types
        fetchpriority={eager ? 'high' : undefined}
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          if (el?.complete && el.naturalWidth && !loaded) setLoaded(true)
        }}
      />
    </div>
  )
}

/** Splits text into word spans for masked reveals; screen readers get the plain string. */
export function Split({ text, as: Tag = 'span', className }: { text: string; as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'; className?: string }) {
  const lines = text.split('\n')
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" style={{ display: lines.length > 1 ? 'block' : undefined }}>
          {line.split(' ').map((w, wi, arr) => (
            <span className="split-w" key={wi}>
              <span className="split-i">
                {w}
                {wi < arr.length - 1 ? ' ' : ''}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}

export function Eyebrow({ children, dot, className = '' }: { children: ReactNode; dot?: boolean; className?: string }) {
  return <span className={`eyebrow ${dot ? 'eyebrow--dot' : ''} ${className}`}>{children}</span>
}

const paths: Record<string, ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M20 12H5m6-6-6 6 6 6" />,
  phone: (
    <path d="M6.6 3.5h2.6l1.4 4.1-2 1.4a12 12 0 0 0 6.4 6.4l1.4-2 4.1 1.4v2.6a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 8h16M4 16h16" />,
  spark: <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M18 6l-2.5 2.5m-7 7L6 18" />,
  send: <path d="M4 12 20 4l-6 16-3-7-7-1Z" />,
  wheel: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3.5v6M5 15.5l5-2.5m9 2.5-5-2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  external: <path d="M14 4h6v6m0-6-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
}

export function Icon({ name, size = 18, stroke = 1.6, className }: { name: keyof typeof paths | string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}

/**
 * Animated integer. Tweens from the previous value (or `from` once it scrolls into view)
 * to `value`. Renders the final value immediately for reduced motion.
 */
export function Counter({ value, from, suffix = '', className }: { value: number; from?: number; suffix?: string; className?: string }) {
  const { reduced } = useMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(from ?? value)
  const current = useRef(from ?? value)
  const [visible, setVisible] = useState(from === undefined)

  useEffect(() => {
    if (visible || !ref.current) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '0px 0px -10% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    if (reduced) {
      current.current = value
      setShown(value)
      return
    }
    const obj = { v: current.current }
    const tween = gsap.to(obj, {
      v: value,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => {
        current.current = obj.v
        setShown(Math.round(obj.v))
      },
    })
    return () => {
      tween.kill()
    }
  }, [value, visible, reduced])

  return (
    <span ref={ref} className={className}>
      {reduced ? value : shown}
      {suffix}
    </span>
  )
}
