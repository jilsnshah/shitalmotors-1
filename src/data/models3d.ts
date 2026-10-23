// Community-made 3D models from Sketchfab, licensed CC BY 4.0 (commercial use allowed with credit).
// Downloaded via the Sketchfab Download API and optimised for the web with glTF-Transform
// (meshopt geometry compression, WebP textures, light simplification). They are fan-made:
// shapes and details may differ from the production vehicles.

export interface Model3D {
  /** Model slug in models.generated.ts */
  slug: string
  src: string
  title: string
  author: string
  authorUrl: string
  sourceUrl: string
  license: 'CC BY 4.0'
  licenseUrl: string
  /** Material names that carry body paint and can be recoloured with the listed colours. */
  paintMaterials?: string[]
  /** Secondary paint (e.g. contrast roof) — kept dark when recolouring. */
  roofMaterials?: string[]
  /** Per-material fixes for exports whose materials don't survive glTF (e.g. white tyres). */
  overrides?: Record<string, { color?: string; metalness?: number; roughness?: number }>
  /** Yaw (radians) that presents the model front three-quarter to the camera. */
  yaw: number
  /** Overall length to normalise to, in scene units (metres). */
  length: number
  bytes: number
}

const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'

export const MODELS_3D: Model3D[] = [
  {
    slug: 'thar-roxx',
    src: '/models/thar-roxx.glb',
    title: 'Mahindra - Thar Roxx',
    author: 'ansari_studios',
    authorUrl: 'https://sketchfab.com/ansari_studios',
    sourceUrl: 'https://sketchfab.com/3d-models/mahindra-thar-roxx-f85210fe98774b7fab1199d8ee151ead',
    license: 'CC BY 4.0',
    licenseUrl: LICENSE_URL,
    paintMaterials: ['Carpaint_Flakes_White'],
    roofMaterials: ['Roof_Color'],
    overrides: {
      Color_M07: { color: '#19191b', metalness: 0, roughness: 0.78 },
      'Silver_-_Less_Glossy': { color: '#c9cbcf', metalness: 0.85, roughness: 0.3 },
      Rim_Ring_Color: { color: '#2a2b2e', metalness: 0.6, roughness: 0.4 },
    },
    yaw: 0,
    length: 4.43,
    bytes: 1_167_256,
  },
  {
    slug: 'xuv-3xo',
    src: '/models/xuv-3xo.glb',
    title: 'XUV 3XO',
    author: 'Shreyansh Chaurasia',
    authorUrl: 'https://sketchfab.com/shreyanshchaurasia13',
    sourceUrl: 'https://sketchfab.com/3d-models/xuv-3xo-816995d6c3454462b62c8c44ea39ae65',
    license: 'CC BY 4.0',
    licenseUrl: LICENSE_URL,
    yaw: 0,
    length: 3.99,
    bytes: 1_442_152,
  },
  {
    slug: 'thar-og',
    src: '/models/thar-og.glb',
    title: 'THAR 4X4',
    author: 'MB_Mahesh',
    authorUrl: 'https://sketchfab.com/MB_Mahesh',
    sourceUrl: 'https://sketchfab.com/3d-models/thar-4x4-66ee970b18014c98a1750064b65657b0',
    license: 'CC BY 4.0',
    licenseUrl: LICENSE_URL,
    yaw: 0,
    length: 3.99,
    bytes: 1_331_344,
  },
]

export const model3DFor = (slug: string) => MODELS_3D.find((m) => m.slug === slug)
