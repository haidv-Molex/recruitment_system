import { PoolClient } from "pg";
import type { departmentModel } from "@model/department/departmentModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import User from "@services/user/_User";

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
    SELECT *
    FROM department d
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

  const items = await Promise.all(
    result.rows.map(async (row) => {
      const user = row.user_id ? await User.findById(row.user_id, pool) : null;
      return {
        department_id: row.department_id,
        department_code: row.department_code,
        department_name: row.department_name,
        department_description: row.department_description,
        create_at: row.create_at,
        update_at: row.update_at,
        user
      } satisfies departmentModel;
    })
  );

  return {
    items,
    total
  };
}

export default getAll;
