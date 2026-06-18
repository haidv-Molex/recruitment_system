import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import User from "@services/user/_User";
import buildEntityMap from "@utilities/entity/buildEntityMap";
import { resolveEntity } from "@utilities/entity/resolveEntity";

// ─── Helper: resolve a text value against a Map, returning a placeholder if not found ───

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

// ─── Parsed output shape ───────────────────────────────────────────────────

export interface ParsedCandidateRow {
  // Raw scalar fields
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  agency: string | null;
  status: string | null;
  note: string | null;
  current_salary: string | null;
  expected_salary: string | null;
  targeted_company: string | null; // "Yes" | "No"
  targeted_company_name: string | null;

  // Date fields
  input_date: Date | null;
  offer_date: Date | null;
  onboard_date: Date | null;
  feedback_date: Date | null;

  // Raw text fields that will be resolved at insert time
  department_code: string | null;  // "Department" column
  job_code: string | null;          // "Job code" column
  job_title: string | null;         // "Job title"
  ee_level: string | null;          // "EE Level"
  project: string | null;           // "Project"
  dl_idl: string | null;            // "DL/IDL"
  source: string | null;            // "Source"

  // Employee code & reference fields (from Vietnamese columns)
  employee_code: string | null;     // "Mã nhân viên"
  reference_name: string | null;    // "Người giới thiệu"
  reference_department: string | null; // "Bộ phận"

  // Resolved user objects (or placeholder stubs)
  recruiter: userOutputModel | null;
  hiring_manager: userOutputModel | null;
}

// ─── Main service function ─────────────────────────────────────────────────

export default async function parseCandidateSheet(
  rows: any[],
  pool: PoolClient
): Promise<ParsedCandidateRow[]> {
  // Load all public users through the user service so parser code does not duplicate user SQL/mapping.
  const usersResult = await User.getAll({ unlimited: true }, pool);

  const userMap = buildEntityMap<userOutputModel>(usersResult.items, (user) => user.user_name);

  const result: ParsedCandidateRow[] = [];

  for (const row of rows) {
    const candidate_name = row["Name"] !== undefined && row["Name"] !== null
      ? String(row["Name"]).trim()
      : "";

    const candidate_email = row["Email"] !== undefined && row["Email"] !== null
      ? String(row["Email"]).trim() || null
      : null;

    const candidate_phone = row["Phone number"] !== undefined && row["Phone number"] !== null
      ? String(row["Phone number"]).trim() || null
      : null;

    const agency = row["Headhunt Agency"] !== undefined && row["Headhunt Agency"] !== null
      ? String(row["Headhunt Agency"]).trim() || null
      : null;

    const status = row["Status"] !== undefined && row["Status"] !== null
      ? String(row["Status"]).trim() || null
      : null;

    const note = row["Note"] !== undefined && row["Note"] !== null
      ? String(row["Note"]).trim() || null
      : null;

    const current_salary = row["Current salary \n(Gross M VND)"] !== undefined && row["Current salary \n(Gross M VND)"] !== null
      ? String(row["Current salary \n(Gross M VND)"]).trim() || null
      : null;

    const expected_salary = row["Expected salary\n(Gross M VND)"] !== undefined && row["Expected salary\n(Gross M VND)"] !== null
      ? String(row["Expected salary\n(Gross M VND)"]).trim() || null
      : null;

    const targeted_company = row["Targeted company"] !== undefined && row["Targeted company"] !== null
      ? String(row["Targeted company"]).trim() || null
      : null;

    const targeted_company_name = row["Targeted company name"] !== undefined && row["Targeted company name"] !== null
      ? String(row["Targeted company name"]).trim() || null
      : null;

    // Date fields — ExcelJS already parses dates as Date objects
    const input_date = row["Input date (dd/mm/yyyy)"]
      ? new Date(row["Input date (dd/mm/yyyy)"])
      : null;

    const offer_date = row["Offer Sent date\n(DD/MM/YYYY)"]
      ? new Date(row["Offer Sent date\n(DD/MM/YYYY)"])
      : null;

    const onboard_date = row["Onboarding Date (DD/MM/YYYY)"]
      ? new Date(row["Onboarding Date (DD/MM/YYYY)"])
      : null;

    const feedback_date = row["Candidate result feedback date"]
      ? new Date(row["Candidate result feedback date"])
      : null;

    // Raw classification fields
    const department_code = row["Department"] !== undefined && row["Department"] !== null
      ? String(row["Department"]).trim() || null
      : null;

    const job_code = row["Job code"] !== undefined && row["Job code"] !== null
      ? String(row["Job code"]).trim() || null
      : null;

    const job_title = row["Job title"] !== undefined && row["Job title"] !== null
      ? String(row["Job title"]).trim() || null
      : null;

    const ee_level = row["EE Level"] !== undefined && row["EE Level"] !== null
      ? String(row["EE Level"]).trim() || null
      : null;

    const project = row["Project"] !== undefined && row["Project"] !== null
      ? String(row["Project"]).trim() || null
      : null;

    const dl_idl = row["DL/IDL"] !== undefined && row["DL/IDL"] !== null
      ? String(row["DL/IDL"]).trim() || null
      : null;

    const source = row["Source"] !== undefined && row["Source"] !== null
      ? String(row["Source"]).trim() || null
      : null;

    // Vietnamese columns
    const employee_code = row["Mã nhân viên"] !== undefined && row["Mã nhân viên"] !== null
      ? String(row["Mã nhân viên"]).trim() || null
      : null;

    const reference_name = row["Người giới thiệu"] !== undefined && row["Người giới thiệu"] !== null
      ? String(row["Người giới thiệu"]).trim() || null
      : null;

    const reference_department = row["Bộ phận"] !== undefined && row["Bộ phận"] !== null
      ? String(row["Bộ phận"]).trim() || null
      : null;

    // Resolve user relations
    const recruiter = resolveEntity(row["Recruiter"], userMap, createUserPlaceholder);
    const hiring_manager = resolveEntity(row["Hiring manager"], userMap, createUserPlaceholder);

    result.push({
      candidate_name,
      candidate_email,
      candidate_phone,
      agency,
      status,
      note,
      current_salary,
      expected_salary,
      targeted_company,
      targeted_company_name,
      input_date,
      offer_date,
      onboard_date,
      feedback_date,
      department_code,
      job_code,
      job_title,
      ee_level,
      project,
      dl_idl,
      source,
      employee_code,
      reference_name,
      reference_department,
      recruiter,
      hiring_manager,
    });
  }

  return result;
}
