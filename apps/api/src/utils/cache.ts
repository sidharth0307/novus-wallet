import { redis } from "../lib/redis";

export async function cacheAside<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  
  // 1. Attempt to get from cache, but catch any network/fetch errors
  try {
    const cached = await redis.get<T>(key).catch(() => null); 
    
    if (cached !== null && cached !== undefined) {
      return cached; 
    }
  } catch (error) {
    // If Redis is deleted or DNS fails, we just log it and move on
    console.error(`Cache Read Error for ${key}:`, error);
  }

  // 2. Fetch fresh data from Database (Prisma)
  const fresh = await fetcher();

  // 3. Attempt to set the cache, but don't 'await' it or let it block the response
  // Also catch errors here so a failed 'set' doesn't crash the request
  if (fresh !== null && fresh !== undefined) {
    redis.set(key, fresh, { ex: ttl }).catch((err: any) => {
      console.error(`Cache Write Error for ${key}:`, err.message);
    });
  }

  return fresh;
}