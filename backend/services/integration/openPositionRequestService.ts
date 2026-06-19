import { PoolClient } from "pg";
import type {
  CreateOpenPositionRequestInput,
  OpenPositionRequestModel,
} from "@model/integration/openPositionRequestModel";

export type GetOpenPositionRequestsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type GetOpenPositionRequestsResult = {
  items: OpenPositionRequestModel[];
  total: number;
};

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS open_position_request (
  request_id SERIAL PRIMARY KEY,
  external_approval_id VARCHAR(255) UNIQUE,
  approval_status VARCHAR(50) NOT NULL,
  title VARCHAR(500),
  requestor_name VARCHAR(255),
  business_unit VARCHAR(255),
  position_title VARCHAR(255),
  contract_type VARCHAR(100),
  employment_type VARCHAR(100),
  cost_center VARCHAR(100),
  report_to VARCHAR(255),
  headcount_required INT,
  recruitment_reason TEXT,
  support_project VARCHAR(255),
  teams_link TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  job_id INT REFERENCES job(job_id) ON DELETE SET NULL,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

function normalizeText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function ensureTable(pool: PoolClient) {
  await pool.query(TABLE_SQL);
}

function mapRow(row: any): OpenPositionRequestModel {
  return {
    request_id: row.request_id,
    external_approval_id: row.external_approval_id,
    approval_status: row.approval_status,
    title: row.title,
    requestor_name: row.requestor_name,
    business_unit: row.business_unit,
    position_title: row.position_title,
    contract_type: row.contract_type,
    employment_type: row.employment_type,
    cost_center: row.cost_center,
    report_to: row.report_to,
    headcount_required: row.headcount_required,
    recruitment_reason: row.recruitment_reason,
    support_project: row.support_project,
    teams_link: row.teams_link,
    raw_payload: row.raw_payload || {},
    job_id: row.job_id,
    create_at: row.create_at,
    update_at: row.update_at,
  };
}

export async function createOpenPositionRequest(
  input: CreateOpenPositionRequestInput,
  pool: PoolClient
): Promise<OpenPositionRequestModel> {
  await ensureTable(pool);

  const values = [
    normalizeText(input.external_approval_id),
    normalizeText(input.approval_status) || "Approved",
    normalizeText(input.title),
    normalizeText(input.requestor_name),
    normalizeText(input.business_unit),
    normalizeText(input.position_title),
    normalizeText(input.contract_type),
    normalizeText(input.employment_type),
    normalizeText(input.cost_center),
    normalizeText(input.report_to),
    normalizeNumber(input.headcount_required),
    normalizeText(input.recruitment_reason),
    normalizeText(input.support_project),
    normalizeText(input.teams_link),
    JSON.stringify(input.raw_payload || {}),
  ];

  const result = await pool.query(
    `INSERT INTO open_position_request (
      external_approval_id,
      approval_status,
      title,
      requestor_name,
      business_unit,
      position_title,
      contract_type,
      employment_type,
      cost_center,
      report_to,
      headcount_required,
      recruitment_reason,
      support_project,
      teams_link,
      raw_payload
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb
    )
    ON CONFLICT (external_approval_id) DO UPDATE SET
      approval_status = EXCLUDED.approval_status,
      title = EXCLUDED.title,
      requestor_name = EXCLUDED.requestor_name,
      business_unit = EXCLUDED.business_unit,
      position_title = EXCLUDED.position_title,
      contract_type = EXCLUDED.contract_type,
      employment_type = EXCLUDED.employment_type,
      cost_center = EXCLUDED.cost_center,
      report_to = EXCLUDED.report_to,
      headcount_required = EXCLUDED.headcount_required,
      recruitment_reason = EXCLUDED.recruitment_reason,
      support_project = EXCLUDED.support_project,
      teams_link = EXCLUDED.teams_link,
      raw_payload = EXCLUDED.raw_payload,
      update_at = CURRENT_TIMESTAMP
    RETURNING *`,
    values
  );

  return mapRow(result.rows[0]);
}

export async function getOpenPositionRequests(
  params: GetOpenPositionRequestsParams,
  pool: PoolClient
): Promise<GetOpenPositionRequestsResult> {
  await ensureTable(pool);

  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;
  const search = params.search?.trim() || "";
  const values: any[] = [];
  let filter = "";

  if (search) {
    values.push(`%${search}%`);
    filter = `WHERE title ILIKE $1 OR position_title ILIKE $1 OR requestor_name ILIKE $1 OR cost_center ILIKE $1`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM open_position_request ${filter}`,
    values
  );

  const queryValues = [...values, limit, offset];
  const result = await pool.query(
    `SELECT * FROM open_position_request
     ${filter}
     ORDER BY create_at DESC, request_id DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    queryValues
  );

  return {
    items: result.rows.map(mapRow),
    total: Number(countResult.rows[0].total),
  };
}

export async function getOpenPositionRequestById(
  id: number,
  pool: PoolClient
): Promise<OpenPositionRequestModel | null> {
  await ensureTable(pool);

  const result = await pool.query(
    `SELECT * FROM open_position_request WHERE request_id = $1 LIMIT 1`,
    [id]
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
