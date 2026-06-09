import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteDepartment(
  id: number,
  pool: PoolClient
): Promise<void> {
  const checkQuery = `SELECT department_id FROM department WHERE department_id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy phòng ban để xóa", 404);
  }

  // Note: department might be referenced by user.department_id, but the DB constraints will handle or throw if restricted.
  // We can let PG throw foreign key constraint violation, which is handled as DatabaseError in globalErrorHandler, or handle it here.
  // Letting the query fail is standard and secure.
  const query = `
    DELETE FROM department
    WHERE department_id = $1
  `;
  await pool.query(query, [id]);
}

export default deleteDepartment;
