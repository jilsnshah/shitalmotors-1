import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Model3D } from '../data/models3d.ts'

/**
 * Loads a car, normalises it to real-world length (metres), sits it on y = 0 and
 * centres it. Body-paint materials become clear-coated physical materials whose
 * colour eases toward `paint`.
 */
export function CarModel({ asset, paint, onReady }: { asset: Model3D; paint?: string; onReady?: () => void }) {
  const gltf = useGLTF(asset.src)
  const invalidate = useThree((s) => s.invalidate)
  const target = useRef(new THREE.Color(paint ?? '#ffffff'))

  const { object, paintMats } = useMemo(() => {
    const object = gltf.scene.clone(true)
    const paintMats: THREE.MeshPhysicalMaterial[] = []
    const roofNames = new Set(asset.roofMaterials ?? [])
    const paintNames = new Set(asset.paintMaterials ?? [])
    const cache = new Map<THREE.Material, THREE.Material>()

    object.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      const swap = (m: THREE.Material): THREE.Material => {
        if (cache.has(m)) return cache.get(m)!
        let out: THREE.Material = m
        const std = m as THREE.MeshStandardMaterial
        const fix = asset.overrides?.[m.name]
        if (fix && std.isMeshStandardMaterial) {
          const f = std.clone()
          if (fix.color) f.color = new THREE.Color(fix.color)
          if (fix.metalness !== undefined) f.metalness = fix.metalness
          if (fix.roughness !== undefined) f.roughness = fix.roughness
          out = f
        } else if (paintNames.has(m.name)) {
          const p = new THREE.MeshPhysicalMaterial({
            name: m.name,
            color: std.color?.clone() ?? new THREE.Color('#ffffff'),
            metalness: 0.45,
            roughness: 0.36,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
            envMapIntensity: 0.95,
            // Some CAD exports carry back-to-back duplicate faces; cull them to avoid speckling.
            side: THREE.FrontSide,
          })
          paintMats.push(p)
          out = p
        } else if (roofNames.has(m.name)) {
          const r = std.clone()
          r.color = new THREE.Color('#151517')
          r.roughness = 0.35
          r.metalness = 0.2
          out = r
        } else if (/glass/i.test(m.name) && std.isMeshStandardMaterial) {
          const g = std.clone()
          g.transparent = true
          g.opacity = Math.max(0.35, std.opacity)
          g.color = new THREE.Color('#0b0d10')
          g.roughness = 0.05
          g.metalness = 0.9
          out = g
        } else if (std.isMeshStandardMaterial && std.roughness > 0.55 && !std.map) {
          // Flat CAD greys look chalky under studio light; give them a satin finish.
          const s = std.clone()
          s.roughness = 0.45
          s.envMapIntensity = 0.9
          out = s
        }
        cache.set(m, out)
        return out
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
      // Flat-shaded CAD panels facet badly under clear coat; smooth them below a crease angle.
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((m) => paintNames.has(m.name) || roofNames.has(m.name))) {
        mesh.geometry = toCreasedNormals(mesh.geometry, (35 * Math.PI) / 180)
      }
    })

    // Normalise: longest horizontal extent → asset.length metres, centred, wheels on y = 0.
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const scale = asset.length / Math.max(size.x, size.z)
    object.scale.setScalar(scale)
    box.setFromObject(object)
    const centre = box.getCenter(new THREE.Vector3())
    object.position.set(-centre.x, -box.min.y, -centre.z)
    // Face the model's length along x so yaw offsets are consistent between assets.
    const wrapper = new THREE.Group()
    wrapper.add(object)
    if (size.z > size.x) wrapper.rotation.y = Math.PI / 2
    const outer = new THREE.Group()
    outer.add(wrapper)
    outer.rotation.y = asset.yaw
    return { object: outer, paintMats }
  }, [gltf, asset])

  useEffect(() => {
    if (paint) target.current.set(paint)
    invalidate()
  }, [paint, invalidate])

  useLayoutEffect(() => {
    if (paint) paintMats.forEach((m) => m.color.set(paint))
    onReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object])

  useFrame((_, dt) => {
    if (!paintMats.length) return
    const k = 1 - Math.exp(-dt * 4)
    let moving = false
    const t = target.current
    for (const m of paintMats) {
      const c = m.color
      if (Math.abs(c.r - t.r) + Math.abs(c.g - t.g) + Math.abs(c.b - t.b) < 0.003) {
        if (!c.equals(t)) c.copy(t)
        continue
      }
      c.lerp(t, k)
      moving = true
    }
    if (moving) invalidate()
  })

  useEffect(
    () => () => {
      paintMats.forEach((m) => m.dispose())
    },
    [paintMats],
  )

  return <primitive object={object} />
}

/** Procedural studio reflections — no HDR download needed. */
export function StudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, intensity])
  return null
}

export const preloadCar = (src: string) => useGLTF.preload(src)
