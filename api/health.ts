// Vercel serverless function — health check.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleApi } from '../server/api.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  ;(req as any).url = '/api/health'
  await handleApi(req as any, res as any)
}
