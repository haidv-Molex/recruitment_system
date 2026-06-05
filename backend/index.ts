import "@utilities/validateEnv";
import "express-async-errors";
import express from "express";
import path from 'path';

import { server, app, io } from "@/serverConfig";
import { pool } from "@middlewares/database";
import redis from "@middlewares/redisClient";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import { AppError } from "@middlewares/AppError";

app.get('/', (req, res) => {
  const clientUrl =
    process.env.CLIENT_URL?.split(',')[0]?.trim() ||
    'https://e-books.info.vn';

  res.redirect(clientUrl);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Đường dẫn lấy ảnh
app.use('/image', express.static(path.join(process.env.PATH_SAVE_IMAGE as string)));

// Các controller hiện chưa có trong dự án mới, giữ server hoạt động với các route gốc.
// Nếu cần bổ sung router riêng, thêm vào thư mục controller và mount ở đây.

// Route không khớp → 404
app.all("*", (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//catch lỗi cục bộ 
app.use(globalErrorHandler);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown — dùng cho cả PM2 (SIGINT) và Docker/K8s (SIGTERM)
async function gracefulShutdown(signal: string) {
  console.log(`\n[${signal}] Shutting down gracefully...`);

  // 1. Dừng nhận request mới
  server.close(async () => {
    console.log('HTTP server closed.');

    try {
      // 2. Đóng DB pool
      await pool.end();
      console.log('PostgreSQL pool closed.');

      // 3. Đóng Redis
      await redis.quit();
      console.log('Redis connection closed.');

      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit nếu sau 10s vẫn chưa shutdown xong (tránh treo)
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // PM2 stop/restart, Docker
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C khi dev

// Khởi động server HTTP để lắng nghe trên cổng 3000
server.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${Number(process.env.PORT) || 3000}`);
});