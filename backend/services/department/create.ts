import { PoolClient } from "pg";
import type { departmentModel } from "@model/department/departmentModel";
import Department from "@services/department/_Department";
import assertFirstRow from "@utilities/db/assertFirstRow";

type CreateDepartmentData = {
  department_code: string;
  department_name: string;
  department_description?: string | null;
  user_id?: number | null;
};

async function create(
  data: CreateDepartmentData,
  pool: PoolClient
): Promise<departmentModel> {
  const { department_code, department_name, department_description = null, user_id = null } = data;

  const query = `
    INSERT INTO department (department_code, department_name, department_description, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING department_id
  `;
  const result = await pool.query(query, [department_code, department_name, department_description, user_id]);
  const row = assertFirstRow(result.rows, "Lỗi khi tạo phòng ban mới", 500);

  return await Department.getById(row.department_id, pool);
}

export default create;
