import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { platformModel } from "@model/platform/platformModel";

type CreatePlatformData = {
  platform_name: string;
  platform_description?: string | null;
};

async function create(
  data: CreatePlatformData,
  pool: PoolClient
): Promise<platformModel> {
  const { platform_name, platform_description = null } = data;

  const query = `
    INSERT INTO platform (platform_name, platform_description)
    VALUES ($1, $2)
    RETURNING platform_id, platform_name, platform_description
  `;
  const result = await pool.query(query, [platform_name, platform_description]);

  if (result.rows.length === 0) {
    throw new AppError("Lỗi khi tạo nền tảng mới", 500);
  }

  return {
    platform_id: result.rows[0].platform_id,
    platform_name: result.rows[0].platform_name,
    platform_description: result.rows[0].platform_description
  } satisfies platformModel;
}

export default create;
