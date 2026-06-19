import type { userOutputModel } from "@model/user/userModel";

export type departmentModel = {
  department_id: number;
  department_code: string;
  department_name: string;
  department_description: string | null;
  create_at: Date;
  update_at: Date;
  candidate_required?: number;
  user?: userOutputModel | null;
}

