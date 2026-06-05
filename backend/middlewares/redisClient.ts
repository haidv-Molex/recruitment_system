import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD
});

// 🔹 TTL mặc định (ví dụ: 1 giờ)
export const DEFAULT_TTL: number = Number(process.env.REDIS_TIME_OUT) || 3600;

// 🔹 Hàm tiện ích set với TTL
export const setCache = async (key: string, value: any, ttl: number = DEFAULT_TTL) => {
  return redis.set(key, JSON.stringify(value), "EX", ttl);
};

// 🔹 Hàm tiện ích get
export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as T) : null;
};

// 🔹 Hàm tiện ích xóa
export const delCache = async (key: string) => {
  return redis.del(key);
};

// 🔹 Hàm tiện ích xóa tất cả
export const clearAllCache = async () => {
  return redis.flushall();
};

export default redis;