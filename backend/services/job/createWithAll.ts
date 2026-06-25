import { PoolClient } from "pg";
import type { jobOutputModel } from "@model/job/jobModel";
import Department from "@services/department/_Department";
import User from "@services/user/_User";
import Segment from "@services/segment/_Segment";
import Site from "@services/site/_Site";
import Level from "@services/level/_Level";
import create from "@services/job/create";

type CreateJobWithAllData = {
  // Dữ liệu Job gốc
  job_code?: string | null;
  project?: string | null;
  note?: string | null;
  request_date?: string | Date | null;
  recruiter_id?: number | null;
  file?: {
    originalname: string;
    buffer: Buffer;
  } | null;

  // ID gốc (các record đã có sẵn)
  partners?: number[];
  departments?: { department_id: number; candidate_required: number; user_id?: number | null; partner_name?: string | null }[];
  segments?: number[];
  sites?: number[];
  titles?: number[];
  managers?: number[];
  employee_levels?: number[];

  // _name: tự động tạo record mới rồi lấy ID
  partners_name?: string[];
  departments_name?: { name: string; candidate_required: number; user_id?: number | null; partner_name?: string | null }[];
  segments_name?: string[];
  sites_name?: string[];
  /**
   * titles_name và employee_levels_name được gộp lại thành một danh sách duy nhất.
   * Các tên được chuẩn hóa về lowercase và loại bỏ trùng lặp trước khi tạo mới.
   * Level ID tạo ra sẽ được dùng chung cho cả titles và employee_levels.
   */
  titles_name?: string[];
  managers_name?: string[];
  employee_levels_name?: string[];
  recruiter_name?: string | null;
};

async function createWithAll(
  data: CreateJobWithAllData,
  pool: PoolClient
): Promise<jobOutputModel> {
  const {
    job_code = null,
    project = null,
    note = null,
    recruiter_id = null,
    file = null,
    partners = [],
    departments = [],
    segments = [],
    sites = [],
    titles = [],
    managers = [],
    employee_levels = [],
    partners_name = [],
    departments_name = [],
    segments_name = [],
    sites_name = [],
    titles_name = [],
    managers_name = [],
    employee_levels_name = [],
    recruiter_name = null,
  } = data;

  let resolvedRecruiterId = recruiter_id;
  if (!resolvedRecruiterId && recruiter_name?.trim()) {
    const user = await User.create({ username: recruiter_name.trim() }, pool);
    resolvedRecruiterId = user.user_id;
  }

  // 1. Tạo user mới cho partners_name và lấy user_id
  const newPartnerIds: number[] = [];
  for (const name of partners_name) {
    const user = await User.create({ username: name }, pool);
    newPartnerIds.push(user.user_id);
  }
  const allPartnerUserIds = [...partners, ...newPartnerIds];

  // 2. Tạo user mới cho managers_name và lấy user_id
  const newManagerIds: number[] = [];
  for (const name of managers_name) {
    const user = await User.create({ username: name }, pool);
    newManagerIds.push(user.user_id);
  }

  // 3. Tạo department mới cho departments_name (code = name.toUpperCase())
  const resolvedDepartments = [];
  let partnerIdx = 0;

  for (const dept of departments) {
    let uId = dept.user_id;
    if (dept.partner_name) {
      const user = await User.create({ username: dept.partner_name }, pool);
      uId = user.user_id;
    }

    if (!uId && allPartnerUserIds.length > 0) {
      uId = allPartnerUserIds[partnerIdx % allPartnerUserIds.length];
      partnerIdx++;
    }

    // Cập nhật user_id cho department
    if (uId) {
      await pool.query(
        `UPDATE department SET user_id = $1 WHERE department_id = $2`,
        [uId, dept.department_id]
      );
    }
    resolvedDepartments.push({
      department_id: dept.department_id,
      candidate_required: dept.candidate_required,
    });
  }

  const newDepartments: { department_id: number; candidate_required: number }[] = [];
  for (const item of departments_name) {
    let resolvedUserId = item.user_id;
    if (item.partner_name) {
      const user = await User.create({ username: item.partner_name }, pool);
      resolvedUserId = user.user_id;
    }

    if (!resolvedUserId && allPartnerUserIds.length > 0) {
      resolvedUserId = allPartnerUserIds[partnerIdx % allPartnerUserIds.length];
      partnerIdx++;
    }

    const dept = await Department.create({
      department_code: item.name.toUpperCase(),
      department_name: item.name,
      user_id: resolvedUserId,
    }, pool);

    newDepartments.push({
      department_id: dept.department_id,
      candidate_required: item.candidate_required,
    });
  }

  // 4. Tạo segment mới cho segments_name
  const newSegmentIds: number[] = [];
  for (const name of segments_name) {
    const seg = await Segment.create({ segment_name: name }, pool);
    newSegmentIds.push(seg.segment_id);
  }

  // 5. Tạo site mới cho sites_name
  const newSiteIds: number[] = [];
  for (const name of sites_name) {
    const site = await Site.create({ site_name: name }, pool);
    newSiteIds.push(site.site_id);
  }

  // 6. Gộp titles_name và employee_levels_name thành một danh sách duy nhất:
  //    chuẩn hóa về lowercase và loại bỏ trùng lặp trước khi tạo Level record.
  //    Level ID tạo ra sẽ được dùng cho cả titles lẫn employee_levels.
  const combinedLevelNames = [
    ...new Set([
      ...titles_name.map((n) => n.toLowerCase()),
      ...employee_levels_name.map((n) => n.toLowerCase()),
    ]),
  ];

  const newLevelIds: number[] = [];
  for (const name of combinedLevelNames) {
    const level = await Level.create({ level_name: name }, pool);
    newLevelIds.push(level.level_id);
  }

  // 7. Gộp ID mới vào danh sách ID gốc
  const mergedPartners = [...partners, ...newPartnerIds];
  const mergedManagers = [...managers, ...newManagerIds];
  const mergedDepartments = [...resolvedDepartments, ...newDepartments];
  const mergedSegments = [...segments, ...newSegmentIds];
  const mergedSites = [...sites, ...newSiteIds];
  const mergedTitles = [...titles, ...newLevelIds];
  const mergedEmployeeLevels = [...employee_levels, ...newLevelIds];

  // 8. Gọi service create gốc với dữ liệu đã gộp
  return create(
    {
      job_code,
      project,
      note,
      file,
      request_date: data.request_date,
      recruiter_id: resolvedRecruiterId,
      departments: mergedDepartments,
      segments: mergedSegments,
      sites: mergedSites,
      titles: mergedTitles,
      managers: mergedManagers,
      employee_levels: mergedEmployeeLevels,
    },
    pool
  );
}

export default createWithAll;
