import { PoolClient } from "pg";
import type { userOutputModel } from "@model/user/userModel";
import User from "@services/user/_User";
import buildEntityMap from "@utilities/entity/buildEntityMap";
import { resolveEntity } from "@utilities/entity/resolveEntity";
import getRowDate from "@utilities/file/getRowDate";
import getRowString from "@utilities/file/getRowString";

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
    const candidate_name = getRowString(row, "Name", { defaultValue: "" });
    const candidate_email = getRowString(row, "Email");
    const candidate_phone = getRowString(row, "Phone number");
    const agency = getRowString(row, "Headhunt Agency");
    const status = getRowString(row, "Status");
    const note = getRowString(row, "Note");
    const current_salary = getRowString(row, "Current salary \n(Gross M VND)");
    const expected_salary = getRowString(row, "Expected salary\n(Gross M VND)");
    const targeted_company = getRowString(row, "Targeted company");
    const targeted_company_name = getRowString(row, "Targeted company name");

    const input_date = getRowDate(row, "Input date (dd/mm/yyyy)");
    const offer_date = getRowDate(row, "Offer Sent date\n(DD/MM/YYYY)");
    const onboard_date = getRowDate(row, "Onboarding Date (DD/MM/YYYY)");
    const feedback_date = getRowDate(row, "Candidate result feedback date");

    const department_code = getRowString(row, "Department");
    const job_code = getRowString(row, "Job code");
    const job_title = getRowString(row, "Job title");
    const ee_level = getRowString(row, "EE Level");
    const project = getRowString(row, "Project");
    const dl_idl = getRowString(row, "DL/IDL");
    const source = getRowString(row, "Source");

    const employee_code = getRowString(row, "Mã nhân viên");
    const reference_name = getRowString(row, "Người giới thiệu");
    const reference_department = getRowString(row, "Bộ phận");

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
