import { PoolClient } from "pg";
import type { jobOutputModel } from "@model/job/jobModel";
import Department from "@services/department/_Department";
import User from "@services/user/_User";
import Segment from "@services/segment/_Segment";
import Site from "@services/site/_Site";
import Level from "@services/level/_Level";
import create from "@services/job/create";
import { AppError } from "@middlewares/AppError";
import normalizeLookupKey from "@utilities/entity/normalizeLookupKey";
import resolveAndCreateEntities from "@utilities/entity/resolveAndCreateEntities";

export type JobImportItem = {
  job_code: string;
  project: string;
  note?: string | null;
  request_date?: string | Date | null;
  recruiter_id?: number | null;
  partners?: number[];
  departments?: { department_id: number; candidate_required: number; user_id?: number | null; partner_name?: string | null }[];
  segments?: number[];
  sites?: number[];
  titles?: number[];
  managers?: number[];
  employee_levels?: number[];
  partners_name?: string[];
  departments_name?: { name: string; candidate_required: number; user_id?: number | null; partner_name?: string | null }[];
  segments_name?: string[];
  sites_name?: string[];
  titles_name?: string[];
  managers_name?: string[];
  employee_levels_name?: string[];
  recruiter_name?: string | null;
};

export type BatchImportResult = {
  success: boolean;
  importedCount: number;
  errors: Array<{ job_code: string; message: string }>;
};

async function batchImport(
  jobs: JobImportItem[],
  pool: PoolClient
): Promise<BatchImportResult> {
  // 1. Gather all new names across all jobs in the batch
  const partnerNames = new Set<string>();
  const managerNames = new Set<string>();
  const recruiterNames = new Set<string>();
  const deptNames = new Set<string>();
  const segmentNames = new Set<string>();
  const siteNames = new Set<string>();
  const levelNames = new Set<string>(); // titles_name + employee_levels_name map to level table

  for (const job of jobs) {
    (job.partners_name || []).forEach(n => { if (n?.trim()) partnerNames.add(n.trim()); });
    (job.managers_name || []).forEach(n => { if (n?.trim()) managerNames.add(n.trim()); });
    if (job.recruiter_name?.trim()) recruiterNames.add(job.recruiter_name.trim());
    (job.departments_name || []).forEach(item => { if (item.name?.trim()) deptNames.add(item.name.trim()); });
    (job.segments_name || []).forEach(n => { if (n?.trim()) segmentNames.add(n.trim()); });
    (job.sites_name || []).forEach(n => { if (n?.trim()) siteNames.add(n.trim()); });
    (job.titles_name || []).forEach(n => { if (n?.trim()) levelNames.add(n.trim()); });
    (job.employee_levels_name || []).forEach(n => { if (n?.trim()) levelNames.add(n.trim()); });
  }

  // Resolve Partners (User table)
  const partnerMap = await resolveAndCreateEntities({
    names: partnerNames,
    tableName: "user",
    idColumn: "user_id",
    nameColumn: "user_name",
    pool,
    create: async (name) => {
      const u = await User.create({ username: name }, pool);
      return u.user_id;
    }
  });

  // Resolve Managers (User table)
  const managerMap = await resolveAndCreateEntities({
    names: managerNames,
    tableName: "user",
    idColumn: "user_id",
    nameColumn: "user_name",
    pool,
    create: async (name) => {
      const lower = normalizeLookupKey(name);
      if (partnerMap.has(lower)) {
        return partnerMap.get(lower)!;
      }
      const u = await User.create({ username: name }, pool);
      return u.user_id;
    }
  });

  // Sync back any new managers to partnerMap and vice-versa just in case
  for (const [k, v] of managerMap.entries()) {
    partnerMap.set(k, v);
  }

  const recruiterMap = await resolveAndCreateEntities({
    names: recruiterNames,
    tableName: "user",
    idColumn: "user_id",
    nameColumn: "user_name",
    pool,
    create: async (name) => {
      const lower = normalizeLookupKey(name);
      if (partnerMap.has(lower)) return partnerMap.get(lower)!;
      if (managerMap.has(lower)) return managerMap.get(lower)!;
      const u = await User.create({ username: name }, pool);
      return u.user_id;
    }
  });
  for (const [k, v] of partnerMap.entries()) {
    managerMap.set(k, v);
  }

  // Resolve Departments (Department table)
  const deptMap = await resolveAndCreateEntities({
    names: deptNames,
    tableName: "department",
    idColumn: "department_id",
    nameColumn: "department_name",
    pool,
    create: async (name) => {
      const d = await Department.create({
        department_code: name.toUpperCase(),
        department_name: name,
      }, pool);
      return d.department_id;
    }
  });

  // Resolve Segments (Segment table)
  const segmentMap = await resolveAndCreateEntities({
    names: segmentNames,
    tableName: "segment",
    idColumn: "segment_id",
    nameColumn: "segment_name",
    pool,
    create: async (name) => {
      const s = await Segment.create({ segment_name: name }, pool);
      return s.segment_id;
    }
  });

  // Resolve Sites (Site table)
  const siteMap = await resolveAndCreateEntities({
    names: siteNames,
    tableName: "site",
    idColumn: "site_id",
    nameColumn: "site_name",
    pool,
    create: async (name) => {
      const s = await Site.create({ site_name: name }, pool);
      return s.site_id;
    }
  });

  // Resolve Levels/Titles (Level table)
  const levelMap = await resolveAndCreateEntities({
    names: levelNames,
    tableName: "level",
    idColumn: "level_id",
    nameColumn: "level_name",
    pool,
    create: async (name) => {
      const l = await Level.create({ level_name: name }, pool);
      return l.level_id;
    }
  });

  // 2. Process and insert each Job
  let importedCount = 0;
  const errors: Array<{ job_code: string; message: string }> = [];

  for (const job of jobs) {
    try {
      // Resolve IDs for this job
      const mergedPartners = [
        ...(job.partners || []),
        ...(job.partners_name || []).map(n => partnerMap.get(normalizeLookupKey(n))).filter(Boolean) as number[]
      ];
      const mergedManagers = [
        ...(job.managers || []),
        ...(job.managers_name || []).map(n => managerMap.get(normalizeLookupKey(n))).filter(Boolean) as number[]
      ];
      const mergedDepartments: { department_id: number; candidate_required: number }[] = [];
      if (job.departments) {
        for (const dept of job.departments) {
          const departmentId = dept.department_id;
          const hrbpId = dept.user_id || (dept.partner_name ? partnerMap.get(normalizeLookupKey(dept.partner_name)) : null) || null;
          await pool.query(
            `UPDATE department SET user_id = $1 WHERE department_id = $2`,
            [hrbpId, departmentId]
          );
          mergedDepartments.push({
            department_id: departmentId,
            candidate_required: dept.candidate_required
          });
        }
      }
      if (job.departments_name) {
        for (const item of job.departments_name) {
          const did = deptMap.get(normalizeLookupKey(item.name));
          if (did) {
            const hrbpId = item.user_id || (item.partner_name ? partnerMap.get(normalizeLookupKey(item.partner_name)) : null) || null;
            await pool.query(
              `UPDATE department SET user_id = $1 WHERE department_id = $2`,
              [hrbpId, did]
            );
            mergedDepartments.push({
              department_id: did,
              candidate_required: item.candidate_required
            });
          }
        }
      }
      
      const mergedSegments = [
        ...(job.segments || []),
        ...(job.segments_name || []).map(n => segmentMap.get(normalizeLookupKey(n))).filter(Boolean) as number[]
      ];
      const mergedSites = [
        ...(job.sites || []),
        ...(job.sites_name || []).map(n => siteMap.get(normalizeLookupKey(n))).filter(Boolean) as number[]
      ];
      const mergedTitles = [
        ...(job.titles || []),
        ...(job.titles_name || []).map(n => levelMap.get(normalizeLookupKey(n))).filter(Boolean) as number[]
      ];
      const mergedEmployeeLevels = [
        ...(job.employee_levels || []),
        ...(job.employee_levels_name || []).map(n => levelMap.get(normalizeLookupKey(n))).filter(Boolean) as number[]
      ];
      const resolvedRecruiterId = job.recruiter_id || (job.recruiter_name?.trim() ? recruiterMap.get(normalizeLookupKey(job.recruiter_name)) : null) || null;

      // Use a nested savepoint to allow partial success
      await pool.query("SAVEPOINT import_job_savepoint");

      await create(
        {
          job_code: job.job_code,
          project: job.project,
          note: job.note || null,
          request_date: job.request_date || null,
          recruiter_id: resolvedRecruiterId,
          file: null,
          departments: mergedDepartments,
          segments: Array.from(new Set(mergedSegments)),
          sites: Array.from(new Set(mergedSites)),
          titles: Array.from(new Set(mergedTitles)),
          managers: Array.from(new Set(mergedManagers)),
          employee_levels: Array.from(new Set(mergedEmployeeLevels)),
        },
        pool
      );

      await pool.query("RELEASE SAVEPOINT import_job_savepoint");
      importedCount++;
    } catch (err: any) {
      await pool.query("ROLLBACK TO SAVEPOINT import_job_savepoint");
      errors.push({
        job_code: job.job_code,
        message: err.message || "Lỗi không xác định khi tạo Job",
      });
    }
  }

  return {
    success: errors.length === 0,
    importedCount,
    errors,
  };
}

export default batchImport;
