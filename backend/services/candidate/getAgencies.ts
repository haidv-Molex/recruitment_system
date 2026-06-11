import { PoolClient } from "pg";
import type { HeadhuntAgency } from "@model/candidate/candidateModel";

// Danh sách agency "chuẩn" định nghĩa trong type — luôn có trong kết quả kể cả khi DB trống
const DEFAULT_AGENCIES: HeadhuntAgency[] = [
  'AsiaHr',
  'Navigos',
  'Adecco',
  'Manpower',
  'Talentrader',
  'Prosworks',
  '40Hrs',
  'Persol',
  'Career Viet',
  'Job C',
  'EV search',
];

/**
 * Lấy danh sách agency duy nhất:
 * = union(DEFAULT_AGENCIES, giá trị DISTINCT từ DB), loại trùng, sort A-Z.
 * Đảm bảo các agency chuẩn luôn có mặt kể cả khi DB chưa có dữ liệu,
 * đồng thời không bỏ sót giá trị tự do ngoài type đã được nhập vào DB.
 */
async function getAgencies(pool: PoolClient): Promise<string[]> {
  const result = await pool.query<{ agency: string }>(
    `SELECT DISTINCT agency
     FROM candidate
     WHERE agency IS NOT NULL`
  );

  const fromDb = result.rows.map((row) => row.agency);
  const merged = Array.from(new Set([...DEFAULT_AGENCIES, ...fromDb]));
  merged.sort((a, b) => a.localeCompare(b));

  return merged;
}

export { getAgencies };

