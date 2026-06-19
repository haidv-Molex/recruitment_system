import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/department/getAll";

describe("getAll (Department)", () => {
  let client: PoolClient;
  let expect: any;
  let seededUserId: number;

  before(async () => {
    const { expect: localExpect } = await new Function("specifier", "return import(specifier)")("chai");
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["DepartmentGetAll_User", "user"]
    );
    seededUserId = userResult.rows[0].user_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should filter by department name or code and populate user", async () => {
    await client.query(
      `INSERT INTO department (department_code, department_name, department_description, user_id) VALUES ($1, $2, $3, $4)`,
      ["DEPT_GET_ALL", "DepartmentGetAll_Target", "target desc", seededUserId]
    );

    const byName = await getAll({ page: 1, limit: 10, search: "DepartmentGetAll_Target" }, client);
    const byCode = await getAll({ page: 1, limit: 10, search: "DEPT_GET_ALL" }, client);

    expect(byName.total).to.equal(1);
    expect(byCode.total).to.equal(1);
    expect(byName.items[0].department_name).to.equal("DepartmentGetAll_Target");
    expect(byName.items[0].user).to.not.be.null;
    expect(byName.items[0].user!.user_id).to.equal(seededUserId);
  });

  it("should paginate matching rows", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO department (department_code, department_name) VALUES ($1, $2)`,
        [`DEPT_PAGE_${i}`, `DepartmentGetAll_Page_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "DepartmentGetAll_Page_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(2);
  });

  it("should return all matching rows when unlimited is true", async () => {
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO department (department_code, department_name) VALUES ($1, $2)`,
        [`DEPT_UNLIMITED_${i}`, `DepartmentGetAll_Unlimited_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "DepartmentGetAll_Unlimited_" }, client);

    expect(result.total).to.equal(3);
    expect(result.items).to.have.lengthOf(3);
  });
});