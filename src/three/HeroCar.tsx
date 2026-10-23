// Hero: the Thar ROXX on the studio floor. Scroll orbits the camera around the car
// (the car itself stays put so its contact shadow can be rendered once).
import { Suspense, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { Model3D } from '../data/models3d.ts'
import { CarModel, StudioEnvironment } from './CarModel.tsx'

interface Props {
  asset: Model3D
  paint: string
  progress: MutableRefObject<number>
  active: boolean
  compact: boolean
  onReady: () => void
  onFail: () => void
}

function Rig({ progress, compact }: { progress: MutableRefObject<number>; compact: boolean }) {
  const camera = useThree((s) => s.camera)
  const pointer = useRef(new THREE.Vector2())
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3(0, 0.75, 0))
  useFrame((state, dt) => {
    pointer.current.lerp(state.pointer, 1 - Math.exp(-dt * 2))
    const p = progress.current
    // Start front three-quarter, swing past the profile to a rear three-quarter.
    const angle = -0.72 + p * 2.35 + pointer.current.x * 0.08
    const radius = (compact ? 10.2 : 10) - p * 0.8
    const height = 1.55 + p * 0.35 + pointer.current.y * 0.12
    pos.current.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius)
    const k = 1 - Math.exp(-dt * 5)
    camera.position.lerp(pos.current, k)
    camera.lookAt(look.current)
  })
  return null
}

export default function HeroCar({ asset, paint, progress, active, compact, onReady, onFail }: Props) {
  return (
    <Canvas
      className="car-canvas"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30, near: 0.1, far: 100, position: [-5, 1.6, 5.5] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFail()
        })
      }}
    >
      <StudioEnvironment intensity={0.9} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} />
      <Suspense fallback={null}>
        <CarModel asset={asset} paint={paint} onReady={onReady} />
        <ContactShadows position={[0, 0.002, 0]} scale={11} blur={2.6} far={2.2} opacity={0.62} resolution={512} frames={1} color="#1c1c20" />
      </Suspense>
      <Rig progress={progress} compact={compact} />
    </Canvas>
  )
}
