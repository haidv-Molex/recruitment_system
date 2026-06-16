import { PoolClient } from "pg";
import type { candidateStatus } from "@model/candidate/candidateModel";

// Danh sách status "chuẩn" định nghĩa trong type — luôn có trong kết quả kể cả khi DB trống
const DEFAULT_STATUSES: candidateStatus[] = [
  'Searching',
  'CV Sent',
  'CV Fail',
  'Interview',
  'Interview Fail',
  'Hold',
  'Offered',
  'Offer Accepted',
  'Offer Rejected',
  'Onboarded',
  'Withdraw',
  'No-show',
];

/**
 * Lấy danh sách status duy nhất:
 * = union(DEFAULT_STATUSES, giá trị DISTINCT từ DB), loại trùng, sort A-Z.
 * Đảm bảo các status chuẩn luôn có mặt kể cả khi DB chưa có dữ liệu,
 * đồng thời không bỏ sót giá trị tự do ngoài type đã được nhập vào DB.
 */
async function getStatuses(pool: PoolClient): Promise<string[]> {
  const result = await pool.query<{ status: string }>(
    `SELECT DISTINCT status
     FROM candidate
     WHERE status IS NOT NULL`
  );

  const fromDb = result.rows.map((row) => row.status);
  const merged = Array.from(new Set([...DEFAULT_STATUSES, ...fromDb]));
  merged.sort((a, b) => a.localeCompare(b));

  return merged;
}

export { getStatuses };

