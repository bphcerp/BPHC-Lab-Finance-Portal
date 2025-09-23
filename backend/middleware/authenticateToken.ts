import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto'
import dotenv from 'dotenv';
import { UserModel } from '../models/user';

declare module "express" {
  interface Request {
    user?: {
      role?: string;
      email?: string;
    };
  }
}

const algorithm = 'aes-256-cbc';
const rawSecretKey = process.env.JWT_SECRET_KEY!;
// Derive a 32-byte key using SHA-256
const secretKey = crypto.createHash('sha256').update(rawSecretKey).digest();
const iv = crypto.randomBytes(16);

export function encrypt(text: string): { iv: string; encryptedData: string } {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted };
}

export function decrypt(encryptedData: string, iv: string): string {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const client = new OAuth2Client(process.env.VITE_OAUTH_CID);

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const encryptedToken: { encryptedData : string, iv : string }= req.cookies.token;

  if (!encryptedToken) {
    res.status(440).json({ authenticated: false, message: 'No token found' });
    return;
  }

  const token = decrypt(encryptedToken.encryptedData,encryptedToken.iv)

  jwt.verify(token, process.env.JWT_SECRET_KEY!, (err: any,decoded: any) => {
    if (err || !decoded) {
      client.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_OAUTH_CID,
      })
      .then(async (ticket) => {
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return res.status(401).json({ authenticated: false, message: 'Invalid Google token payload' });
        }

        const user = await UserModel.findOne({ email: payload.email });
        if (!user) {
          return res.status(401).json({ authenticated: false, message: 'User not found' });
        }

        req.user = { 
          role: user.role,
          email: user.email
        }; 
        next();  // Proceed to the next middleware or route handler
      })
      .catch((error) => {
        console.error(error)
        res.status(400).json({ authenticated: false, message: 'Invalid or expired token' });
      });
    } else {
      req.user = decoded;
      next();  // Token is valid, move to next middleware or route handler
    }
  });
};