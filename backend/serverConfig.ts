import express from "express";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import helmet from 'helmet';
import { httpContext } from "./middlewares/httpContext";


const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  httpContext.run(req, next);
});


// 1. Trust Proxy - Phải đặt trên cùng nếu chạy sau Nginx/Cloudflare
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Lấy danh sách client URLs từ biến môi trường (hỗ trợ nhiều URL cách nhau bằng dấu phẩy)
const clientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map(url => url.trim())
  .filter(url => url.length > 0);

// 2. Helmet - Cấu hình nới lỏng cho Socket.io (để debug web không lỗi)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "connect-src": [
        "'self'",
        ...clientUrls,
        `${process.env.HOST}`,
        "ws://localhost:3000",
        "http://mlxvhavwpapp4.molex.com",
        "https://mlxvhavwpapp4.molex.com",
        "http://mlxvhavwpapp4.molex.com:*",
        "https://mlxvhavwpapp4.molex.com:*"
      ],
      "img-src": ["'self'", "data:", "https:", "http:"],
      "script-src": ["'self'"],
    },
  },
}));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // App Mobile thường không có origin, cho phép luôn
    if (!origin || origin === 'null') return callback(null, true);

    // Nếu có origin (từ Web), kiểm tra whitelist
    const allowed = [...clientUrls, "http://localhost:5173"];
    const isMolexSite = /^https?:\/\/mlxvhavwpapp4\.molex\.com(:\d+)?$/.test(origin);
    if (allowed.includes(origin) || origin.startsWith("http://localhost:") || isMolexSite) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// 4. Các middleware parse dữ liệu
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. Rate Limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use(limiter);s

// 6. Redis & Socket.IO
const io = new Server(server, {
  cors: corsOptions,
});

const setupRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_PASSWORD
      ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      : `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || 6379}`;

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Redis Adapter connected");
  } catch (err) {
    throw err;
  }
};

if (process.env.USE_REDIS === "true") {
  setupRedis().catch((err) => {
    console.error("❌ Failed to initialize Redis Adapter for Socket.io:", err.message);
  });
} else {
  console.log("ℹ️ Redis Adapter is disabled. Socket.io is running in default in-memory mode.");
}

export { server, app, io };