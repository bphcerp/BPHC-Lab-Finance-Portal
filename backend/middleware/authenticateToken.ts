import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.OAUTH_CID);

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ authenticated: false, message: 'No token found' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY!, (err: any,decoded: any) => {
    if (err || !decoded) {
      client.verifyIdToken({
        idToken: token,
        audience: process.env.OAUTH_CID,
      })
      .then(() => {
        next();  // Proceed to the next middleware or route handler
      })
      .catch(() => {
        res.status(440).json({ authenticated: false, message: 'Invalid or expired token' });
      });
    } else {
      next();  // Token is valid, move to next middleware or route handler
    }
  });
};