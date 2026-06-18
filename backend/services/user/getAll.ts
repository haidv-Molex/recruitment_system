import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import findById from "@services/user/findById";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

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
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";
  const role = params.role ? params.role.trim() : "";

  let query = `
    SELECT
      u.user_id
    FROM "user" u
  `;
  const values: any[] = [];

  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`u.user_name ILIKE $${values.length}`);
  }

  if (role) {
    values.push(role);
    conditions.push(`u.user_role = $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM "user" u ${whereClause}`;
  query += whereClause;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY u.user_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => findById(row.user_id, pool))
  ) satisfies userOutputModel[];

  return {
    items,
    total
  };
}

export default getAll;
