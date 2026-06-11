import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllUsersParams = PaginationQueryMetadata & {
  search?: string;
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

  let countQuery = `SELECT COUNT(*) AS total FROM "user"`;
  let query = `SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at FROM "user"`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE user_name ILIKE $${index}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY user_id DESC`;

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
    department_id: row.department_id,
    create_at: row.create_at,
    update_at: row.update_at
  })) satisfies userOutputModel[];

  return {
    items,
    total
  };
}

export default getAll;
