import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type MotionPreference = 'auto' | 'full' | 'reduced'

export interface MotionState {
  /** Final decision: animate scroll choreography or not. */
  reduced: boolean
  /** System-level prefers-reduced-motion. */
  systemReduced: boolean
  /** Weak CPU / memory / data-saver: skip WebGL and heavy effects. */
  lowPower: boolean
  /** Hardware-accelerated WebGL is available. */
  webgl: boolean
  /** Whether the 3D network scene should be used. */
  allow3D: boolean
  preference: MotionPreference
  setPreference: (p: MotionPreference) => void
}

const KEY = 'sm-motion'

function readPref(): MotionPreference {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'full' || v === 'reduced' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function detectLowPower(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } }
  if (nav.connection?.saveData) return true
  if (nav.connection?.effectiveType && /(^|-)2g|3g/.test(nav.connection.effectiveType)) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return true
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return true
  return false
}

function detectWebGL(): boolean {
  try {
    // QA override for headless browsers, which only have a software GPU.
    if (localStorage.getItem('sm-force-3d') === '1') return true
  } catch {
    /* storage unavailable */
  }
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // Software rasterisers are too slow for a pleasant scene.
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  }
}

const MotionContext = createContext<MotionState | null>(null)

export function MotionProvider({ children }: { children: ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [preference, setPreferenceState] = useState<MotionPreference>(readPref)
  const [env] = useState(() => ({ lowPower: detectLowPower(), webgl: detectWebGL() }))

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setSystemReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const value = useMemo<MotionState>(() => {
    const reduced = preference === 'reduced' || (preference === 'auto' && systemReduced)
    return {
      reduced,
      systemReduced,
      lowPower: env.lowPower,
      webgl: env.webgl,
      allow3D: env.webgl && !reduced && !(env.lowPower && preference !== 'full'),
      preference,
      setPreference: (p) => {
        setPreferenceState(p)
        try {
          if (p === 'auto') localStorage.removeItem(KEY)
          else localStorage.setItem(KEY, p)
        } catch {
          /* storage unavailable — preference lasts for this visit */
        }
      },
    }
  }, [preference, systemReduced, env])

  useEffect(() => {
    document.documentElement.dataset.motion = value.reduced ? 'reduced' : 'full'
  }, [value.reduced])

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export function useMotion(): MotionState {
  const ctx = useContext(MotionContext)
  if (!ctx) throw new Error('useMotion must be used inside MotionProvider')
  return ctx
}
