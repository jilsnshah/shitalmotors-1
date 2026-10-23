// Model page: drag-to-orbit studio viewer. Touch keeps vertical page scrolling (touch-action: pan-y).
import { Suspense, forwardRef, useImperativeHandle, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Model3D } from '../data/models3d.ts'
import { CarModel, StudioEnvironment } from './CarModel.tsx'

export interface ViewerHandle {
  rotate: (radians: number) => void
  reset: () => void
}

interface Props {
  asset: Model3D
  paint?: string
  active: boolean
  autoRotate: boolean
  onReady: () => void
  onFail: () => void
  onInteract: () => void
}

const CarViewer = forwardRef<ViewerHandle, Props>(function CarViewer({ asset, paint, active, autoRotate, onReady, onFail, onInteract }, ref) {
  const controls = useRef<OrbitControlsImpl>(null)

  useImperativeHandle(ref, () => ({
    rotate: (rad) => {
      const c = controls.current
      if (!c) return
      const offset = c.object.position.clone().sub(c.target)
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rad)
      c.object.position.copy(c.target).add(offset)
      c.update()
    },
    reset: () => controls.current?.reset(),
  }))

  return (
    <Canvas
      className="car-canvas car-canvas--viewer"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30, near: 0.1, far: 100, position: [-6.2, 1.9, 6.4] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFail()
        })
      }}
    >
      <StudioEnvironment intensity={0.95} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} />
      <Suspense fallback={null}>
        <CarModel asset={asset} paint={paint} onReady={onReady} />
        <ContactShadows position={[0, 0.002, 0]} scale={12} blur={2.6} far={2.2} opacity={0.6} resolution={512} frames={1} color="#1c1c20" />
      </Suspense>
      <OrbitControls
        ref={controls}
        target={[0, 0.75, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.49}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.7}
        onStart={onInteract}
      />
    </Canvas>
  )
})

export default CarViewer
