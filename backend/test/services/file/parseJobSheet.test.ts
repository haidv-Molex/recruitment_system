import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import parseJobSheet from "@services/file/parseJobSheet";

describe("parseJobSheet service", () => {
  let client: PoolClient;
  let expect: any;
  let seededManagerId: number;
  let seededBPId: number;
  let seededDeptId: number;
  let seededSiteId: number;
  let seededTitleId: number;
  let seededLevelId: number;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed data
    const u1 = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Nguyễn Lê Hoàng", "user"]
    );
    seededManagerId = u1.rows[0].user_id;

    const u2 = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Thanh", "user"]
    );
    seededBPId = u2.rows[0].user_id;

    const d = await client.query(
      `INSERT INTO department (department_code, department_name) VALUES ($1, $2) RETURNING department_id`,
      ["AS_TEST_CODE", "AS_TEST"]
    );
    seededDeptId = d.rows[0].department_id;

    const s = await client.query(
      `INSERT INTO site (site_code, site_name) VALUES ($1, $2) RETURNING site_id`,
      ["MXV_CODE", "MXV"]
    );
    seededSiteId = s.rows[0].site_id;

    const l1 = await client.query(
      `INSERT INTO level (level_code, level_name) VALUES ($1, $2) RETURNING level_id`,
      ["ENG_PROD", "Engineer, Production"]
    );
    seededTitleId = l1.rows[0].level_id;

    const l2 = await client.query(
      `INSERT INTO level (level_code, level_name) VALUES ($1, $2) RETURNING level_id`,
      ["ENG", "Engineer"]
    );
    seededLevelId = l2.rows[0].level_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should successfully parse and resolve fields using seeded database names", async () => {
    const rawRows = [
      {
        "Job Code": "J001",
        "Project": "DSS Talent Connector",
        "Dept.": "AS_TEST",
        "HC Requested": 1,
        "Job title": "Engineer, Production",
        "EE Level": "Engineer",
        "Sites": "MXV",
        "Hiring manager": "Nguyễn Lê Hoàng",
        "HRBP": "Thanh",
        "Note": "This is a note"
      }
    ];

    const result = await parseJobSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const job = result[0];

    expect(job.job_code).to.equal("J001");
    expect(job.project).to.equal("DSS Talent Connector");
    expect(job.note).to.equal("This is a note");
    expect(job.file).to.be.null;

    // Verify relations resolved by name
    expect(job.departments).to.be.an("array").with.lengthOf(1);
    expect(job.departments[0].department_id).to.equal(seededDeptId);
    expect(job.departments[0].department_name).to.equal("AS_TEST");
    expect(job.departments[0].candidate_required).to.equal(1);

    expect(job.sites).to.be.an("array").with.lengthOf(1);
    expect(job.sites[0].site_id).to.equal(seededSiteId);
    expect(job.sites[0].site_name).to.equal("MXV");

    expect(job.titles).to.be.an("array").with.lengthOf(1);
    expect(job.titles[0].level_id).to.equal(seededTitleId);
    expect(job.titles[0].level_name).to.equal("Engineer, Production");

    expect(job.employee_levels).to.be.an("array").with.lengthOf(1);
    expect(job.employee_levels[0].level_id).to.equal(seededLevelId);
    expect(job.employee_levels[0].level_name).to.equal("Engineer");

    expect(job.managers).to.be.an("array").with.lengthOf(1);
    expect(job.managers[0].user_id).to.equal(seededManagerId);
    expect(job.managers[0].user_name).to.equal("Nguyễn Lê Hoàng");

    expect(job.partners).to.be.an("array").with.lengthOf(1);
    expect(job.partners[0].user_id).to.equal(seededBPId);
    expect(job.partners[0].user_name).to.equal("Thanh");
  });

  it("should output placeholder objects with null IDs for missing/invalid matching names", async () => {
    const rawRows = [
      {
        "Job Code": "J999",
        "Project": "Unknown Project",
        "Dept.": "Unknown Dept",
        "HC Requested": "invalid_number",
        "Job title": "Unknown Title",
        "EE Level": "Unknown Level",
        "Sites": "Unknown Site",
        "Hiring manager": "Unknown Manager",
        "HRBP": "Unknown HRBP",
        "Note": null
      }
    ];

    const result = await parseJobSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const job = result[0];

    expect(job.job_code).to.equal("J999");
    expect(job.project).to.equal("Unknown Project");
    expect(job.note).to.be.null;

    expect(job.departments).to.be.an("array").with.lengthOf(1);
    expect(job.departments[0].department_id).to.be.null;
    expect(job.departments[0].department_name).to.equal("Unknown Dept");
    expect(job.departments[0].candidate_required).to.equal(0);

    expect(job.sites).to.be.an("array").with.lengthOf(1);
    expect(job.sites[0].site_id).to.be.null;
    expect(job.sites[0].site_name).to.equal("Unknown Site");

    expect(job.titles).to.be.an("array").with.lengthOf(1);
    expect(job.titles[0].level_id).to.be.null;
    expect(job.titles[0].level_name).to.equal("Unknown Title");

    expect(job.employee_levels).to.be.an("array").with.lengthOf(1);
    expect(job.employee_levels[0].level_id).to.be.null;
    expect(job.employee_levels[0].level_name).to.equal("Unknown Level");

    expect(job.managers).to.be.an("array").with.lengthOf(1);
    expect(job.managers[0].user_id).to.be.null;
    expect(job.managers[0].user_name).to.equal("Unknown Manager");

    expect(job.partners).to.be.an("array").with.lengthOf(1);
    expect(job.partners[0].user_id).to.be.null;
    expect(job.partners[0].user_name).to.equal("Unknown HRBP");
  });

  it("should support multiple comma-separated names in a single field, returning mixed DB & placeholder values", async () => {
    const rawRows = [
      {
        "Job Code": "J002",
        "Project": "Multi Project",
        "Hiring manager": "Nguyễn Lê Hoàng, Some Unknown Manager, Thanh"
      }
    ];

    const result = await parseJobSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const job = result[0];

    expect(job.managers).to.be.an("array").with.lengthOf(3);
    expect(job.managers[0].user_id).to.equal(seededManagerId);
    expect(job.managers[0].user_name).to.equal("Nguyễn Lê Hoàng");

    expect(job.managers[1].user_id).to.be.null;
    expect(job.managers[1].user_name).to.equal("Some Unknown Manager");

    expect(job.managers[2].user_id).to.equal(seededBPId);
    expect(job.managers[2].user_name).to.equal("Thanh");
  });

  it("should map multiple departments to multiple partners 1-to-1 in order", async () => {
    const rawRows = [
      {
        "Job Code": "J003",
        "Project": "Multi Dept/Partner Project",
        "Dept.": "AS_TEST, Unknown Dept",
        "HC Requested": 4,
        "HRBP": "Thanh, New HRBP"
      }
    ];

    const result = await parseJobSheet(rawRows, client);

    expect(result).to.be.an("array").with.lengthOf(1);
    const job = result[0];

    expect(job.departments).to.be.an("array").with.lengthOf(2);
    
    // First department "AS_TEST" should map to the first HRBP "Thanh"
    expect(job.departments[0].department_name).to.equal("AS_TEST");
    expect(job.departments[0].user_id).to.equal(seededBPId);

    // Second department "Unknown Dept" should map to the second HRBP "New HRBP"
    expect(job.departments[1].department_name).to.equal("Unknown Dept");
    expect(job.departments[1].user_id).to.be.null;
    expect(job.departments[1].partner_name).to.equal("New HRBP");
  });
});
