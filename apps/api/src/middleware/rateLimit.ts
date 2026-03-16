import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  const { userId, role } = req.user;

  // for standard users (1 request per second average)
  const limit = role === "PRO" ? 300 : 60; 
  const key = `rate:${userId}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);

    if (count > limit) {
      return res.status(429).json({ message: "Too many requests. Please slow down." });
    }
    next();
  } catch (error) {
    console.error("Redis Rate Limiter Error:", error);
    next();
  }
};

// Strict limits for moving money
export const strictRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  const { userId, role } = req.user;

  // Only allow 10 transfers/withdrawals per minute
  const limit = role === "PRO" ? 50 : 10; 
  const key = `rate:strict:${userId}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);

    if (count > limit) {
      return res.status(429).json({ message: "Transaction limit exceeded. Try again in a minute." });
    }
    next();
  } catch (error) {
    console.error("Redis Strict Rate Limiter Error:", error);
    next();
  }
};

export const ipRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  // Use the user's IP address as the Redis key
  const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
  const key = `rate:ip:${ip}`;

  try {
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 300); // 5-minute window for auth routes
    }

    // Strict limit for public auth routes (e.g., 20 attempts per 5 mins)
    if (count > 20) {
      return res.status(429).json({ message: "Too many attempts, please try again later" });
    }
    
    next();
  } catch (error) {
    console.error("Redis IP Rate Limiter Error:", error);
    next(); // Fail open if Redis is down
  }
};