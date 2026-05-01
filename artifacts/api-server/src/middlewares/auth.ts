import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "fallback_secret";

export interface AuthPayload {
  userId: number;
  role: "student" | "staff" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorizeRole(...roles: Array<"student" | "staff" | "admin">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function signToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}
