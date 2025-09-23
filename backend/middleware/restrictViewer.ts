import { Request, Response, NextFunction } from "express";

declare module "express" {
  interface Request {
    user?: {
      role?: string;
    };
  }
}

export function restrictViewer(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === "Viewer" && req.method !== "GET") {
    return res.status(403).json({ message: "Viewers can only perform GET requests." });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
}