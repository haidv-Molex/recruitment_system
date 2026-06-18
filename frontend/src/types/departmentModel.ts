import type { userOutputModel } from "./userModel";

export type departmentModel = {
  department_id: number;
  department_code: string;
  department_name: string;
  department_description: string | null;
  create_at: Date | string;
  update_at: Date | string;
  candidate_required?: number;
  user?: userOutputModel | null;
}
