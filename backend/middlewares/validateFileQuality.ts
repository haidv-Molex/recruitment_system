import { Request, Response, NextFunction } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { AppError } from "@middlewares/AppError";

type MulterFile = Express.Multer.File;

// ----------- Common config -----------
const MAX_DOC_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];

const validateFileQuality = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as { [fieldname: string]: MulterFile[] };

  try {
    if (files) {
      const tasks: Promise<void>[] = [];

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


          // ---- Rule cho audio ----
          if (field === "audio") {
            tasks.push(
              new Promise<void>((resolve, reject) => {
                if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
                  fs.unlinkSync(file.path);
                  return reject(new AppError("Unsupported audio format", 400));
                }

                ffmpeg.ffprobe(file.path, (err, metadata) => {
                  if (err) return reject(err);

                  const duration = metadata.format.duration || 0;
                  if (duration > 20) {
                    fs.unlinkSync(file.path);
                    return reject(new AppError("Audio too long (max 20s)", 400));
                  }
                  resolve();
                });
              })
            );
          }
        }
      }

      await Promise.all(tasks);
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