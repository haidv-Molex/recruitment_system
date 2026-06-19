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
import { replaceLinkRows, type LinkRow } from "@utilities/db/linking";

type UpdateJobData = {
  job_code?: string;
  project?: string;
  note?: string | null;
  request_date?: string | Date | null;
  recruiter_id?: number | null;
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

  departments_name?: { name: string; candidate_required: number }[];
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
    if (data.note !== undefined) {
      fields.push(`note = $${index++}`);
      values.push(data.note);
    }
    if (data.request_date !== undefined) {
      fields.push(`request_date = $${index++}`);
      values.push(data.request_date);
    }
    if (data.recruiter_id !== undefined) {
      fields.push(`recruiter_id = $${index++}`);
      values.push(data.recruiter_id);
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
    const isDeptUpdated = data.departments !== undefined || data.departments_name !== undefined;

    if (isDeptUpdated) {
      // Resolve departments list
      let targetDepts: { department_id: number; candidate_required: number; name?: string }[] = [];
      const deptsList = data.departments || [];
      const resolvedDeptsList = [];
      for (const dept of deptsList) {
        resolvedDeptsList.push({
          department_id: dept.department_id,
          candidate_required: dept.candidate_required
        });
      }

      const newDepts: { department_id: number; candidate_required: number; name?: string }[] = [];
      if (data.departments_name) {
        for (const item of data.departments_name) {
          newDepts.push({
            department_id: 0,
            candidate_required: item.candidate_required,
            name: item.name
          });
        }
      }
      targetDepts = [...resolvedDeptsList, ...newDepts];

      const finalDeptsToInsert = [];

      for (const item of targetDepts) {
        let deptId = item.department_id;
        if (deptId === 0) {
          // Create new department
          const dept = await Department.create({
            department_code: item.name!.toUpperCase(),
            department_name: item.name!,
            user_id: null,
          }, pool);
          deptId = dept.department_id;
        }

        finalDeptsToInsert.push({
          department_id: deptId,
          candidate_required: item.candidate_required
        });
      }

      const departmentLinkRows: LinkRow[] = [];
      for (const item of finalDeptsToInsert) {
        const departmentId = item.department_id;
        const candidateRequired = item.candidate_required;

        try {
          await Department.getById(departmentId, pool);
        } catch (error) {
          throw new AppError(`Phòng ban (department_id = ${departmentId}) không tồn tại`, 400);
        }

        departmentLinkRows.push({ job_id: id, department_id: departmentId, candidate_required: candidateRequired });
      }

      await replaceLinkRows(pool, "job_department", "job_id", id, departmentLinkRows);
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

      const segmentLinkRows: LinkRow[] = [];
      for (const segmentId of merged) {
        try {
          await Segment.getById(segmentId, pool);
        } catch (error) {
          throw new AppError(`Phân khúc (segment_id = ${segmentId}) không tồn tại`, 400);
        }
        segmentLinkRows.push({ job_id: id, segment_id: segmentId });
      }

      await replaceLinkRows(pool, "job_segment", "job_id", id, segmentLinkRows);
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

      const siteLinkRows: LinkRow[] = [];
      for (const siteId of merged) {
        try {
          await Site.getById(siteId, pool);
        } catch (error) {
          throw new AppError(`Địa điểm (site_id = ${siteId}) không tồn tại`, 400);
        }
        siteLinkRows.push({ job_id: id, site_id: siteId });
      }

      await replaceLinkRows(pool, "job_site", "job_id", id, siteLinkRows);
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

      const titleLinkRows: LinkRow[] = [];
      for (const levelId of merged) {
        try {
          await Level.getById(levelId, pool);
        } catch (error) {
          throw new AppError(`Chức danh (level_id = ${levelId}) không tồn tại`, 400);
        }
        titleLinkRows.push({ job_id: id, level_id: levelId });
      }

      await replaceLinkRows(pool, "job_title", "job_id", id, titleLinkRows);
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

      const managerLinkRows: LinkRow[] = [];
      for (const userId of merged) {
        try {
          await User.findById(userId, pool);
        } catch (error) {
          throw new AppError(`Quản lý tuyển dụng (user_id = ${userId}) không tồn tại`, 400);
        }
        managerLinkRows.push({ job_id: id, user_id: userId });
      }

      await replaceLinkRows(pool, "hiring_manager", "job_id", id, managerLinkRows);
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

      const employeeLevelLinkRows: LinkRow[] = [];
      for (const levelId of merged) {
        try {
          await Level.getById(levelId, pool);
        } catch (error) {
          throw new AppError(`Cấp bậc nhân viên (level_id = ${levelId}) không tồn tại`, 400);
        }
        employeeLevelLinkRows.push({ job_id: id, level_id: levelId });
      }

      await replaceLinkRows(pool, "employee_level", "job_id", id, employeeLevelLinkRows);
    }

    // 4. Retrieve complete job output info
    const query = `
      SELECT j.job_id, j.job_code, j.project, j.note, j.request_date, j.create_at, j.update_at, j.file_id, j.recruiter_id,
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
      note: row.note,
      request_date: row.request_date,
      create_at: row.create_at,
      update_at: row.update_at,
      recruiter_id: row.recruiter_id,
      file: row.file_id ? {
        file_id: row.file_id,
        file_path: row.file_path,
        file_url: `${host}/file/${row.file_path}`
      } : null,
      recruiter: row.recruiter_id ? await User.findById(row.recruiter_id, pool) : null,
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
