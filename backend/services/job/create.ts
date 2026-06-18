import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { jobOutputModel } from "@model/job/jobModel";
import type { userOutputModel } from "@model/user/userModel";
import FileService from "@services/file/_File";
import Department from "@services/department/_Department";
import Level from "@services/level/_Level";
import Segment from "@services/segment/_Segment";
import Site from "@services/site/_Site";
import User from "@services/user/_User";
import { insertLinkRows, type LinkRow } from "@utilities/db/linking";
import fs from "fs";
import path from "path";

type CreateJobData = {
  job_code: string;
  project: string;
  note?: string | null;
  request_date?: string | Date | null;
  file?: {
    originalname: string;
    buffer: Buffer;
  } | null;
  departments?: { department_id: number; candidate_required: number }[];
  segments?: number[];
  sites?: number[];
  titles?: number[];
  managers?: number[];
  employee_levels?: number[];
};

async function create(
  data: CreateJobData,
  pool: PoolClient
): Promise<jobOutputModel> {
  const {
    job_code,
    project,
    note = null,
    request_date = null,
    file = null,
    departments = [],
    segments = [],
    sites = [],
    titles = [],
    managers = [],
    employee_levels = []
  } = data;

  let file_id: number | null = null;
  let uploadedFilePath: string | null = null;

  try {
    // 1. If file is provided, upload it first
    if (file) {
      const fileRes = await FileService.upload({
        type: "jd",
        originalname: file.originalname,
        buffer: file.buffer
      }, pool);
      file_id = fileRes.file_id;
      uploadedFilePath = fileRes.file_path;
    }

    // 2. Insert Job record
    const query = `
      INSERT INTO job (job_code, project, note, file_id, request_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING job_id, job_code, project, note, request_date, create_at, update_at, file_id
    `;
    const result = await pool.query(query, [job_code, project, note, file_id, request_date]);

    if (result.rows.length === 0) {
      throw new AppError("Lỗi khi tạo công việc mới", 500);
    }

    const jobRow = result.rows[0];
    const jobId = jobRow.job_id;

    // 3. Insert and fetch linking records
    // departments -> job_department (job_id, department_id, candidate_required)
    const departmentsList = [];
    const departmentLinkRows: LinkRow[] = [];
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      const departmentId = dept.department_id;
      const candidateRequired = dept.candidate_required;

      let departmentData;
      try {
        departmentData = await Department.getById(departmentId, pool);
      } catch (error) {
        throw new AppError(`Phòng ban (department_id = ${departmentId}) không tồn tại`, 400);
      }

      departmentsList.push({
        ...departmentData,
        candidate_required: candidateRequired,
      });

      departmentLinkRows.push({ job_id: jobId, department_id: departmentId, candidate_required: candidateRequired });
    }
    await insertLinkRows(pool, "job_department", departmentLinkRows);

    const partnersList = Array.from(new Map(
      departmentsList.map(d => d.user).filter(Boolean).map(u => [u!.user_id, u])
    ).values()) as userOutputModel[];

    // segments -> job_segment (job_id, segment_id)
    const segmentsList = [];
    const segmentLinkRows: LinkRow[] = [];
    for (const segmentId of segments) {
      try {
        segmentsList.push(await Segment.getById(segmentId, pool));
      } catch (error) {
        throw new AppError(`Phân khúc (segment_id = ${segmentId}) không tồn tại`, 400);
      }
      segmentLinkRows.push({ job_id: jobId, segment_id: segmentId });
    }
    await insertLinkRows(pool, "job_segment", segmentLinkRows);

    // sites -> job_site (job_id, site_id)
    const sitesList = [];
    const siteLinkRows: LinkRow[] = [];
    for (const siteId of sites) {
      try {
        sitesList.push(await Site.getById(siteId, pool));
      } catch (error) {
        throw new AppError(`Địa điểm (site_id = ${siteId}) không tồn tại`, 400);
      }
      siteLinkRows.push({ job_id: jobId, site_id: siteId });
    }
    await insertLinkRows(pool, "job_site", siteLinkRows);

    // titles -> job_title (job_id, level_id)
    const titlesList = [];
    const titleLinkRows: LinkRow[] = [];
    for (const levelId of titles) {
      try {
        titlesList.push(await Level.getById(levelId, pool));
      } catch (error) {
        throw new AppError(`Chức danh (level_id = ${levelId}) không tồn tại`, 400);
      }
      titleLinkRows.push({ job_id: jobId, level_id: levelId });
    }
    await insertLinkRows(pool, "job_title", titleLinkRows);

    // managers -> hiring_manager (job_id, user_id)
    const managersList = [];
    const managerLinkRows: LinkRow[] = [];
    for (const userId of managers) {
      try {
        managersList.push(await User.findById(userId, pool));
      } catch (error) {
        throw new AppError(`Quản lý tuyển dụng (user_id = ${userId}) không tồn tại`, 400);
      }
      managerLinkRows.push({ job_id: jobId, user_id: userId });
    }
    await insertLinkRows(pool, "hiring_manager", managerLinkRows);

    // employee_levels -> employee_level (job_id, level_id)
    const employeeLevelsList = [];
    const employeeLevelLinkRows: LinkRow[] = [];
    for (const levelId of employee_levels) {
      try {
        employeeLevelsList.push(await Level.getById(levelId, pool));
      } catch (error) {
        throw new AppError(`Cấp bậc nhân viên (level_id = ${levelId}) không tồn tại`, 400);
      }
      employeeLevelLinkRows.push({ job_id: jobId, level_id: levelId });
    }
    await insertLinkRows(pool, "employee_level", employeeLevelLinkRows);

    // 4. Retrieve complete job output info
    let fileInfo: any = null;
    if (file_id && uploadedFilePath) {
      const host = process.env.HOST || "http://localhost:3000";
      fileInfo = {
        file_id,
        file_path: uploadedFilePath,
        file_url: `${host}/file/${uploadedFilePath}`
      };
    }

    return {
      job_id: jobId,
      job_code: jobRow.job_code,
      project: jobRow.project,
      note: jobRow.note,
      request_date: jobRow.request_date,
      create_at: jobRow.create_at,
      update_at: jobRow.update_at,
      file: fileInfo,
      partners: partnersList,
      departments: departmentsList,
      segments: segmentsList,
      sites: sitesList,
      titles: titlesList,
      managers: managersList,
      employee_levels: employeeLevelsList
    } satisfies jobOutputModel;

  } catch (error) {
    // Rollback side effects: delete file from disk if it was uploaded
    if (uploadedFilePath) {
      const absolutePath = path.resolve(process.env.PATH_SAVE_FILE || "./uploads", uploadedFilePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
    throw error;
  }
}

export default create;
