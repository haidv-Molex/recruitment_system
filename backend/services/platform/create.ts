import { PoolClient } from "pg";
import type { platformModel } from "@model/platform/platformModel";
import Platform from "@services/platform/_Platform";
import assertFirstRow from "@utilities/db/assertFirstRow";

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
    RETURNING platform_id
  `;
  const result = await pool.query(query, [platform_name, platform_description]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo nền tảng mới", 500);

  return await Platform.getById(row.platform_id, pool);
}

export default create;
