// Vercel serverless function — wraps the shared handleChat logic.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleApi } from '../server/api.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rewrite the URL so handleApi sees /api/chat
  ;(req as any).url = '/api/chat'
  await handleApi(req as any, res as any)
}
