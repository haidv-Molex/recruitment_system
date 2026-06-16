import Redis from "ioredis";
import fs from "fs";
import path from "path";

const useRedis = process.env.USE_REDIS === "true";

// 🔹 TTL mặc định (ví dụ: 1 giờ)
export const DEFAULT_TTL: number = Number(process.env.REDIS_TIME_OUT) || 3600;

interface MockValue {
  value: string;
  expiry: number;
}

const cacheFilePath = path.join(__dirname, "../scratch/cache_persist.json");

// Helper to load cache from disk
const loadCache = (): Map<string, MockValue> => {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const fileData = fs.readFileSync(cacheFilePath, "utf8");
      const parsed = JSON.parse(fileData);
      const map = new Map<string, MockValue>();
      for (const [key, val] of Object.entries(parsed)) {
        const mockVal = val as MockValue;
        if (Date.now() <= mockVal.expiry) {
          map.set(key, mockVal);
        }
      }
      return map;
    }
  } catch (err) {
    console.error("Failed to load persisted cache:", err);
  }
  return new Map<string, MockValue>();
};

// Helper to save cache to disk
const saveCache = (map: Map<string, MockValue>) => {
  try {
    const dir = path.dirname(cacheFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj: Record<string, MockValue> = {};
    for (const [key, val] of map.entries()) {
      if (Date.now() <= val.expiry) {
        obj[key] = val;
      }
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(obj, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save cache to file:", err);
  }
};

const memoryStore = loadCache();

let redis: any;

if (useRedis) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
  });

  redis.on("error", (err: any) => {
    console.error("Redis connection error:", err.message);
  });

  redis.connect().catch((err: any) => {
    console.error("Failed to connect to Redis:", err.message);
  });
} else {
  // In-memory mock redis client that persists to cache_persist.json
  redis = {
    get: async (key: string): Promise<string | null> => {
      const item = memoryStore.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        memoryStore.delete(key);
        saveCache(memoryStore);
        return null;
      }
      return item.value;
    },
    set: async (key: string, value: string, mode?: string, duration?: number): Promise<string> => {
      const expiry = mode === "EX" && duration ? Date.now() + duration * 1000 : Infinity;
      memoryStore.set(key, { value, expiry });
      saveCache(memoryStore);
      return "OK";
    },
    del: async (key: string): Promise<number> => {
      const deleted = memoryStore.delete(key);
      if (deleted) {
        saveCache(memoryStore);
        return 1;
      }
      return 0;
    },
    ttl: async (key: string): Promise<number> => {
      const item = memoryStore.get(key);
      if (!item || item.expiry === Infinity) return -1;
      const remaining = Math.round((item.expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },
    incr: async (key: string): Promise<number> => {
      const item = memoryStore.get(key);
      let currentVal = 0;
      let expiry = Infinity;
      if (item && Date.now() <= item.expiry) {
        currentVal = parseInt(item.value, 10) || 0;
        expiry = item.expiry;
      }
      const newVal = currentVal + 1;
      memoryStore.set(key, { value: String(newVal), expiry });
      saveCache(memoryStore);
      return newVal;
    },
    expire: async (key: string, seconds: number): Promise<number> => {
      const item = memoryStore.get(key);
      if (!item) return 0;
      item.expiry = Date.now() + seconds * 1000;
      memoryStore.set(key, item);
      saveCache(memoryStore);
      return 1;
    },
    flushall: async (): Promise<string> => {
      memoryStore.clear();
      saveCache(memoryStore);
      return "OK";
    },
    quit: async (): Promise<string> => {
      return "OK";
    },
    on: (event: string, handler: Function) => {
      // no-op
    }
  };
  console.log("ℹ️ Redis is disabled. Falling back to persistent in-memory cache.");
}

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