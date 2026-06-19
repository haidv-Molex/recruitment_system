import type { userOutputModel } from "./userModel";
import type { departmentModel } from "./departmentModel";
import type { segmentModel } from "./segmentModel";
import type { siteModel } from "./siteModel";
import type { levelModel } from "./levelModel";
import type { noteOutputModel } from "./noteModel";

export type jobModel = {
  job_id: number;
  job_code: string;
  project: string;
  candidate_required?: number;
  note: noteOutputModel[];
  request_date: Date | null;
  create_at: Date;
  update_at: Date;
  file_id: number | null;
  recruiter_id: number | null;
}

export type jobOutputModel = Omit<jobModel, 'file_id'> & {
  file: {
    file_id: number;
    file_path: string;
    file_url: string;
  } | null;
  recruiter?: userOutputModel | null;
  partners?: userOutputModel[];
  departments?: departmentModel[];
  segments?: segmentModel[];
  sites?: siteModel[];
  titles?: levelModel[];
  managers?: userOutputModel[];
  employee_levels?: levelModel[];
}