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
  
  const { userId, role } = req.user;
  const limit = role === "PRO" ? 300 : 60; 
  const key = `rate:${userId}`;

  try {
    // 1. use a pipeline or multi to ensure atomic operations
    // 2. wrap in a timeout so an inactive Upstash DB doesn't stall the request
    const [count] = await withTimeout(
      redis.pipeline().incr(key).expire(key, 60).exec()
    );

    if (count > limit) {
      return res.status(429).json({ message: "Too many requests. Please slow down." });
    }
    next();
  } catch (error) {
    // FAIL OPEN: Log the error, but let the user see their balance/profile
    console.error("Redis Rate Limiter Error (Bypassing):", error);
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