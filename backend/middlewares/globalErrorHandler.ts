import { Request, Response, NextFunction } from "express";
import { AppError } from "@middlewares/AppError";
import logger from "@middlewares/logger";

// Nếu dùng pg thì DatabaseError thường nằm ở err.name === "DatabaseError"
export function globalErrorHandler(
  err: Error & { code?: string; name?: string },
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const codeStr = String(err.code ?? "");

  // 1. Lỗi do mình kiểm soát (AppError)
  if (err instanceof AppError) {
    logger.error("AppError", {
      message: err.message,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      stack: err.stack,
    });

    // Nếu statusCode = 200 → thông báo bình thường, result vẫn false
    if (err.statusCode === 200) {
      return res.status(200).json({
        result: true,
        message: err.message,
        type: "Info",
      });
    }

    return res.status(err.statusCode).json({
      result: false,
      message: err.message,
      type: "AppError",
    });
  }

  // 2. Lỗi Database (Postgres, MySQL...)
  if (err.name === "DatabaseError" || codeStr.startsWith("22") || codeStr.startsWith("23")) {
    logger.error("DatabaseError", {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });

    return res.status(500).json({
      result: false,
      message: "Đã xảy ra lỗi cơ sở dữ liệu",
      // error: err.message,
      type: "DatabaseError",
    });
  }

  // 3. lỗi liên quan đến mail
  if (err.code === "EAUTH" || err.code === "ESOCKET" || err.code === "ECONNECTION") {
    logger.error("MailError", {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });

    return res.status(500).json({
      result: false,
      message: "Không thể gửi mail",
      // error: err.message,
      type: "MailError",
    });
  }

  // 4. Lỗi không xác định (programming / unknown)
  logger.error("Unexpected Error", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    result: false,
    message: "Đã xảy ra lỗi không xác định",
    // error: err.message,
    type: "UnknownError",
  });
}