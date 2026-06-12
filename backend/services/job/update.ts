import { PoolClient } from "pg";
import { AppError } from "@middlewares/AppError";
import type { jobOutputModel } from "@model/job/jobModel";
import FileService from "@services/file/_File";
import { populateJobRelations } from "./populate";
import fs from "fs";
import path from "path";
import Department from "@services/department/_Department";
import User from "@services/user/_User";
import Segment from "@services/segment/_Segment";
import Site from "@services/site/_Site";
import Level from "@services/level/_Level";

type UpdateJobData = {
  job_code?: string;
  project?: string;
  candidate_required?: number;
  note?: string | null;
  request_date?: string | Date | null;
  file?: {
    originalname: string;
    buffer: Buffer;
  } | null;
  partners?: number[];
  departments?: number[];
  segments?: number[];
  sites?: number[];
  titles?: number[];
  managers?: number[];
  employee_levels?: number[];

  partners_name?: string[];
  departments_name?: string[];
  segments_name?: string[];
  sites_name?: string[];
  titles_name?: string[];
  managers_name?: string[];
  employee_levels_name?: string[];
};

async function update(
  id: number,
  data: UpdateJobData,
  pool: PoolClient
): Promise<jobOutputModel> {
  const checkJob = await pool.query("SELECT job_id FROM job WHERE job_id = $1", [id]);
  if (checkJob.rows.length === 0) {
    throw new AppError("Không tìm thấy thông tin công việc để cập nhật", 404);
  }

  let file_id: number | undefined = undefined;
  let uploadedFilePath: string | null = null;

  try {
    // 1. If file is provided, upload it first (create new file record)
    if (data.file) {
      const fileRes = await FileService.upload({
        type: "jd",
        originalname: data.file.originalname,
        buffer: data.file.buffer
      }, pool);
      file_id = fileRes.file_id;
      uploadedFilePath = fileRes.file_path;
    }

    // 2. Build Job update query
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (data.job_code !== undefined) {
      fields.push(`job_code = $${index++}`);
      values.push(data.job_code);
    }
    if (data.project !== undefined) {
      fields.push(`project = $${index++}`);
      values.push(data.project);
    }
    if (data.candidate_required !== undefined) {
      fields.push(`candidate_required = $${index++}`);
      values.push(data.candidate_required);
    }
    if (data.note !== undefined) {
      fields.push(`note = $${index++}`);
      values.push(data.note);
    }
    if (data.request_date !== undefined) {
      fields.push(`request_date = $${index++}`);
      values.push(data.request_date);
    }
    if (file_id !== undefined) {
      fields.push(`file_id = $${index++}`);
      values.push(file_id);
    }

    if (fields.length > 0) {
      values.push(id);
      const query = `
        UPDATE job
        SET ${fields.join(", ")}, update_at = NOW()
        WHERE job_id = $${index}
      `;
      await pool.query(query, values);
    }

    // 3. Update linking records if provided
    // partners
    if (data.partners !== undefined || data.partners_name !== undefined) {
      const partnersList = data.partners || [];
      const newPartnerIds: number[] = [];
      if (data.partners_name) {
        for (const name of data.partners_name) {
          const user = await User.create({ username: name }, pool);
          newPartnerIds.push(user.user_id);
        }
      }
      const merged = [...partnersList, ...newPartnerIds];

      // Clear existing
      await pool.query(`DELETE FROM job_business_partner WHERE job_id = $1`, [id]);
      // Insert new
      for (const userId of merged) {
        const userCheck = await pool.query(`SELECT user_id FROM "user" WHERE user_id = $1`, [userId]);
        if (userCheck.rows.length === 0) {
          throw new AppError(`Đối tác (user_id = ${userId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO job_business_partner (job_id, user_id) VALUES ($1, $2)`,
          [id, userId]
        );
      }
    }

    // departments
    if (data.departments !== undefined || data.departments_name !== undefined) {
      const deptsList = data.departments || [];
      const newDeptIds: number[] = [];
      if (data.departments_name) {
        for (const name of data.departments_name) {
          const dept = await Department.create({
            department_code: name.toUpperCase(),
            department_name: name,
          }, pool);
          newDeptIds.push(dept.department_id);
        }
      }
      const merged = [...deptsList, ...newDeptIds];

      await pool.query(`DELETE FROM job_department WHERE job_id = $1`, [id]);
      for (const departmentId of merged) {
        const depCheck = await pool.query(`SELECT department_id FROM department WHERE department_id = $1`, [departmentId]);
        if (depCheck.rows.length === 0) {
          throw new AppError(`Phòng ban (department_id = ${departmentId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO job_department (job_id, department_id) VALUES ($1, $2)`,
          [id, departmentId]
        );
      }
    }

    // segments
    if (data.segments !== undefined || data.segments_name !== undefined) {
      const segsList = data.segments || [];
      const newSegIds: number[] = [];
      if (data.segments_name) {
        for (const name of data.segments_name) {
          const seg = await Segment.create({ segment_name: name }, pool);
          newSegIds.push(seg.segment_id);
        }
      }
      const merged = [...segsList, ...newSegIds];

      await pool.query(`DELETE FROM job_segment WHERE job_id = $1`, [id]);
      for (const segmentId of merged) {
        const segCheck = await pool.query(`SELECT segment_id FROM segment WHERE segment_id = $1`, [segmentId]);
        if (segCheck.rows.length === 0) {
          throw new AppError(`Phân khúc (segment_id = ${segmentId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO job_segment (job_id, segment_id) VALUES ($1, $2)`,
          [id, segmentId]
        );
      }
    }

    // sites
    if (data.sites !== undefined || data.sites_name !== undefined) {
      const sitesList = data.sites || [];
      const newSiteIds: number[] = [];
      if (data.sites_name) {
        for (const name of data.sites_name) {
          const site = await Site.create({ site_name: name }, pool);
          newSiteIds.push(site.site_id);
        }
      }
      const merged = [...sitesList, ...newSiteIds];

      await pool.query(`DELETE FROM job_site WHERE job_id = $1`, [id]);
      for (const siteId of merged) {
        const siteCheck = await pool.query(`SELECT site_id FROM site WHERE site_id = $1`, [siteId]);
        if (siteCheck.rows.length === 0) {
          throw new AppError(`Địa điểm (site_id = ${siteId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO job_site (job_id, site_id) VALUES ($1, $2)`,
          [id, siteId]
        );
      }
    }

    // titles
    if (data.titles !== undefined || data.titles_name !== undefined) {
      const titlesList = data.titles || [];
      const newTitleIds: number[] = [];
      if (data.titles_name) {
        for (const name of data.titles_name) {
          const level = await Level.create({ level_name: name }, pool);
          newTitleIds.push(level.level_id);
        }
      }
      const merged = [...titlesList, ...newTitleIds];

      await pool.query(`DELETE FROM job_title WHERE job_id = $1`, [id]);
      for (const levelId of merged) {
        const lvlCheck = await pool.query(`SELECT level_id FROM level WHERE level_id = $1`, [levelId]);
        if (lvlCheck.rows.length === 0) {
          throw new AppError(`Chức danh (level_id = ${levelId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO job_title (job_id, level_id) VALUES ($1, $2)`,
          [id, levelId]
        );
      }
    }

    // managers
    if (data.managers !== undefined || data.managers_name !== undefined) {
      const managersList = data.managers || [];
      const newManagerIds: number[] = [];
      if (data.managers_name) {
        for (const name of data.managers_name) {
          const user = await User.create({ username: name }, pool);
          newManagerIds.push(user.user_id);
        }
      }
      const merged = [...managersList, ...newManagerIds];

      await pool.query(`DELETE FROM hiring_manager WHERE job_id = $1`, [id]);
      for (const userId of merged) {
        const userCheck = await pool.query(`SELECT user_id FROM "user" WHERE user_id = $1`, [userId]);
        if (userCheck.rows.length === 0) {
          throw new AppError(`Quản lý tuyển dụng (user_id = ${userId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO hiring_manager (job_id, user_id) VALUES ($1, $2)`,
          [id, userId]
        );
      }
    }

    // employee_levels
    if (data.employee_levels !== undefined || data.employee_levels_name !== undefined) {
      const elList = data.employee_levels || [];
      const newElIds: number[] = [];
      if (data.employee_levels_name) {
        for (const name of data.employee_levels_name) {
          const level = await Level.create({ level_name: name }, pool);
          newElIds.push(level.level_id);
        }
      }
      const merged = [...elList, ...newElIds];

      await pool.query(`DELETE FROM employee_level WHERE job_id = $1`, [id]);
      for (const levelId of merged) {
        const lvlCheck = await pool.query(`SELECT level_id FROM level WHERE level_id = $1`, [levelId]);
        if (lvlCheck.rows.length === 0) {
          throw new AppError(`Cấp bậc nhân viên (level_id = ${levelId}) không tồn tại`, 400);
        }
        await pool.query(
          `INSERT INTO employee_level (job_id, level_id) VALUES ($1, $2)`,
          [id, levelId]
        );
      }
    }

    // 4. Retrieve complete job output info
    const query = `
      SELECT j.job_id, j.job_code, j.project, j.candidate_required, j.note, j.request_date, j.create_at, j.update_at, j.file_id,
             f.file_path
      FROM job j
      LEFT JOIN file f ON j.file_id = f.file_id
      WHERE j.job_id = $1
    `;
    const finalJobRes = await pool.query(query, [id]);
    const row = finalJobRes.rows[0];
    const host = process.env.HOST || "http://localhost:3000";

    const relations = await populateJobRelations(row.job_id, pool);

    return {
      job_id: row.job_id,
      job_code: row.job_code,
      project: row.project,
      candidate_required: row.candidate_required,
      note: row.note,
      request_date: row.request_date,
      create_at: row.create_at,
      update_at: row.update_at,
      file: row.file_id ? {
        file_id: row.file_id,
        file_path: row.file_path,
        file_url: `${host}/file/${row.file_path}`
      } : null,
      ...relations
    } satisfies jobOutputModel;

  } catch (error) {
    // Rollback side effects: delete file from disk if it was uploaded in this transaction
    if (uploadedFilePath) {
      const absolutePath = path.resolve(process.env.PATH_SAVE_FILE || "./uploads", uploadedFilePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
    throw error;
  }
}

export default update;
