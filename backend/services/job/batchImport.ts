import { PoolClient } from "pg";
import type { jobOutputModel } from "@model/job/jobModel";
import Department from "@services/department/_Department";
import User from "@services/user/_User";
import Segment from "@services/segment/_Segment";
import Site from "@services/site/_Site";
import Level from "@services/level/_Level";
import create from "@services/job/create";
import { AppError } from "@middlewares/AppError";

export type JobImportItem = {
  job_code: string;
  project: string;
  note?: string | null;
  request_date?: string | Date | null;
  partners?: number[];
  departments?: { department_id: number; candidate_required: number }[];
  segments?: number[];
  sites?: number[];
  titles?: number[];
  managers?: number[];
  employee_levels?: number[];
  partners_name?: string[];
  departments_name?: { name: string; candidate_required: number }[];
  segments_name?: string[];
  sites_name?: string[];
  titles_name?: string[];
  managers_name?: string[];
  employee_levels_name?: string[];
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
  const deptNames = new Set<string>();
  const segmentNames = new Set<string>();
  const siteNames = new Set<string>();
  const levelNames = new Set<string>(); // titles_name + employee_levels_name map to level table

  for (const job of jobs) {
    (job.partners_name || []).forEach(n => { if (n?.trim()) partnerNames.add(n.trim()); });
    (job.managers_name || []).forEach(n => { if (n?.trim()) managerNames.add(n.trim()); });
    (job.departments_name || []).forEach(item => { if (item.name?.trim()) deptNames.add(item.name.trim()); });
    (job.segments_name || []).forEach(n => { if (n?.trim()) segmentNames.add(n.trim()); });
    (job.sites_name || []).forEach(n => { if (n?.trim()) siteNames.add(n.trim()); });
    (job.titles_name || []).forEach(n => { if (n?.trim()) levelNames.add(n.trim()); });
    (job.employee_levels_name || []).forEach(n => { if (n?.trim()) levelNames.add(n.trim()); });
  }

  // Helper function to resolve case-insensitive duplicates and create them
  const resolveAndCreateEntities = async (
    namesSet: Set<string>,
    tableName: string,
    idCol: string,
    nameCol: string,
    createFn: (name: string) => Promise<number>
  ): Promise<Map<string, number>> => {
    const nameMap = new Map<string, number>();
    if (namesSet.size === 0) return nameMap;

    // Normalizing names to lowercase while preserving original casing in a lookup map
    const lowerToOriginal = new Map<string, string>();
    for (const name of namesSet) {
      const lower = name.toLowerCase();
      if (!lowerToOriginal.has(lower)) {
        lowerToOriginal.set(lower, name);
      }
    }

    const uniqueLowerNames = Array.from(lowerToOriginal.keys());

    // Find existing entities in database (case-insensitive)
    const query = `
      SELECT ${idCol} AS id, ${nameCol} AS name, LOWER(${nameCol}) AS lower_name
      FROM "${tableName}"
      WHERE LOWER(${nameCol}) = ANY($1)
    `;
    const res = await pool.query(query, [uniqueLowerNames]);
    
    // Map existing lower_name -> id
    for (const row of res.rows) {
      nameMap.set(row.lower_name, Number(row.id));
    }

    // Create missing entities (one-by-one)
    for (const lowerName of uniqueLowerNames) {
      if (!nameMap.has(lowerName)) {
        const originalName = lowerToOriginal.get(lowerName)!;
        const newId = await createFn(originalName);
        nameMap.set(lowerName, newId);
      }
    }

    return nameMap;
  };

  // Resolve Partners (User table)
  const partnerMap = await resolveAndCreateEntities(
    partnerNames,
    "user",
    "user_id",
    "user_name",
    async (name) => {
      const u = await User.create({ username: name }, pool);
      return u.user_id;
    }
  );

  // Resolve Managers (User table)
  const managerMap = await resolveAndCreateEntities(
    managerNames,
    "user",
    "user_id",
    "user_name",
    async (name) => {
      const lower = name.toLowerCase();
      if (partnerMap.has(lower)) {
        return partnerMap.get(lower)!;
      }
      const u = await User.create({ username: name }, pool);
      return u.user_id;
    }
  );

  // Sync back any new managers to partnerMap and vice-versa just in case
  for (const [k, v] of managerMap.entries()) {
    partnerMap.set(k, v);
  }
  for (const [k, v] of partnerMap.entries()) {
    managerMap.set(k, v);
  }

  // Resolve Departments (Department table)
  const deptMap = await resolveAndCreateEntities(
    deptNames,
    "department",
    "department_id",
    "department_name",
    async (name) => {
      const d = await Department.create({
        department_code: name.toUpperCase(),
        department_name: name,
      }, pool);
      return d.department_id;
    }
  );

  // Resolve Segments (Segment table)
  const segmentMap = await resolveAndCreateEntities(
    segmentNames,
    "segment",
    "segment_id",
    "segment_name",
    async (name) => {
      const s = await Segment.create({ segment_name: name }, pool);
      return s.segment_id;
    }
  );

  // Resolve Sites (Site table)
  const siteMap = await resolveAndCreateEntities(
    siteNames,
    "site",
    "site_id",
    "site_name",
    async (name) => {
      const s = await Site.create({ site_name: name }, pool);
      return s.site_id;
    }
  );

  // Resolve Levels/Titles (Level table)
  const levelMap = await resolveAndCreateEntities(
    levelNames,
    "level",
    "level_id",
    "level_name",
    async (name) => {
      const l = await Level.create({ level_name: name }, pool);
      return l.level_id;
    }
  );

  // 2. Process and insert each Job
  let importedCount = 0;
  const errors: Array<{ job_code: string; message: string }> = [];

  for (const job of jobs) {
    try {
      // Resolve IDs for this job
      const mergedPartners = [
        ...(job.partners || []),
        ...(job.partners_name || []).map(n => partnerMap.get(n.trim().toLowerCase())).filter(Boolean) as number[]
      ];
      const mergedManagers = [
        ...(job.managers || []),
        ...(job.managers_name || []).map(n => managerMap.get(n.trim().toLowerCase())).filter(Boolean) as number[]
      ];
      const mergedDepartments: { department_id: number; candidate_required: number }[] = [
        ...(job.departments || []),
      ];
      if (job.departments_name) {
        for (const item of job.departments_name) {
          const did = deptMap.get(item.name.trim().toLowerCase());
          if (did) {
            mergedDepartments.push({ department_id: did, candidate_required: item.candidate_required });
          }
        }
      }
      
      const mergedSegments = [
        ...(job.segments || []),
        ...(job.segments_name || []).map(n => segmentMap.get(n.trim().toLowerCase())).filter(Boolean) as number[]
      ];
      const mergedSites = [
        ...(job.sites || []),
        ...(job.sites_name || []).map(n => siteMap.get(n.trim().toLowerCase())).filter(Boolean) as number[]
      ];
      const mergedTitles = [
        ...(job.titles || []),
        ...(job.titles_name || []).map(n => levelMap.get(n.trim().toLowerCase())).filter(Boolean) as number[]
      ];
      const mergedEmployeeLevels = [
        ...(job.employee_levels || []),
        ...(job.employee_levels_name || []).map(n => levelMap.get(n.trim().toLowerCase())).filter(Boolean) as number[]
      ];

      // Use a nested savepoint to allow partial success
      await pool.query("SAVEPOINT import_job_savepoint");

      await create(
        {
          job_code: job.job_code,
          project: job.project,
          note: job.note || null,
          request_date: job.request_date || null,
          file: null,
          partners: Array.from(new Set(mergedPartners)),
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
