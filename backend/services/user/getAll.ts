import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllUsersParams = PaginationQueryMetadata & {
  search?: string;
  role?: string;
};

type GetAllUsersResult = {
  items: userOutputModel[];
  total: number;
};

async function getAll(
  params: GetAllUsersParams,
  pool: PoolClient
): Promise<GetAllUsersResult> {
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";
  const role = params.role ? params.role.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM "user"`;
  let query = `
    SELECT
      u.user_id, u.user_name, u.user_description, u.user_role,
      u.create_at, u.update_at,
      d.department_id, d.department_code, d.department_name, d.department_description,
      d.create_at AS d_create_at, d.update_at AS d_update_at
    FROM "user" u
    LEFT JOIN department d ON u.department_id = d.department_id
  `;
  const values: any[] = [];
  let index = 1;

  const conditions: string[] = [];
  const countConditions: string[] = [];

  if (search) {
    conditions.push(`u.user_name ILIKE $${index}`);
    countConditions.push(`user_name ILIKE $${index}`);
    values.push(`%${search}%`);
    index++;
  }

  if (role) {
    conditions.push(`u.user_role = $${index}`);
    countConditions.push(`user_role = $${index}`);
    values.push(role);
    index++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
    countQuery += ` WHERE ` + countConditions.join(" AND ");
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY u.user_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    user_id: row.user_id,
    user_name: row.user_name,
    user_description: row.user_description,
    user_role: row.user_role,
    create_at: row.create_at,
    update_at: row.update_at,
    department: row.department_id != null ? {
      department_id: row.department_id,
      department_code: row.department_code,
      department_name: row.department_name,
      department_description: row.department_description,
      create_at: row.d_create_at,
      update_at: row.d_update_at
    } : null
  })) satisfies userOutputModel[];

  return {
    items,
    total
  };
}

export default getAll;
