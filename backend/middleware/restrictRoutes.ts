import { Request, Response, NextFunction } from 'express'
import { authenticateToken } from './authenticateToken'

const OPEN_POST_PATHS = new Set<string>([
  '/api/user/login',
  '/api/user/passlogin',
  '/api/user/logout',
])

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.replace(/\/+$/, '')
  return path
}

export function restrictRoutes(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase()
  const path = normalizePath(req.path)

  if (method === 'GET') return next()
  if (method === 'POST' && OPEN_POST_PATHS.has(path)) return next()

  return authenticateToken(req, res, next)
}
