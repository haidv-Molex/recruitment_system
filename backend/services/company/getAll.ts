import { PoolClient } from "pg";
import type { companyModel } from "@model/company/companyModel";
import type { PaginationQueryMetadata } from "@type/pagination";

type GetAllCompaniesParams = PaginationQueryMetadata & {
  search?: string;
};

type GetAllCompaniesResult = {
  items: companyModel[];
  total: number;
};

async function getAll(
  params: GetAllCompaniesParams,
  pool: PoolClient
): Promise<GetAllCompaniesResult> {
  const unlimited = params.unlimited === true;
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search ? params.search.trim() : "";

  let countQuery = `SELECT COUNT(*) AS total FROM company`;
  let query = `SELECT company_id, company_name, company_description FROM company`;
  const values: any[] = [];
  let index = 1;

  if (search) {
    const filter = ` WHERE company_name ILIKE $${index++}`;
    countQuery += filter;
    query += filter;
    values.push(`%${search}%`);
  }

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY company_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    query += ` LIMIT $${index++} OFFSET $${index++}`;
    values.push(limit, offset);
  }

  const result = await pool.query(query, values);

  const items = result.rows.map((row) => ({
    company_id: row.company_id,
    company_name: row.company_name,
    company_description: row.company_description
  })) satisfies companyModel[];

  return {
    items,
    total
  };
}

export default getAll;
