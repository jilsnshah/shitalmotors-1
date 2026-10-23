// The one place the site uses WebGL: Shital Motors' outlets plotted at their real coordinates,
// with distance rings for scale. Scroll eases the camera from the region into Ahmedabad;
// choosing an outlet flies to it. Loaded lazily, only on capable devices.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Outlet } from '../../data/types.ts'
import { CITIES, RINGS, RING_CENTRE, outletPos } from '../../lib/geo.ts'

export interface SceneProps {
  outlets: Outlet[]
  visible: Set<string>
  selected: string | null
  hovered: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  progress: MutableRefObject<number>
  active: boolean
  onFail: () => void
}

const RED = new THREE.Color('#ff2a48')
const WHITE = new THREE.Color('#e9f1ff')

const groundVertex = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const groundFragment = /* glsl */ `
  uniform vec2 uFocus;
  varying vec2 vWorld;
  float grid(vec2 p, float size, float width) {
    vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }
  void main() {
    float d = length(vWorld - uFocus);
    float minor = grid(vWorld, 5.0, 1.0) * 0.2;
    float major = grid(vWorld, 25.0, 1.4) * 0.38;
    float fade = 1.0 - smoothstep(30.0, 160.0, d);
    vec3 base = vec3(0.035, 0.036, 0.042);
    vec3 col = base + vec3(0.62, 0.66, 0.75) * (minor + major) * fade;
    // soft warm pool of light under the Ahmedabad cluster
    col += vec3(0.42, 0.05, 0.09) * (1.0 - smoothstep(0.0, 30.0, d)) * 0.5;
    gl_FragColor = vec4(col, 1.0);
  }
`

function Ground() {
  const uniforms = useMemo(() => ({ uFocus: { value: new THREE.Vector2(RING_CENTRE[0], RING_CENTRE[1]) } }), [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
      <planeGeometry args={[520, 520]} />
      <shaderMaterial vertexShader={groundVertex} fragmentShader={groundFragment} uniforms={uniforms} />
    </mesh>
  )
}

function Rings() {
  const lines = useMemo(
    () =>
      RINGS.map((r) => {
        const pts: THREE.Vector3[] = []
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2
          pts.push(new THREE.Vector3(RING_CENTRE[0] + Math.cos(a) * r, 0.02, RING_CENTRE[1] + Math.sin(a) * r))
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineDashedMaterial({ color: '#7d828d', dashSize: 1.2, gapSize: 1.4, transparent: true, opacity: 0.45 })
        const line = new THREE.Line(geo, mat)
        line.computeLineDistances()
        return { r, line }
      }),
    [],
  )
  useEffect(
    () => () =>
      lines.forEach(({ line }) => {
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      }),
    [lines],
  )
  return (
    <group>
      {lines.map(({ r, line }) => (
        <group key={r}>
          <primitive object={line} />
          <Html position={[RING_CENTRE[0] + r * 0.7071, 0, RING_CENTRE[1] - r * 0.7071]} center zIndexRange={[10, 0]} className="scene-ring-label">
            {r} km
          </Html>
        </group>
      ))}
    </group>
  )
}

const beamVertex = /* glsl */ `
  varying float vY;
  void main() { vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const beamFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uStrength;
  varying float vY;
  void main() { float a = pow(1.0 - vY, 1.6) * uStrength; gl_FragColor = vec4(uColor * a, a); }
`

function Pin({ o, dim, selected, hovered, onSelect, onHover }: { o: Outlet; dim: boolean; selected: boolean; hovered: boolean; onSelect: (id: string) => void; onHover: (id: string | null) => void }) {
  const [x, z] = outletPos(o)
  const color = o.kind === 'showroom' ? RED : WHITE
  const height = o.kind === 'showroom' ? 9 : 6
  const ring = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uColor: { value: color.clone() }, uStrength: { value: 0.9 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [color],
  )
  useEffect(() => () => beamMat.dispose(), [beamMat])
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  const outer = useRef<THREE.Group>(null)
  useFrame(({ clock, camera }, dt) => {
    if (outer.current) {
      // Screen-size compensation: pins grow with camera distance so the overview stays legible.
      const d = camera.position.distanceTo(outer.current.position)
      outer.current.scale.setScalar(THREE.MathUtils.clamp(d / 60, 0.7, 1.8))
    }
    const t = clock.elapsedTime + phase
    if (ring.current) {
      const p = (t * 0.45) % 1
      ring.current.scale.setScalar(1 + p * 3.2)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * (dim ? 0.08 : 0.55)
    }
    if (group.current) {
      const target = selected ? 1.45 : hovered ? 1.2 : dim ? 0.55 : 1
      const s = THREE.MathUtils.damp(group.current.scale.y, target, 6, dt)
      group.current.scale.set(1 + (s - 1) * 0.5, s, 1 + (s - 1) * 0.5)
    }
    beamMat.uniforms.uStrength.value = THREE.MathUtils.damp(beamMat.uniforms.uStrength.value, dim ? 0.15 : selected || hovered ? 1.4 : 0.85, 6, dt)
  })

  return (
    <group position={[x, 0, z]} ref={outer}>
      <group ref={group}>
        <mesh position={[0, height / 2, 0]} material={beamMat}>
          <cylinderGeometry args={[0.55, 0.55, height, 20, 1, true]} />
        </mesh>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.12, 0.12, height, 8]} />
          <meshBasicMaterial color={color} transparent opacity={dim ? 0.25 : 0.95} />
        </mesh>
        <mesh position={[0, height, 0]}>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshBasicMaterial color={color} transparent opacity={dim ? 0.3 : 1} />
        </mesh>
      </group>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.55, 0.72, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} />
      </mesh>
      {/* generous invisible hit target */}
      <mesh
        position={[0, height / 2, 0]}
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(o.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(o.id)
        }}
      >
        <cylinderGeometry args={[1.8, 1.8, height + 2, 8]} />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, height + 1.6, 0]} center zIndexRange={[20, 10]} className={`scene-label ${selected ? 'is-selected' : ''}`}>
          <span className="scene-label__kind">{o.kind}</span>
          <span className="scene-label__name">{o.name}</span>
        </Html>
      )}
    </group>
  )
}

function CameraRig({ outlets, selected, progress }: { outlets: Outlet[]; selected: string | null; progress: MutableRefObject<number> }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const targetPos = useMemo(() => new THREE.Vector3(), [])
  const targetLook = useMemo(() => new THREE.Vector3(), [])
  const ahd = useMemo(() => {
    const ahdOutlets = outlets.filter((o) => o.city === 'Ahmedabad')
    const pts = ahdOutlets.map(outletPos)
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
  }, [outlets])

  useFrame(({ clock }, dt) => {
    const sel = outlets.find((o) => o.id === selected)
    if (sel) {
      const [x, z] = outletPos(sel)
      targetLook.set(x, 2, z)
      targetPos.set(x + 6, 24, z + 26)
    } else {
      const p = THREE.MathUtils.smoothstep(progress.current, 0.05, 0.85)
      const ox = -8
      const oz = 6
      targetLook.set(THREE.MathUtils.lerp(ox, ahd[0], p), 0, THREE.MathUtils.lerp(oz, ahd[1], p))
      const drift = Math.sin(clock.elapsedTime * 0.12) * 4
      targetPos.set(THREE.MathUtils.lerp(ox + drift, ahd[0] + 6 + drift, p), THREE.MathUtils.lerp(92, 40, p), THREE.MathUtils.lerp(oz + 78, ahd[1] + 40, p))
    }
    const k = 1 - Math.exp(-dt * 2.4)
    camera.position.lerp(targetPos, k)
    look.current.lerp(targetLook, k)
    camera.lookAt(look.current)
  })
  return null
}

export default function NetworkScene(props: SceneProps) {
  const { outlets, visible, selected, hovered, onSelect, onHover, progress, active, onFail } = props
  const [ready, setReady] = useState(false)
  return (
    <div className={`scene ${ready ? 'is-ready' : ''}`}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={active ? 'always' : 'never'}
        camera={{ fov: 38, near: 0.5, far: 700, position: [-8, 118, 102] }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            onFail()
          })
          setReady(true)
        }}
      >
        <color attach="background" args={['#09090a']} />
        <fog attach="fog" args={['#09090a', 120, 300]} />
        <Ground />
        <Rings />
        {CITIES.map((c) => (
          <Html key={c.name} position={[c.pos[0], 0, c.pos[1] + 7]} center zIndexRange={[5, 0]} className="scene-city">
            {c.name}
          </Html>
        ))}
        {outlets.map((o) => (
          <Pin key={o.id} o={o} dim={!visible.has(o.id)} selected={selected === o.id} hovered={hovered === o.id} onSelect={onSelect} onHover={onHover} />
        ))}
        <CameraRig outlets={outlets} selected={selected} progress={progress} />
      </Canvas>
    </div>
  )
}
