import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import hcRequestedByDepartment from "@services/dashboard/hcRequestedByDepartment";

describe("hcRequestedByDepartment", () => {
  let client: PoolClient;
  let expect: any;

  // chai v6 là ESM-only → phải dynamic import
  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  let deptId1: number;
  let deptId2: number;
  let jobId: number;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    const dept1 = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["TEST_ME", "Test Mechanical"]
    );
    deptId1 = dept1.rows[0].department_id;

    const dept2 = await client.query(
      `INSERT INTO department (department_code, department_name)
       VALUES ($1, $2) RETURNING department_id`,
      ["TEST_ENG", "Test Engineering"]
    );
    deptId2 = dept2.rows[0].department_id;

    const job = await client.query(
      `INSERT INTO job (job_code, project, request_date)
       VALUES ($1, $2, $3) RETURNING job_id`,
      ["JOB-DASH-001", "Dashboard Test Project", "2025-01-15"]
    );
    jobId = job.rows[0].job_id;

    // dept1 cần 5 HC, dept2 cần 3 HC
    await client.query(
      `INSERT INTO job_department (job_id, department_id, candidate_required)
       VALUES ($1, $2, $3), ($1, $4, $5)`,
      [jobId, deptId1, 5, deptId2, 3]
    );
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  // ✅ Happy path — có date filter
  it("should return array sorted descending by value when date range is provided", async () => {
    const data = await hcRequestedByDepartment(
      { from: new Date("2025-01-01"), to: new Date("2025-12-31") },
      client
    );

    expect(data).to.be.an("array");

    const me = data.find((d: any) => d.label === "TEST_ME");
    const eng = data.find((d: any) => d.label === "TEST_ENG");

    expect(me).to.exist;
    expect(eng).to.exist;
    expect(me.value).to.equal(5);
    expect(eng.value).to.equal(3);

    // Thứ tự giảm dần
    expect(data.indexOf(me)).to.be.lessThan(data.indexOf(eng));
  });

  // ✅ Không truyền from/to → trả toàn bộ
  it("should return all data when no date range is provided", async () => {
    const data = await hcRequestedByDepartment({}, client);

    const me = data.find((d: any) => d.label === "TEST_ME");
    const eng = data.find((d: any) => d.label === "TEST_ENG");

    expect(me).to.exist;
    expect(eng).to.exist;
  });

  // 🔲 Date range không bao phủ → không có dept seed
  it("should not include seeded depts when date range excludes them", async () => {
    const data = await hcRequestedByDepartment(
      { from: new Date("2020-01-01"), to: new Date("2020-12-31") },
      client
    );

    expect(data.find((d: any) => d.label === "TEST_ME")).to.not.exist;
    expect(data.find((d: any) => d.label === "TEST_ENG")).to.not.exist;
  });

  // 🔲 from = to = đúng ngày request_date → vẫn tính
  it("should include job when from equals to equals request_date", async () => {
    const data = await hcRequestedByDepartment(
      { from: new Date("2025-01-15"), to: new Date("2025-01-15") },
      client
    );

    const me = data.find((d: any) => d.label === "TEST_ME");
    expect(me).to.exist;
    expect(me.value).to.equal(5);
  });

  // ✅ Cấu trúc phải đúng ChartDataPoint: { label: string, value: number }
  it("should return data with label (string) and value (number) only", async () => {
    const data = await hcRequestedByDepartment({}, client);

    for (const point of data) {
      expect(point.label).to.be.a("string");
      expect(point.value).to.be.a("number");
      // Không có field nào khác
      expect(Object.keys(point)).to.deep.equal(["label", "value"]);
    }
  });
});
