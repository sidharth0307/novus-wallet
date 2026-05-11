import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

// Helper to wrap Redis calls with a timeout so a "hanging" Redis doesn't hang your app
const withTimeout = (promise: Promise<any>, ms: number = 1000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), ms))
  ]);
};

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    // We call Redis, but immediately catch any low-level network/fetch errors
    const result = await redis.pipeline()
      .incr(`rate:${req.user.userId}`)
      .expire(`rate:${req.user.userId}`, 60)
      .exec()
      .catch((err: any) => {
        console.error("Redis Network Failure (Ignoring):", err.message);
        return null; // Return null so the next line handles it
      });

    // If Redis failed or timed out, just let them through
    if (!result || !Array.isArray(result)) return next();

    const [count] = result;
    const limit = req.user.role === "PRO" ? 300 : 60;

    if (count > limit) {
      return res.status(429).json({ message: "Too many requests." });
    }

    next();
  } catch (error) {
    // Ultimate fallback
    next();
  }
};

export const strictRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  const { userId, role } = req.user;
  const limit = role === "PRO" ? 50 : 10; 
  const key = `rate:strict:${userId}`;

  try {
    const [count] = await withTimeout(
      redis.pipeline().incr(key).expire(key, 60).exec()
    );

    if (count > limit) {
      return res.status(429).json({ message: "Transaction limit exceeded. Try again in a minute." });
    }
    next();
  } catch (error) {
    console.error("Redis Strict Rate Limiter Error (Bypassing):", error);
    next();
  }
};

export const ipRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown_ip";
  const key = `rate:ip:${ip}`;

  try {
    const [count] = await withTimeout(
      redis.pipeline().incr(key).expire(key, 300).exec(),
      1500 // Slightly longer timeout for IP limits as they are usually on auth routes
    );

    if (count > 20) {
      return res.status(429).json({ message: "Too many attempts, please try again later" });
    }
    next();
  } catch (error) {
    console.error("Redis IP Rate Limiter Error (Bypassing):", error);
    next(); 
  }
};