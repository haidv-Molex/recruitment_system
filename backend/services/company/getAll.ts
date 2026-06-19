import { PoolClient } from "pg";
import type { companyModel } from "@model/company/companyModel";
import type { PaginationQueryMetadata } from "@type/pagination";
import Company from "@services/company/_Company";
import buildPagination from "@utilities/query/buildPagination";
import buildWhereClause from "@utilities/query/buildWhereClause";

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
  const { unlimited, limit, offset } = buildPagination(params);
  const search = params.search ? params.search.trim() : "";

  const values: any[] = [];
  const conditions: string[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`company_name ILIKE $${values.length}`);
  }

  const whereClause = buildWhereClause(conditions);
  const countQuery = `SELECT COUNT(*) AS total FROM company ${whereClause}`;
  let query = `SELECT company_id FROM company ${whereClause}`;

  // Get total count
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Append order
  query += ` ORDER BY company_id DESC`;

  // Append pagination if not unlimited
  if (!unlimited) {
    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);

  const items = await Promise.all(
    result.rows.map((row) => Company.getById(row.company_id, pool))
  ) satisfies companyModel[];

  return {
    items,
    total
  };
}

export default getAll;
