import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { departmentModel } from "@model/department/departmentModel";
import type { segmentModel } from "@model/segment/segmentModel";
import type { siteModel } from "@model/site/siteModel";
import type { levelModel } from "@model/level/levelModel";

function resolveRelationWithPlaceholder<T>(
  val: any,
  map: Map<string, T>,
  createPlaceholder: (name: string) => T
): T[] {
  if (val === null || val === undefined) return [];
  const strVal = String(val).trim();
  if (!strVal) return [];

  // Try matching the whole string first
  const fullMatch = map.get(strVal.toLowerCase());
  if (fullMatch) {
    return [fullMatch];
  }

  // If no full match, try splitting by comma, semicolon, or newline
  const parts = strVal.split(/[,;\n\r]/).map(v => v.trim()).filter(v => v.length > 0);
  const resolved: T[] = [];
  for (const part of parts) {
    const matched = map.get(part.toLowerCase());
    if (matched) {
      resolved.push(matched);
    } else {
      resolved.push(createPlaceholder(part));
    }
  }
  return resolved;
}

export default async function parseJobSheet(rows: any[], pool: PoolClient): Promise<any[]> {
  // Query all users
  const usersQuery = `
    SELECT u.user_id, u.user_name, u.user_description, u.user_role, u.create_at, u.update_at,
           d.department_id, d.department_code, d.department_name, d.department_description,
           d.create_at AS d_create_at, d.update_at AS d_update_at
    FROM "user" u
    LEFT JOIN department d ON u.department_id = d.department_id
  `;
  // Query all departments
  const departmentsQuery = `
    SELECT department_id, department_code, department_name, department_description, create_at, update_at
    FROM department
  `;
  // Query all segments
  const segmentsQuery = `
    SELECT segment_id, segment_code, segment_name, segment_description, create_at, update_at
    FROM segment
  `;
  // Query all sites
  const sitesQuery = `
    SELECT site_id, site_code, site_name, site_description, create_at, update_at
    FROM site
  `;
  // Query all levels
  const levelsQuery = `
    SELECT level_id, level_code, level_name, level_description, create_at, update_at
    FROM level
  `;

  const [usersRes, deptsRes, segmentsRes, sitesRes, levelsRes] = await Promise.all([
    pool.query(usersQuery),
    pool.query(departmentsQuery),
    pool.query(segmentsQuery),
    pool.query(sitesQuery),
    pool.query(levelsQuery)
  ]);

  // Build maps using lowercase trimmed names
  const userMap = new Map<string, userOutputModel>();
  for (const row of usersRes.rows) {
    if (row.user_name) {
      userMap.set(row.user_name.trim().toLowerCase(), {
        user_id: row.user_id,
        user_name: row.user_name,
        user_description: row.user_description,
        user_role: row.user_role,
        create_at: row.create_at,
        update_at: row.update_at,
        department: row.department_id != null ? {
          department_id: row.department_id,
          department_code: row.department_code,
          department_name: row.department_name,
          department_description: row.department_description,
          create_at: row.d_create_at,
          update_at: row.d_update_at
        } : null
      } satisfies userOutputModel);
    }
  }

  const deptMap = new Map<string, departmentModel>();
  for (const row of deptsRes.rows) {
    if (row.department_name) {
      deptMap.set(row.department_name.trim().toLowerCase(), row);
    }
  }

  const segmentMap = new Map<string, segmentModel>();
  for (const row of segmentsRes.rows) {
    if (row.segment_name) {
      segmentMap.set(row.segment_name.trim().toLowerCase(), row);
    }
  }

  const siteMap = new Map<string, siteModel>();
  for (const row of sitesRes.rows) {
    if (row.site_name) {
      siteMap.set(row.site_name.trim().toLowerCase(), row);
    }
  }

  const levelMap = new Map<string, levelModel>();
  for (const row of levelsRes.rows) {
    if (row.level_name) {
      levelMap.set(row.level_name.trim().toLowerCase(), row);
    }
  }

  const formattedJobs: any[] = [];

  for (const row of rows) {
    // Basic mapping
    const job_code = row["Job Code"] !== undefined && row["Job Code"] !== null ? String(row["Job Code"]).trim() : "";
    const project = row["Project"] !== undefined && row["Project"] !== null ? String(row["Project"]).trim() : "";

    // Parse candidate_required
    let candidate_required = 0;
    if (row["HC Requested"] !== undefined && row["HC Requested"] !== null) {
      const parsed = parseInt(row["HC Requested"], 10);
      if (!isNaN(parsed)) {
        candidate_required = parsed;
      }
    }

    const note = row["Note"] !== undefined && row["Note"] !== null ? String(row["Note"]).trim() : null;

    // Resolve relation objects by name
    const departments = resolveRelationWithPlaceholder(row["Dept."], deptMap, (name) => ({
      department_id: null,
      department_code: null,
      department_name: name,
      department_description: null,
      create_at: null,
      update_at: null,
      candidate_required: candidate_required
    } as any)).map(d => ({ ...d, candidate_required }));

    const segments = resolveRelationWithPlaceholder(row["Project Segment"], segmentMap, (name) => ({
      segment_id: null,
      segment_code: null,
      segment_name: name,
      segment_description: null,
      create_at: null,
      update_at: null
    } as any));

    const sites = resolveRelationWithPlaceholder(row["Sites"], siteMap, (name) => ({
      site_id: null,
      site_code: null,
      site_name: name,
      site_description: null,
      create_at: null,
      update_at: null
    } as any));

    const titles = resolveRelationWithPlaceholder(row["Job title"], levelMap, (name) => ({
      level_id: null,
      level_code: null,
      level_name: name,
      level_description: null,
      create_at: null,
      update_at: null
    } as any));

    const employee_levels = resolveRelationWithPlaceholder(row["EE Level"], levelMap, (name) => ({
      level_id: null,
      level_code: null,
      level_name: name,
      level_description: null,
      create_at: null,
      update_at: null
    } as any));

    const managers = resolveRelationWithPlaceholder(row["Hiring manager"], userMap, (name) => ({
      user_id: null,
      user_name: name,
      user_description: null,
      user_role: null,
      create_at: null,
      update_at: null,
      department: null
    } as any));

    const partners = resolveRelationWithPlaceholder(row["HRBP"], userMap, (name) => ({
      user_id: null,
      user_name: name,
      user_description: null,
      user_role: null,
      create_at: null,
      update_at: null,
      department: null
    } as any));

    let request_date: Date | null = null;
    if (row["MyHR request date"]) {
      const parsedDate = new Date(row["MyHR request date"]);
      if (!isNaN(parsedDate.getTime())) {
        request_date = parsedDate;
      }
    }

    formattedJobs.push({
      job_code,
      project,
      note,
      request_date,
      file: null,
      partners,
      departments,
      segments,
      sites,
      titles,
      managers,
      employee_levels
    });
  }

  return formattedJobs;
}
