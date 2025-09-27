import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { UserModel } from '../models/user';

// Ensure env vars loaded (harmless if already loaded elsewhere)
dotenv.config();

declare module 'express' {
  interface Request {
    user?: { role?: string; email?: string };
  }
}

// ---- Encryption helpers (per-token IV) ----
const algorithm = 'aes-256-cbc';
function getKey(): Buffer {
  const raw = process.env.JWT_SECRET_KEY;
  if (!raw) throw new Error('JWT_SECRET_KEY not set');
  return crypto.createHash('sha256').update(raw).digest();
}
export function encrypt(text: string): { iv: string; encryptedData: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted };
}
export function decrypt(encryptedData: string, iv: string): string {
  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Optional: fallback Google verification for legacy cookies that stored Google ID token
const googleClient = new OAuth2Client(process.env.VITE_OAUTH_CID);

interface EncryptedCookie { encryptedData: string; iv: string }

function extractJwtFromCookie(req: Request): string | null {
  const enc: EncryptedCookie | undefined = req.cookies?.token;
  if (!enc) return null;
  try {
    return decrypt(enc.encryptedData, enc.iv);
  } catch {
    return null;
  }
}

// Attach user if token valid; otherwise stay anonymous
export function authenticateOptional(req: Request, _res: Response, next: NextFunction) {
  const token = extractJwtFromCookie(req);
  if (!token) return next();
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    req.user = { email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return next();
  }
}

// Require valid token (with legacy Google fallback)
export async function authenticateRequired(req: Request, res: Response, next: NextFunction) {
  const token = extractJwtFromCookie(req);
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    req.user = { email: decoded.email, role: decoded.role };
    return next();
  } catch (err) {
    // Legacy fallback: treat token as Google credential (only if verification enabled)
    if (process.env.VITE_OAUTH_CID) {
      try {
        const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.VITE_OAUTH_CID });
        const payload = ticket.getPayload();
        if (payload?.email) {
          const user = await UserModel.findOne({ email: payload.email });
          if (user) {
            req.user = { email: user.email, role: user.role };
            return next();
          }
        }
      } catch {}
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Backwards compatibility export (old name)
export const authenticateToken = authenticateRequired;