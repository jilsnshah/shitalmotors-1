import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Model } from '../data/types.ts'
import type { Model3D } from '../data/models3d.ts'
import type { ViewerHandle } from '../three/CarViewer.tsx'
import { Icon } from '../components/primitives.tsx'
import { useInViewport, useNearViewport } from '../lib/hooks.ts'

const CarViewer = lazy(() => import('../three/CarViewer.tsx'))

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface Props {
  model: Model
  asset: Model3D
  color: number
  onColor: (i: number) => void
}

/** Interactive 360° studio for models that have a licensed 3D asset. */
export default function Studio3D({ model, asset, color, onColor }: Props) {
  const [nearRef, near] = useNearViewport<HTMLElement>('500px')
  const stageRef = useRef<HTMLDivElement>(null)
  const viewer = useRef<ViewerHandle>(null)
  const inView = useInViewport(stageRef, '100px')
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [touched, setTouched] = useState(false)
  const paintable = Boolean(asset.paintMaterials?.length)
  const c = model.colors[color]

  useEffect(() => setReady(false), [asset.src])
  if (failed) return null

  return (
    <section className="studio wrap" ref={nearRef} aria-labelledby="studio-title">
      <div className="studio__head">
        <p className="eyebrow eyebrow--dot">360° studio</p>
        <h2 id="studio-title" className="h3">
          Walk around the {model.name}
        </h2>
        <p className="muted studio__hint">Drag to turn it, or use the buttons. {paintable ? 'Pick a listed colour to repaint it.' : ''}</p>
      </div>

      <div className={`studio__stage plate ${ready ? 'is-ready' : ''}`} ref={stageRef}>
        {!ready && (
          <div className="studio__loading mono" role="status">
            <span className="studio__spinner" aria-hidden="true" /> Loading 3D model · {(asset.bytes / 1e6).toFixed(1)} MB
          </div>
        )}
        {near && (
          <Boundary onError={() => setFailed(true)}>
            <Suspense fallback={null}>
              <CarViewer
                ref={viewer}
                asset={asset}
                paint={paintable ? c?.hex : undefined}
                active={inView}
                autoRotate={!touched}
                onReady={() => setReady(true)}
                onFail={() => setFailed(true)}
                onInteract={() => setTouched(true)}
              />
            </Suspense>
          </Boundary>
        )}
        <div className="studio__controls">
          <button
            className="studio__btn"
            onClick={() => {
              setTouched(true)
              viewer.current?.rotate(-Math.PI / 4)
            }}
            aria-label="Rotate left"
          >
            <Icon name="arrowLeft" />
          </button>
          <button
            className="studio__btn"
            onClick={() => {
              setTouched(false)
              viewer.current?.reset()
            }}
            aria-label="Reset view"
          >
            <Icon name="wheel" />
          </button>
          <button
            className="studio__btn"
            onClick={() => {
              setTouched(true)
              viewer.current?.rotate(Math.PI / 4)
            }}
            aria-label="Rotate right"
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>

      <div className="studio__foot">
        {paintable && (
          <div className="studio__paint">
            <span className="mono">{c?.name}</span>
            <div className="mp__swatches" role="radiogroup" aria-label="Repaint the 3D model">
              {model.colors.map((col, i) => (
                <button
                  key={col.src}
                  role="radio"
                  aria-checked={i === color}
                  aria-label={col.name}
                  title={col.name}
                  className="swatch swatch--sm"
                  style={{ ['--sw' as string]: col.hex }}
                  onClick={() => onColor(i)}
                />
              ))}
            </div>
          </div>
        )}
        <p className="studio__credit mono">
          3D model “<a href={asset.sourceUrl} target="_blank" rel="noreferrer">{asset.title}</a>” by{' '}
          <a href={asset.authorUrl} target="_blank" rel="noreferrer">
            {asset.author}
          </a>
          , licensed{' '}
          <a href={asset.licenseUrl} target="_blank" rel="noreferrer">
            {asset.license}
          </a>
          ; optimised for the web{paintable ? ' and recoloured' : ''}. A community-made model — details may differ from the production vehicle.
        </p>
      </div>
    </section>
  )
}
