import { PoolClient } from "pg";
import type { departmentModel } from "@model/department/departmentModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Department from "@services/department/_Department";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

type GetAllDepartmentsParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllDepartmentsResult = {
  items: departmentModel[];
  total: number;
};

async function getAll(
  params: GetAllDepartmentsParams,
  pool: PoolClient
): Promise<GetAllDepartmentsResult> {
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";

  let query = `
    SELECT d.department_id
    FROM department d
  `;
  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`d.department_name ILIKE $${values.length} OR d.department_code ILIKE $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM department d ${whereClause}`;
  query += whereClause;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY d.department_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => Department.getById(row.department_id, pool))
  ) satisfies departmentModel[];

  return {
    items,
    total
  };
}

export default getAll;
