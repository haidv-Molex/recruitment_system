import { PoolClient } from "pg";
import type { departmentModel } from "@model/department/departmentModel";
import type { PaginationQueryMetadata } from "@type/pagination";

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
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM department`;
  let query = `SELECT department_id, department_code, department_name, department_description, create_at, update_at FROM department`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE department_name ILIKE $${index} OR department_code ILIKE $${index}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY department_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    department_id: row.department_id,
    department_code: row.department_code,
    department_name: row.department_name,
    department_description: row.department_description,
    create_at: row.create_at,
    update_at: row.update_at
  })) satisfies departmentModel[];

  return {
    items,
    total
  };
}

export default getAll;
