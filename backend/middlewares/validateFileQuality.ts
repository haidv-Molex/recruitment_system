import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { AppError } from "@middlewares/AppError";

type MulterFile = Express.Multer.File;

// ----------- Common config -----------
const MAX_DOC_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateFileQuality = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as { [fieldname: string]: MulterFile[] };

  try {
    if (files) {
      for (const field in files) {
        for (const file of files[field]) {
          // ---- Rule chung cho file dạng docx/md/txt/pdf ---
          if (
            file.mimetype.includes("text/") ||
            file.mimetype.includes("application/msword") ||
            file.mimetype.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
            file.originalname.endsWith(".md") ||
            file.originalname.endsWith(".txt")
          ) {
            if (file.size > MAX_DOC_FILE_SIZE) {
              fs.unlinkSync(file.path);
              throw new AppError("Document file too large (max 5MB)", 400);
            }
          }
        }
      }
    }

    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return res.status(500).json({
      result: false,
      message: "Error validating files",
      error: (error as Error).message,
    });
  }
};

export default validateFileQuality