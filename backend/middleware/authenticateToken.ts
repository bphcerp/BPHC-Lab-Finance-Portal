import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import dotenv from "dotenv";
import { UserModel } from "../models/user";

declare global {
  namespace Express {
    interface User {
      name?: string | null;
      email: string;
      role: "Admin" | "Viewer";
    }

    interface Request {
      user?: User;
    }
  }
}

const OPEN_POST_PATHS = new Set<string>([
  "/api/user/login",
  "/api/user/passlogin",
  "/api/user/logout",
]);

const algorithm = "aes-256-cbc";
const rawSecretKey = process.env.JWT_SECRET_KEY!;
// Derive a 32-byte key using SHA-256
const secretKey = crypto.createHash("sha256").update(rawSecretKey).digest();
const iv = crypto.randomBytes(16);

export function encrypt(text: string): { iv: string; encryptedData: string } {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), encryptedData: encrypted };
}

export function decrypt(encryptedData: string, iv: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const verifyUserExists = async (
  email: string
): Promise<Express.User | undefined> => {
  const dbUser = await UserModel.findOne({
    email,
  }).lean();

  return dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      }
    : undefined;
};

const client = new OAuth2Client(process.env.VITE_OAUTH_CID);

const restrictRoutes = (
  isAdmin: boolean,
  method: Request["method"],
  path: string
) => {
  let requestPath = path.split("?")[0];

  if (requestPath.length > 1 && requestPath.endsWith("/")) {
    requestPath = requestPath.replace(/\/+$/, "");
  }

  if (OPEN_POST_PATHS.has(requestPath)) return true;

  if (!isAdmin && method !== "GET") return false;
  else return true;
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const encryptedToken: { encryptedData: string; iv: string } =
    req.cookies.token;

  if (!encryptedToken) {
    res.status(440).json({ authenticated: false, message: "No token found" });
    return;
  }

  const token = decrypt(encryptedToken.encryptedData, encryptedToken.iv);

  jwt.verify(
    token,
    process.env.JWT_SECRET_KEY!,
    async (err: any, decoded: any) => {
      const handleInvalid = () =>
        res.status(400).json({
          authenticated: false,
          message: "Invalid or expired token",
        });

      const authorizeUser = async (email: string) => {
        const user = await verifyUserExists(email);
        if (!user) return handleInvalid();

        if (
          !restrictRoutes(user.role === "Admin", req.method, req.originalUrl)
        ) {
          return res.status(403).json({
            message: "User doesnt have the required privileges",
          });
        }

        req.user = user;
        next();
      };

      // If JWT fails, try Google token
      if (err || !decoded) {
        client
          .verifyIdToken({
            idToken: token,
            audience: process.env.VITE_OAUTH_CID,
          })
          .then(async (ticket) => {
            const payload = ticket.getPayload();
            if (!payload?.email) return handleInvalid();
            authorizeUser(payload.email);
          })
          .catch((error) => {
            console.error(error);
            handleInvalid();
          });
      } else {
        // Valid JWT path
        authorizeUser(decoded.email);
      }
    }
  );
};
