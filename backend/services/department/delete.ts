import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";

async function deleteDepartment(
  idOrIds: number | number[],
  pool: PoolClient
): Promise<void> {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  if (ids.length === 0) return;

  const checkQuery = `SELECT department_id FROM department WHERE department_id = ANY($1::int[])`;
  const checkResult = await pool.query(checkQuery, [ids]);
  if (checkResult.rows.length === 0) {
    throw new AppError("Không tìm thấy phòng ban để xóa", 404);
  }

  // Note: department might be referenced by user.department_id, but the DB constraints will handle or throw if restricted.
  // We can let PG throw foreign key constraint violation, which is handled as DatabaseError in globalErrorHandler, or handle it here.
  // Letting the query fail is standard and secure.
  const query = `
    DELETE FROM department
    WHERE department_id = ANY($1::int[])
  `;
  await pool.query(query, [ids]);
}

export default deleteDepartment;
