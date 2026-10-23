// SVG fallback for the network scene: same projection, same interactions, no WebGL.
import type { Outlet } from '../../data/types.ts'
import { CITIES, RINGS, RING_CENTRE, outletPos } from '../../lib/geo.ts'

interface Props {
  outlets: Outlet[]
  visible: Set<string>
  selected: string | null
  hovered: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const VIEW_W = 124
const VIEW_H = 92

export default function NetworkMap2D({ outlets, visible, selected, hovered, onSelect, onHover }: Props) {
  const sel = outlets.find((o) => o.id === selected)
  // Overview frames the whole network; a selection zooms to that outlet.
  const [cx, cz] = sel ? outletPos(sel) : [-2, 2]
  const scale = sel ? 3.2 : 1
  const r = (n: number) => n / scale

  return (
    <svg className="map2d" viewBox={`${-VIEW_W / 2} ${-VIEW_H / 2} ${VIEW_W} ${VIEW_H}`} role="presentation" aria-hidden="true">
      <defs>
        <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5 0H0V5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.12" />
        </pattern>
        <radialGradient id="map-glow">
          <stop offset="0" stopColor="rgba(227,24,55,0.28)" />
          <stop offset="1" stopColor="rgba(227,24,55,0)" />
        </radialGradient>
      </defs>
      <g className="map2d__world" style={{ transform: `scale(${scale}) translate(${-cx}px, ${-cz}px)` }}>
        <rect x={-300} y={-300} width={600} height={600} fill="url(#map-grid)" />
        <circle cx={RING_CENTRE[0]} cy={RING_CENTRE[1]} r={26} fill="url(#map-glow)" />
        {RINGS.map((ring) => (
          <g key={ring}>
            <circle cx={RING_CENTRE[0]} cy={RING_CENTRE[1]} r={ring} fill="none" stroke="rgba(160,165,175,0.35)" strokeWidth={r(0.18)} strokeDasharray={`${r(0.9)} ${r(0.9)}`} />
            <text x={RING_CENTRE[0] + ring * 0.7071} y={RING_CENTRE[1] - ring * 0.7071} className="map2d__ring" fontSize={r(2)}>
              {ring} km
            </text>
          </g>
        ))}
        {CITIES.map((c) => (
          <text key={c.name} x={c.pos[0]} y={c.pos[1] + 6.5} className="map2d__city" fontSize={r(2.6)} textAnchor="middle">
            {c.name}
          </text>
        ))}
        {outlets.map((o) => {
          const [x, z] = outletPos(o)
          const on = visible.has(o.id)
          const active = o.id === selected || o.id === hovered
          return (
            <g
              key={o.id}
              className={`map2d__pin map2d__pin--${o.kind} ${on ? '' : 'is-dim'} ${active ? 'is-active' : ''}`}
              transform={`translate(${x} ${z})`}
              onClick={() => onSelect(o.id)}
              onPointerEnter={() => onHover(o.id)}
              onPointerLeave={() => onHover(null)}
            >
              <circle r={r(3.2)} className="map2d__hit" />
              <circle r={r(active ? 2.6 : 1.8)} className="map2d__pulse" />
              <circle r={r(active ? 1.3 : 0.95)} className="map2d__dot" />
              {active && (
                <text y={r(-2.6)} fontSize={r(2.3)} textAnchor="middle" className="map2d__label">
                  {o.name}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
