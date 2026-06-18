import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import type { departmentModel } from "@model/department/departmentModel";
import type { segmentModel } from "@model/segment/segmentModel";
import type { siteModel } from "@model/site/siteModel";
import type { levelModel } from "@model/level/levelModel";
import User from "@services/user/_User";
import buildEntityMap from "@utilities/entity/buildEntityMap";
import { resolveEntities } from "@utilities/entity/resolveEntity";

function createUserPlaceholder(name: string): userOutputModel {
  return {
    user_id: null,
    user_name: name,
    user_description: null,
    user_role: null,
    create_at: null,
    update_at: null
  } as any;
}

export default async function parseJobSheet(rows: any[], pool: PoolClient): Promise<any[]> {
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

  const [usersResult, deptsRes, segmentsRes, sitesRes, levelsRes] = await Promise.all([
    User.getAll({ unlimited: true }, pool),
    pool.query(departmentsQuery),
    pool.query(segmentsQuery),
    pool.query(sitesQuery),
    pool.query(levelsQuery)
  ]);

  const userMap = buildEntityMap<userOutputModel>(usersResult.items, (user) => user.user_name);
  const deptMap = buildEntityMap<departmentModel>(deptsRes.rows, (row) => row.department_name, { duplicateStrategy: "last" });
  const segmentMap = buildEntityMap<segmentModel>(segmentsRes.rows, (row) => row.segment_name, { duplicateStrategy: "last" });
  const siteMap = buildEntityMap<siteModel>(sitesRes.rows, (row) => row.site_name, { duplicateStrategy: "last" });
  const levelMap = buildEntityMap<levelModel>(levelsRes.rows, (row) => row.level_name, { duplicateStrategy: "last" });

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

    const partners = resolveEntities(row["HRBP"], userMap, createUserPlaceholder);

    const partnerName = row["HRBP"] ? String(row["HRBP"]).trim() : null;
    const partnerUser = partners[0];

    const resolvedDepts = resolveEntities(row["Dept."], deptMap, (name) => ({
      department_id: null,
      department_code: null,
      department_name: name,
      department_description: null,
      create_at: null,
      update_at: null,
      candidate_required: 0
    } as any));

    const deptsCount = resolvedDepts.length;
    const baseRequired = deptsCount > 0 ? Math.floor(candidate_required / deptsCount) : 0;
    const remainderRequired = deptsCount > 0 ? candidate_required % deptsCount : 0;

    const departments = resolvedDepts.map((d, index) => {
      const p = partners[index] || partners[partners.length - 1] || null;
      return {
        ...d,
        candidate_required: baseRequired + (index < remainderRequired ? 1 : 0),
        user_id: p ? p.user_id : null,
        partner_name: p && p.user_id ? null : (p ? p.user_name : null)
      };
    });

    const segments = resolveEntities(row["Project Segment"], segmentMap, (name) => ({
      segment_id: null,
      segment_code: null,
      segment_name: name,
      segment_description: null,
      create_at: null,
      update_at: null
    } as any));

    const sites = resolveEntities(row["Sites"], siteMap, (name) => ({
      site_id: null,
      site_code: null,
      site_name: name,
      site_description: null,
      create_at: null,
      update_at: null
    } as any));

    const titles = resolveEntities(row["Job title"], levelMap, (name) => ({
      level_id: null,
      level_code: null,
      level_name: name,
      level_description: null,
      create_at: null,
      update_at: null
    } as any));

    const employee_levels = resolveEntities(row["EE Level"], levelMap, (name) => ({
      level_id: null,
      level_code: null,
      level_name: name,
      level_description: null,
      create_at: null,
      update_at: null
    } as any));

    const managers = resolveEntities(row["Hiring manager"], userMap, createUserPlaceholder);

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
