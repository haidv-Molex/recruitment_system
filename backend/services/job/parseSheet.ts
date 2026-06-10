import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { departmentModel } from "@model/department/departmentModel";
import type { segmentModel } from "@model/segment/segmentModel";
import type { siteModel } from "@model/site/siteModel";
import type { levelModel } from "@model/level/levelModel";

function resolveRelation<T>(val: any, map: Map<string, T>): T[] {
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
    }
  }
  return resolved;
}

export default async function parseSheet(rows: any[], pool: PoolClient): Promise<any[]> {
  // Query all users
  const usersQuery = `
    SELECT user_id, user_name, user_description, user_role, create_at, update_at, department_id
    FROM "user"
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

  const usersRes = await pool.query(usersQuery);
  const deptsRes = await pool.query(departmentsQuery);
  const segmentsRes = await pool.query(segmentsQuery);
  const sitesRes = await pool.query(sitesQuery);
  const levelsRes = await pool.query(levelsQuery);

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
        department_id: row.department_id
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
    const departments = resolveRelation(row["Dept."], deptMap);
    const segments = resolveRelation(row["Project Segment"], segmentMap);
    const sites = resolveRelation(row["Sites"], siteMap);
    const titles = resolveRelation(row["Job title"], levelMap);
    const employee_levels = resolveRelation(row["EE Level"], levelMap);
    const managers = resolveRelation(row["Hiring manager"], userMap);
    const partners = resolveRelation(row["HRBP"], userMap);

    formattedJobs.push({
      job_code,
      project,
      candidate_required,
      note,
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
