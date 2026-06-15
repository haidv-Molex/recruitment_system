export type departmentModel = {
  department_id: number;
  department_code: string;
  department_name: string;
  department_description: string | null;
  create_at: Date;
  update_at: Date;
  candidate_required?: number;
  user_id?: number | null;
}
