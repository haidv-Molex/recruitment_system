import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import FileService from "@services/file/_File";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { readExcelOrCsvToJson } from "@/utilities/file/readExcelOrCsvToJson";
import { AppError } from "@middlewares/AppError";

const parseCandidateSheetController = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

parseCandidateSheetController.post("",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    let rawData: any[] = [];

    // Case 1: File Uploaded
    if (req.file) {
      const originalName = req.file.originalname;
      const fileExt = path.extname(originalName).toLowerCase();

      if (fileExt !== ".xlsx" && fileExt !== ".xls" && fileExt !== ".csv") {
        throw new AppError("Định dạng file không hỗ trợ. Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV (.csv)", 400);
      }

      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
      const tempFilePath = path.join(uploadDir, tempFileName);

      try {
        fs.writeFileSync(tempFilePath, req.file.buffer);

        const parsedData = await readExcelOrCsvToJson(tempFilePath);
        if (Array.isArray(parsedData)) {
          rawData = parsedData;
        } else {
          // Look for "IDL tracking" sheet first (candidate tracking sheet)
          if (parsedData["IDL tracking"]) {
            rawData = parsedData["IDL tracking"];
          } else {
            // Fall back to first non-empty sheet
            const sheetNames = Object.keys(parsedData);
            if (sheetNames.length > 0) {
              rawData = parsedData[sheetNames[0]];
            }
          }
        }
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }
    // Case 2: JSON Body
    else if (req.body && (req.body.sheetData || Array.isArray(req.body))) {
      rawData = Array.isArray(req.body) ? req.body : req.body.sheetData;
    }
    // Case 3: No input
    else {
      throw new AppError("Vui lòng tải lên file Excel/CSV hoặc truyền dữ liệu JSON trong body", 400);
    }

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new AppError("Dữ liệu sheet rỗng hoặc không hợp lệ", 400);
    }

    const result = await withTransaction(async (pool) => {
      return await FileService.parseCandidateSheet(rawData, pool);
    });

    res.status(200).json({
      result: true,
      message: "Đọc và chuẩn hóa dữ liệu ứng viên thành công",
      data: result
    });
  }
);

export default parseCandidateSheetController;
