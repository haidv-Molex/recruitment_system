import type { userOutputModel } from "@model/user/userModel";
import type { departmentModel } from "@model/department/departmentModel";
import type { segmentModel } from "@model/segment/segmentModel";
import type { siteModel } from "@model/site/siteModel";
import type { levelModel } from "@model/level/levelModel";

export type jobModel = {
  job_id: number;
  job_code: string;
  project: string;
  note: string | null;
  request_date: Date | null;
  create_at: Date;
  update_at: Date;
  file_id: number | null;
}

export type jobOutputModel = Omit<jobModel, 'file_id'> & {
  file: {
    file_id: number;
    file_path: string;
    file_url: string;
  } | null;
  partners?: userOutputModel[];
  departments?: (departmentModel & { candidate_required: number; user_id?: number | null })[];
  segments?: segmentModel[];
  sites?: siteModel[];
  titles?: levelModel[];
  managers?: userOutputModel[];
  employee_levels?: levelModel[];
}