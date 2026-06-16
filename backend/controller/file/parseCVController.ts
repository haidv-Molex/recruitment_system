import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import FileService from "@services/file/_File";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";

const parseCVController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

parseCVController.post("",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      throw new AppError("Vui lòng tải lên một tệp tin CV", 400);
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (fileExt !== ".pdf" && fileExt !== ".docx") {
      throw new AppError("Định dạng file không hỗ trợ. Chỉ hỗ trợ file PDF (.pdf) hoặc Word (.docx)", 400);
    }

    // Define temporary directory and unique file path
    const tempDir = path.join(process.env.PATH_SAVE_FILE || "./uploads", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFileName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${fileExt}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    let parsedCV;
    try {
      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, req.file.buffer);

      // Parse the CV
      parsedCV = await FileService.parseCV(tempFilePath);
    } finally {
      // Ensure the temporary file is deleted
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkErr) {
          console.error("Lỗi khi xóa tệp tạm:", unlinkErr);
        }
      }
    }

    res.status(200).json({
      result: true,
      message: "Phân tích CV thành công",
      data: parsedCV
    });
  }
);

export default parseCVController;
