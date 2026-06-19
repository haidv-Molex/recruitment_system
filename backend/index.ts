import "@utilities/validateEnv";
import "express-async-errors";
import express from "express";
import path from 'path';

import { server, app, io } from "@/serverConfig";
import { pool } from "@middlewares/database";
import redis from "@middlewares/redisClient";
import { globalErrorHandler } from "@middlewares/globalErrorHandler";
import { AppError } from "@middlewares/AppError";

import UserController from "@controller/user/_UserController";
import AuthController from "@controller/auth/_AuthController";
import CompanyController from "@controller/company/_CompanyController";
import DepartmentController from "@controller/department/_DepartmentController";
import PlatformController from "@controller/platform/_PlatformController";
import SegmentController from "@controller/segment/_SegmentController";
import SiteController from "@controller/site/_SiteController";
import LevelController from "@controller/level/_LevelController";
import JobController from "@controller/job/_JobController";
import CandidateController from "@controller/candidate/_CandidateController";
import CandidateDetailController from "@controller/candidate_detail/_CandidateDetailController";
import FileController from "@controller/file/_FileController";
import DashboardController from "@controller/dashboard/_DashboardController";

app.get('/', (req, res) => {
  const clientUrl =
    process.env.CLIENT_URL?.split(',')[0]?.trim() ||
    'http://localhost:3000';

  res.redirect(clientUrl);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Đường dẫn lấy file
app.use("/file", FileController);
app.use('/file', express.static(path.join(process.env.PATH_SAVE_FILE as string)));

app.use("/user", UserController);
app.use("/auth", AuthController);
app.use("/company", CompanyController);
app.use("/department", DepartmentController);
app.use("/platform", PlatformController);
app.use("/segment", SegmentController);
app.use("/site", SiteController);
app.use("/level", LevelController);
app.use("/job", JobController);
app.use("/candidate", CandidateController);
app.use("/candidate-detail", CandidateDetailController);
app.use("/dashboard", DashboardController);

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