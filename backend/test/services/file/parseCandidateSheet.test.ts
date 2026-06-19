import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import parseCandidateSheet from "@services/file/parseCandidateSheet";

const SAMPLE_DATABASE_HEADERS = [
  "Input date (dd/mm/yyyy)",
  "Department",
  "Name",
  "Email",
  "Phone number",
  "Recruiter",
  "Job code",
  "Job title",
  "EE Level",
  "Project",
  "Hiring manager",
  "DL/IDL",
  "Status",
  "Onboarding Date (DD/MM/YYYY)",
  "Offer Sent date\n(DD/MM/YYYY)",
  "Source",
  "Mã nhân viên",
  "Người giới thiệu",
  "Bộ phận",
  "Note",
  "Current salary \n(Gross M VND)",
  "Expected salary\n(Gross M VND)",
  "Candidate result feedback date",
  "Headhunt Agency",
  "Targeted company",
  "Targeted company name",
];

describe("parseCandidateSheet service", () => {
  let client: PoolClient;
  let expect: any;
  let seededRecruiterId: number;
  let seededManagerId: number;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed a recruiter user
    const u1 = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Annie", "user"]
    );
    seededRecruiterId = u1.rows[0].user_id;

    // Seed a hiring manager user
    const u2 = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Nguyễn Lê Hoàng", "user"]
    );
    seededManagerId = u2.rows[0].user_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  // ─── Happy path ────────────────────────────────────────────────────────────

  it("should parse and return correct candidate data with resolved users", async () => {
    const rawRows = [
      {
        "Input date (dd/mm/yyyy)": "2025-04-22T00:00:00.000Z",
        "Department": "AS",
        "Name": "Nguyễn Văn A",
        "Email": "nguyenvana@gmail.com",
        "Phone number": "0903442885",
        "Recruiter": "Annie",
        "Job code": "J001",
        "Job title": "Engineer, Production",
        "EE Level": "Engineer",
        "Project": "DSS Talent Connector",
        "Hiring manager": "Nguyễn Lê Hoàng",
        "DL/IDL": "MXV",
        "Status": "CV Fail",
        "Onboarding Date (DD/MM/YYYY)": null,
        "Offer Sent date\n(DD/MM/YYYY)": null,
        "Source": "Vietnamworks Job Post",
        "Mã nhân viên": null,
        "Người giới thiệu": null,
        "Bộ phận": null,
        "Note": null,
        "Current salary \n(Gross M VND)": null,
        "Expected salary\n(Gross M VND)": null,
        "Candidate result feedback date": "2025-04-29T00:00:00.000Z",
        "Headhunt Agency": null,
        "Targeted company": "No",
        "Targeted company name": null,
      },
    ];

    const result = await parseCandidateSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const c = result[0];

    // Scalar fields
    expect(c.candidate_name).to.equal("Nguyễn Văn A");
    expect(c.candidate_email).to.equal("nguyenvana@gmail.com");
    expect(c.candidate_phone).to.equal("0903442885");
    expect(c.status).to.equal("CV Fail");
    expect(c.source).to.equal("Vietnamworks Job Post");
    expect(c.department_code).to.equal("AS");
    expect(c.job_code).to.equal("J001");
    expect(c.job_title).to.equal("Engineer, Production");
    expect(c.ee_level).to.equal("Engineer");
    expect(c.project).to.equal("DSS Talent Connector");
    expect(c.dl_idl).to.equal("MXV");
    expect(c.targeted_company).to.equal("No");
    expect(c.agency).to.be.null;
    expect(c.note).to.be.null;
    expect(c.current_salary).to.be.null;
    expect(c.expected_salary).to.be.null;
    expect(c.employee_code).to.be.null;
    expect(c.reference_name).to.be.null;
    expect(c.reference_department).to.be.null;
    expect(c.targeted_company_name).to.be.null;

    // Date fields
    expect(c.input_date).to.be.instanceOf(Date);
    expect(c.feedback_date).to.be.instanceOf(Date);
    expect(c.offer_date).to.be.null;
    expect(c.onboard_date).to.be.null;

    // Resolved users
    expect(c.hiring_manager).to.not.be.null;
    expect(c.hiring_manager!.user_id).to.equal(seededManagerId);
    expect(c.hiring_manager!.user_name).to.equal("Nguyễn Lê Hoàng");
  });

  it("should preserve sample Database sheet fields including Source and EE Level", async () => {
    const rawRow = Object.fromEntries(SAMPLE_DATABASE_HEADERS.map((header) => [header, null]));
    rawRow["Name"] = "Sample Contract Candidate";
    rawRow["Email"] = "sample.contract@example.com";
    rawRow["Phone number"] = "0903442885";
    rawRow["Recruiter"] = "Annie";
    rawRow["Job code"] = "J001";
    rawRow["Job title"] = "Engineer, Production";
    rawRow["EE Level"] = "Engineer";
    rawRow["Project"] = "DSS Talent Connector";
    rawRow["Hiring manager"] = "Nguyễn Lê Hoàng";
    rawRow["DL/IDL"] = "MXV";
    rawRow["Status"] = "CV Sent";
    rawRow["Source"] = "Vietnamworks Job Post";

    const result = await parseCandidateSheet([rawRow], client);

    expect(result).to.be.an("array").with.lengthOf(1);
    expect(result[0].candidate_name).to.equal("Sample Contract Candidate");
    expect(result[0].candidate_email).to.equal("sample.contract@example.com");
    expect(result[0].source).to.equal("Vietnamworks Job Post");
    expect(result[0].ee_level).to.equal("Engineer");
    expect(result[0].job_code).to.equal("J001");
    expect(result[0].project).to.equal("DSS Talent Connector");
  });

  it("should allow a blank Email cell and still parse the candidate row", async () => {
    const rawRow = Object.fromEntries(SAMPLE_DATABASE_HEADERS.map((header) => [header, null]));
    rawRow["Name"] = "No Email Candidate";
    rawRow["Email"] = "";
    rawRow["Recruiter"] = "Annie";
    rawRow["Hiring manager"] = "Nguyễn Lê Hoàng";
    rawRow["Status"] = "CV Sent";
    rawRow["Source"] = "Facebook";
    rawRow["EE Level"] = "Engineer";

    const result = await parseCandidateSheet([rawRow], client);

    expect(result).to.be.an("array").with.lengthOf(1);
    expect(result[0].candidate_name).to.equal("No Email Candidate");
    expect(result[0].candidate_email).to.be.null;
    expect(result[0].source).to.equal("Facebook");
    expect(result[0].ee_level).to.equal("Engineer");
  });

  // ─── Placeholder stubs for unknown users ───────────────────────────────────

  it("should return placeholder stubs with null user_id for unknown recruiter/manager names", async () => {
    const rawRows = [
      {
        "Name": "Trần Thị B",
        "Recruiter": "Unknown Recruiter",
        "Hiring manager": "Unknown Manager",
        "Status": "CV Sent",
      },
    ];

    const result = await parseCandidateSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const c = result[0];

    expect(c.hiring_manager).to.not.be.null;
    expect(c.hiring_manager!.user_id).to.be.null;
    expect(c.hiring_manager!.user_name).to.equal("Unknown Manager");
  });

  // ─── Null / missing recruiter & manager ────────────────────────────────────

  it("should return null recruiter and hiring_manager when fields are null", async () => {
    const rawRows = [
      {
        "Name": "Lê Văn C",
        "Recruiter": null,
        "Hiring manager": null,
        "Status": "Hold",
      },
    ];

    const result = await parseCandidateSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    expect(result[0].hiring_manager).to.be.null;
  });

  // ─── Onboarded candidate (all dates present) ───────────────────────────────

  it("should parse onboarded candidate with all date fields", async () => {
    const rawRows = [
      {
        "Name": "Lê Văn D",
        "Status": "Onboarded",
        "Input date (dd/mm/yyyy)": "2025-08-14T00:00:00.000Z",
        "Onboarding Date (DD/MM/YYYY)": "2025-09-15T00:00:00.000Z",
        "Offer Sent date\n(DD/MM/YYYY)": "2025-08-22T00:00:00.000Z",
        "Candidate result feedback date": "2025-08-21T00:00:00.000Z",
      },
    ];

    const result = await parseCandidateSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const c = result[0];

    expect(c.input_date).to.be.instanceOf(Date);
    expect(c.onboard_date).to.be.instanceOf(Date);
    expect(c.offer_date).to.be.instanceOf(Date);
    expect(c.feedback_date).to.be.instanceOf(Date);
  });

  // ─── Headhunt candidate fields ─────────────────────────────────────────────

  it("should correctly map agency and targeted_company_name for headhunt rows", async () => {
    const rawRows = [
      {
        "Name": "Lê Văn E",
        "Status": "Withdraw",
        "Headhunt Agency": "AsiaHr",
        "Targeted company": "Yes",
        "Targeted company name": "Foxconn",
      },
    ];

    const result = await parseCandidateSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const c = result[0];

    expect(c.agency).to.equal("AsiaHr");
    expect(c.targeted_company).to.equal("Yes");
    expect(c.targeted_company_name).to.equal("Foxconn");
  });

  // ─── Multiple rows ─────────────────────────────────────────────────────────

  it("should return an array with the same length as input rows", async () => {
    const rawRows = Array.from({ length: 5 }, (_, i) => ({
      "Name": `Candidate ${i}`,
      "Status": "CV Sent",
    }));

    const result = await parseCandidateSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(5);
  });

  // ─── Empty input ───────────────────────────────────────────────────────────

  it("should return an empty array when given empty rows", async () => {
    const result = await parseCandidateSheet([], client);
    expect(result).to.be.an("array").with.lengthOf(0);
  });
});
