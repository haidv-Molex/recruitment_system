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
  let query = `
    SELECT d.department_id, d.department_code, d.department_name, d.department_description, d.user_id, d.create_at, d.update_at,
           u.user_name, u.user_description AS u_description, u.user_role, u.create_at AS u_create_at, u.update_at AS u_update_at
    FROM department d
    LEFT JOIN "user" u ON d.user_id = u.user_id
  `;
  const values: any[] = [];
  let index = 1;

  if (search) {
    countQuery += ` WHERE department_name ILIKE $${index} OR department_code ILIKE $${index}`;
    query += ` WHERE d.department_name ILIKE $${index} OR d.department_code ILIKE $${index}`;
    values.push(`%${search}%`);
    index++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY d.department_id DESC`;

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
    update_at: row.update_at,
    user: row.user_id ? {
      user_id: row.user_id,
      user_name: row.user_name,
      user_description: row.u_description,
      user_role: row.user_role,
      create_at: row.u_create_at,
      update_at: row.u_update_at
    } : null
  })) satisfies departmentModel[];

  return {
    items,
    total
  };
}

export default getAll;
