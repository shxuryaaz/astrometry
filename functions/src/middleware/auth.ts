import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

export const verifyFirebaseIdToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).uid = decoded.uid;
    (req as any).email = decoded.email;
    (req as any).admin = decoded.admin || false;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid auth token" });
  }
};

