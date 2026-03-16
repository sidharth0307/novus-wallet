import { redis } from "../lib/redis";

export async function cacheAside<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  
  const cached = await redis.get<T>(key); 
  
  if (cached) {
    return cached; 
  }

  const fresh = await fetcher();

  await redis.set(key, fresh, { ex: ttl });

  return fresh;
}