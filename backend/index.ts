import "@utilities/validateEnv";
import "@utilities/validateFirebaseServiceFile";
import "express-async-errors";
import express from "express";
import path from 'path';
import fs from 'fs'

import { server, app, io } from "@/serverConfig";
import { pool } from "@middlewares/database";
import redis from "@middlewares/redisClient";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import { AppError } from "@middlewares/AppError";

import AuthController from "@controller/Auth/_AuthController";
import UserController from "@controller/User/_UserController";
import BookController from "@controller/Book/_BookController";
import VolumeController from "@controller/Volume/_VolumeController";
import ChapterController from "@controller/Chapter/_ChapterController";
import SocketController from "@controller/Socket/_SocketController";
import AudioController from "@controller/Audio/_AudioController";
import ReportController from "@controller/Report/_ReportController";
import NotificationController from "@controller/Notification/_NotificationController";
import AdminController from "@controller/Admin/_AdminController";
import TransController from "@controller/Trans/_TransController";

import Chapter from "@services/Book/Chapter/Utils/_Chapter";

import "@controller/Socket/socketConnection";

import { withTransaction } from "@middlewares/withTransaction";

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
app.get("/imageBooks/:chapter_id/:filename", async (req, res) => {
  const { chapter_id, filename } = req.params;
  const chapter_folder = await withTransaction(async (pool) => {
    return await Chapter.getFullFolderPath(Number(chapter_id), pool);
  })

  const imagePath = path.join(
    process.env.PATH_SAVE_BOOKS as string,
    chapter_folder,
    filename
  );

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    return res.status(404).json({ error: "Image not found" });
  }
});

app.get("/audioBooks/:chapter_id/:filename", async (req, res) => {
  const { chapter_id, filename } = req.params;
  const chapter_folder = await withTransaction(async (pool) => {
    return await Chapter.getFullFolderPath(Number(chapter_id), pool);
  })

  const audioPath = path.join(
    process.env.PATH_SAVE_BOOKS as string,
    chapter_folder,
    filename
  );

  if (fs.existsSync(audioPath)) {
    return res.sendFile(audioPath);
  }

  return res.status(404).json({ error: "Audio not found" });
});

// đường dẫn các controller
app.use("/Auth", AuthController);
app.use("/Audio", AudioController);
app.use("/User", UserController);
app.use("/Socket", SocketController);
app.use("/Book", BookController);
app.use("/Book/Volume", VolumeController);
app.use("/Book/Volume/Chapter", ChapterController);
app.use("/Report", ReportController);
app.use("/Notification", NotificationController);
app.use("/Admin", AdminController);
app.use("/Trans", TransController);

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