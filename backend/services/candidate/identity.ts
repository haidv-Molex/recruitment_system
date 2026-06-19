import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

const candidateCodeLockKey = "candidate_candidate_code";

export function normalizeCandidateCode(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeCandidateEmail(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export async function generateNextCandidateCode(pool: PoolClient): Promise<string> {
  await pool.query("SELECT pg_advisory_xact_lock(hashtext($1))", [candidateCodeLockKey]);

  const result = await pool.query(`
    SELECT COALESCE(MAX(SUBSTRING(candidate_code FROM 2)::INT), 0) + 1 AS next_number
    FROM candidate
    WHERE candidate_code ~* '^V[0-9]+$'
  `);
  const nextNumber = Number(result.rows[0]?.next_number || 1);

  return `V${String(nextNumber).padStart(5, "0")}`;
}

export async function resolveCandidateCode(
  value: string | null | undefined,
  pool: PoolClient
): Promise<string> {
  const normalizedCode = normalizeCandidateCode(value);
  return normalizedCode || await generateNextCandidateCode(pool);
}

export async function findCandidateByEmail(
  email: string | null | undefined,
  pool: PoolClient
): Promise<{ candidate_id: number } | null> {
  const normalizedEmail = normalizeCandidateEmail(email);
  if (!normalizedEmail) return null;

  const result = await pool.query(
    `SELECT candidate_id
     FROM candidate
     WHERE LOWER(TRIM(candidate_email)) = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  return result.rows[0] || null;
}

export async function assertCandidateEmailAvailable(
  email: string | null | undefined,
  pool: PoolClient,
  excludeCandidateId?: number
): Promise<void> {
  const normalizedEmail = normalizeCandidateEmail(email);
  if (!normalizedEmail) return;

  const values: Array<string | number> = [normalizedEmail];
  let excludeClause = "";
  if (excludeCandidateId !== undefined) {
    values.push(excludeCandidateId);
    excludeClause = "AND candidate_id <> $2";
  }

  const result = await pool.query(
    `SELECT candidate_id
     FROM candidate
     WHERE LOWER(TRIM(candidate_email)) = $1
       ${excludeClause}
     LIMIT 1`,
    values
  );

  if (result.rows.length > 0) {
    throw new AppError("Email ứng viên đã tồn tại", 409);
  }
}

export async function assertCandidateCodeAvailable(
  candidateCode: string | null | undefined,
  pool: PoolClient,
  excludeCandidateId?: number
): Promise<void> {
  const normalizedCode = normalizeCandidateCode(candidateCode);
  if (!normalizedCode) return;

  const values: Array<string | number> = [normalizedCode.toLowerCase()];
  let excludeClause = "";
  if (excludeCandidateId !== undefined) {
    values.push(excludeCandidateId);
    excludeClause = "AND candidate_id <> $2";
  }

  const result = await pool.query(
    `SELECT candidate_id
     FROM candidate
     WHERE LOWER(TRIM(candidate_code)) = $1
       ${excludeClause}
     LIMIT 1`,
    values
  );

  if (result.rows.length > 0) {
    throw new AppError("Mã ứng viên đã tồn tại", 409);
  }
}