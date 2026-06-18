import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import User from "@services/user/_User";

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
      u.user_id
    FROM "user" u
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

  const items = await Promise.all(
    result.rows.map((row) => User.findById(row.user_id, pool))
  ) satisfies userOutputModel[];

  return {
    items,
    total
  };
}

export default getAll;
