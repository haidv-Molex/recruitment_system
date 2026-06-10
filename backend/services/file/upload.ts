import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { fileModel } from "@model/file/fileModel";
import fs from "fs";
import path from "path";

type UploadFileData = {
  type: "cv" | "jd";
  originalname: string;
  buffer: Buffer;
};

async function upload(
  data: UploadFileData,
  pool: PoolClient
): Promise<fileModel> {
  const { type, originalname, buffer } = data;

  // 1. Generate filename: <YYYYMMDDHHmmss>_<random_1-1000>
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 1000) + 1; // 1 to 1000
  const ext = path.extname(originalname);
  const newFilename = `${timestamp}_${random}${ext}`;

  // 2. Determine target path
  const relativePath = `${type}/${newFilename}`;
  const absoluteDir = path.join(process.env.PATH_SAVE_FILE || "./uploads", type);
  const absolutePath = path.join(absoluteDir, newFilename);

  // 3. Write file to disk (ensure directory exists)
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }
  fs.writeFileSync(absolutePath, buffer);

  try {
    // 4. Insert into database
    const query = `
      INSERT INTO file (file_path)
      VALUES ($1)
      RETURNING file_id, file_path
    `;
    const result = await pool.query(query, [relativePath]);

    if (result.rows.length === 0) {
      throw new AppError("Lỗi khi lưu trữ file vào cơ sở dữ liệu", 500);
    }

    return {
      file_id: result.rows[0].file_id,
      file_path: result.rows[0].file_path
    } satisfies fileModel;
  } catch (error) {
    // Clean up file if db write fails
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    throw error;
  }
}

export default upload;
