import { PoolClient } from "pg";
import ExcelJS from "exceljs";
import path from "path";
import { createDataValidationSheet } from "@utilities/file/createDataValidationSheet";
import { getStatuses } from "@services/candidate/getStatuses";
import { getAgencies } from "@services/candidate/getAgencies";

const DEFAULT_DEPTS = [
  'CA', 'OTC', 'BOD', 'FM/EHS', 'GA', 'HR', 'LOG', 'ME', 'PC', 'PUR', 'QC', 'SC', 'AS', 'MD', 'PLT', 'STP'
];

const DEFAULT_PICS = ['Tracy', 'Annie', 'Hein', 'Kim', 'Jun'];

const DEFAULT_FUNCTIONS = ['Operation', 'Supporting', 'Engineering', 'Quality'];

const DEFAULT_SOURCES = [
  'Linkedin Job Post', 'Linkedin Search', 'Vietnamworks Job Post', 'Vietnamworks Search',
  'TopCV Job Post', 'TopCV Search', 'Headhunt', 'Internal referral', 'Internal transfer',
  'Facebook', 'Network', 'Others'
];

const DEFAULT_LEVELS = [
  'Manager', 'Supervisor', 'Engineer', 'Professional', 'Technician',
  'Technical Operator', 'Operator', 'Leader', 'Intern'
];

const DEFAULT_COST_CATEGORIES = [
  'Job Posting', 'FB Advertising', 'Internal Referral', 'Job Fair', 'Branding Activities', 'Agency Fees'
];

const DEFAULT_RECRUITMENT_STATUSES = ['Onboarded', 'Offered', 'In progress', 'Overdue'];

const DEFAULT_DATA_SOURCES = ['D', 'S', 'SK', 'MXV'];

/**
 * Service function to load the Excel template, fetch validation data from the database,
 * recreate the "Data Validation" sheet, and return the populated workbook.
 */
async function createValidationSheet(pool: PoolClient): Promise<ExcelJS.Workbook> {
  // 1. Load the template Excel file
  const templatePath = path.join(process.cwd(), "utilities/file/excelTemplate.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  // 2. Fetch data from DB (with fallbacks to defaults)
  // Dept
  const deptRes = await pool.query<{ department_code: string }>(
    `SELECT DISTINCT department_code 
     FROM department 
     WHERE department_code IS NOT NULL AND department_code <> '' 
     ORDER BY department_code`
  );
  const depts = deptRes.rows.length > 0 
    ? deptRes.rows.map((r) => r.department_code) 
    : DEFAULT_DEPTS;

  // PIC
  const picRes = await pool.query<{ user_name: string }>(
    `SELECT DISTINCT u.user_name 
     FROM "user" u
     JOIN candidate c ON u.user_id = c.recruiter
     WHERE u.user_name IS NOT NULL AND u.user_name <> '' 
     ORDER BY u.user_name`
  );
  const pics = picRes.rows.length > 0 
    ? picRes.rows.map((r) => r.user_name) 
    : DEFAULT_PICS;

  // Final Status
  const statuses = await getStatuses(pool);

  // Function (No DB table - use defaults)
  const functions = DEFAULT_FUNCTIONS;

  // Source (Platform table)
  const sourceRes = await pool.query<{ platform_name: string }>(
    `SELECT DISTINCT platform_name 
     FROM platform 
     WHERE platform_name IS NOT NULL AND platform_name <> '' 
     ORDER BY platform_name`
  );
  const sources = sourceRes.rows.length > 0 
    ? sourceRes.rows.map((r) => r.platform_name) 
    : DEFAULT_SOURCES;

  // EE Level (Level table)
  const levelRes = await pool.query<{ level_name: string }>(
    `SELECT DISTINCT level_name 
     FROM level 
     WHERE level_name IS NOT NULL AND level_name <> '' 
     ORDER BY level_name`
  );
  const eeLevels = levelRes.rows.length > 0 
    ? levelRes.rows.map((r) => r.level_name) 
    : DEFAULT_LEVELS;

  // Recruitment Cost Categories (No DB table - use defaults)
  const costCategories = DEFAULT_COST_CATEGORIES;

  // Recruitment Status (No DB table - use defaults)
  const recruitmentStatuses = DEFAULT_RECRUITMENT_STATUSES;

  // Data Source (Site table)
  const siteRes = await pool.query<{ site_code: string }>(
    `SELECT DISTINCT site_code 
     FROM site 
     WHERE site_code IS NOT NULL AND site_code <> '' 
     ORDER BY site_code`
  );
  const dataSources = siteRes.rows.length > 0 
    ? siteRes.rows.map((r) => r.site_code) 
    : DEFAULT_DATA_SOURCES;

  // Headhunt Agency
  const agencies = await getAgencies(pool);

  // 3. Remove existing "Data Validation" sheet to avoid conflicts
  const oldWs = workbook.getWorksheet("Data Validation");
  if (oldWs) {
    workbook.removeWorksheet(oldWs.id);
  }

  // 4. Extra sections data matching the template
  const extraSections = [
    {
      rows: [
        ['Expected onboard date:'],
        ['Tuyển mới', '<=15', '1 tuần'],
        ['Tuyển mới', '16<x<=30', '2 tuần'],
        ['Tuyển mới', '31<x<=45', '3 tuần'],
        ['Tuyển mới', '>45', '4 tuần'],
        ['Tuyển bù', 'Đơn đủ', '2 tuần'],
        ['Tuyển bù', 'Đơn thiếu', '1 tuần']
      ]
    },
    {
      rows: [
        ['Vendor', 'Email', 'Email', 'PW'],
        ['VNW', 'Hoang.Huong0@molex.com', null, 'Molex@123'],
        ['Top CV', 'ngocanh.hoang@kochcc.com', 'ngocanh.hoang@kochcc.com', 'Molex12345$']
      ]
    }
  ];

  // 5. Generate new sheet using utilities helper
  createDataValidationSheet(workbook, {
    columns: {
      "Dept": depts,
      "PIC": pics,
      "Final Status": statuses,
      "Function": functions,
      "Source": sources,
      "EE Level": eeLevels,
      "Recruitment costs categories": costCategories,
      "Recruitment Status": recruitmentStatuses,
      "Data source": dataSources,
      "Headhunt Agency": agencies
    },
    extra_sections: extraSections
  });

  return workbook;
}

export default createValidationSheet;
