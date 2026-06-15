import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { jobOutputModel } from "@model/job/jobModel";
import FileService from "@services/file/_File";
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
  partners?: number[];
  departments?: { department_id: number; candidate_required: number; user_id?: number | null }[];
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
    partners = [],
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
    // departments -> job_department (job_id, department_id, candidate_required, user_id)
    const departmentsList = [];
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      const departmentId = dept.department_id;
      const candidateRequired = dept.candidate_required;
      let userId = dept.user_id;

      // Map top-level partners to departments if not explicitly set
      if (userId === undefined || userId === null) {
        if (partners.length > 0) {
          if (partners.length === 1) {
            userId = partners[0];
          } else {
            userId = partners[i] !== undefined ? partners[i] : null;
          }
        } else {
          userId = null;
        }
      }

      const depCheck = await pool.query(
        `SELECT department_id, department_code, department_name, department_description, create_at, update_at 
         FROM department WHERE department_id = $1`, [departmentId]
      );
      if (depCheck.rows.length === 0) {
        throw new AppError(`Phòng ban (department_id = ${departmentId}) không tồn tại`, 400);
      }

      let userCheckRow = null;
      if (userId) {
        const userCheck = await pool.query(
          `SELECT user_id, user_name, user_description, user_role, create_at, update_at, department_id 
           FROM "user" WHERE user_id = $1`, [userId]
        );
        if (userCheck.rows.length === 0) {
          throw new AppError(`Đối tác (user_id = ${userId}) không tồn tại`, 400);
        }
        userCheckRow = userCheck.rows[0];
      }

      const deptData = { 
        ...depCheck.rows[0], 
        candidate_required: candidateRequired,
        user_id: userId,
        user: userCheckRow
      };
      departmentsList.push(deptData);

      await pool.query(
        `INSERT INTO job_department (job_id, department_id, candidate_required, user_id) VALUES ($1, $2, $3, $4)`,
        [jobId, departmentId, candidateRequired, userId]
      );
    }

    const partnersList = Array.from(new Map(
      departmentsList.map(d => d.user).filter(Boolean).map(u => [u.user_id, u])
    ).values());

    // segments -> job_segment (job_id, segment_id)
    const segmentsList = [];
    for (const segmentId of segments) {
      const segCheck = await pool.query(
        `SELECT segment_id, segment_code, segment_name, segment_description, create_at, update_at 
         FROM segment WHERE segment_id = $1`, [segmentId]
      );
      if (segCheck.rows.length === 0) {
        throw new AppError(`Phân khúc (segment_id = ${segmentId}) không tồn tại`, 400);
      }
      segmentsList.push(segCheck.rows[0]);
      await pool.query(
        `INSERT INTO job_segment (job_id, segment_id) VALUES ($1, $2)`,
        [jobId, segmentId]
      );
    }

    // sites -> job_site (job_id, site_id)
    const sitesList = [];
    for (const siteId of sites) {
      const siteCheck = await pool.query(
        `SELECT site_id, site_code, site_name, site_description, create_at, update_at 
         FROM site WHERE site_id = $1`, [siteId]
      );
      if (siteCheck.rows.length === 0) {
        throw new AppError(`Địa điểm (site_id = ${siteId}) không tồn tại`, 400);
      }
      sitesList.push(siteCheck.rows[0]);
      await pool.query(
        `INSERT INTO job_site (job_id, site_id) VALUES ($1, $2)`,
        [jobId, siteId]
      );
    }

    // titles -> job_title (job_id, level_id)
    const titlesList = [];
    for (const levelId of titles) {
      const lvlCheck = await pool.query(
        `SELECT level_id, level_code, level_name, level_description, create_at, update_at 
         FROM level WHERE level_id = $1`, [levelId]
      );
      if (lvlCheck.rows.length === 0) {
        throw new AppError(`Chức danh (level_id = ${levelId}) không tồn tại`, 400);
      }
      titlesList.push(lvlCheck.rows[0]);
      await pool.query(
        `INSERT INTO job_title (job_id, level_id) VALUES ($1, $2)`,
        [jobId, levelId]
      );
    }

    // managers -> hiring_manager (job_id, user_id)
    const managersList = [];
    for (const userId of managers) {
      const userCheck = await pool.query(
        `SELECT user_id, user_name, user_description, user_role, create_at, update_at, department_id 
         FROM "user" WHERE user_id = $1`, [userId]
      );
      if (userCheck.rows.length === 0) {
        throw new AppError(`Quản lý tuyển dụng (user_id = ${userId}) không tồn tại`, 400);
      }
      managersList.push(userCheck.rows[0]);
      await pool.query(
        `INSERT INTO hiring_manager (job_id, user_id) VALUES ($1, $2)`,
        [jobId, userId]
      );
    }

    // employee_levels -> employee_level (job_id, level_id)
    const employeeLevelsList = [];
    for (const levelId of employee_levels) {
      const lvlCheck = await pool.query(
        `SELECT level_id, level_code, level_name, level_description, create_at, update_at 
         FROM level WHERE level_id = $1`, [levelId]
      );
      if (lvlCheck.rows.length === 0) {
        throw new AppError(`Cấp bậc nhân viên (level_id = ${levelId}) không tồn tại`, 400);
      }
      employeeLevelsList.push(lvlCheck.rows[0]);
      await pool.query(
        `INSERT INTO employee_level (job_id, level_id) VALUES ($1, $2)`,
        [jobId, levelId]
      );
    }

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
