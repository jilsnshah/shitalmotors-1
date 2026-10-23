import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Mounts server/api.ts inside the dev server so /api/chat and /api/lead work with `npm run dev`.
function devApi(): Plugin {
  return {
    name: 'shital-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const mod = (await server.ssrLoadModule('/server/api.ts')) as typeof import('./server/api.ts')
        await mod.handleApi(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...process.env })
  return {
    plugins: [react(), devApi()],
    build: {
      target: 'es2022',
      // three.js is ~1 MB minified; it ships in its own lazy chunk that only capable devices request.
      chunkSizeWarningLimit: 1100,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three'
            if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion'
          },
        },
      },
    },
  }
})
