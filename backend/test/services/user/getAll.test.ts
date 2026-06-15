import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getAll from "@services/user/getAll";

describe("getAll (User)", () => {
  let client: PoolClient;
  let expect: any;

  before(async () => {
    const { expect: localExpect } = await new Function('specifier', 'return import(specifier)')('chai');
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should return items array and total count", async () => {
    const result = await getAll({ page: 1, limit: 10 }, client);

    expect(result).to.have.property("items").that.is.an("array");
    expect(result).to.have.property("total").that.is.a("number");
  });

  it("should return userOutputModel fields without sensitive data", async () => {
    // Seed a user
    await client.query(
      `INSERT INTO "user" (user_name, user_description, user_role) VALUES ($1, $2, $3)`,
      ["Test GetAll User", "test desc", "user"]
    );

    const result = await getAll({ page: 1, limit: 10, search: "Test GetAll User" }, client);

    expect(result.items.length).to.be.greaterThanOrEqual(1);
    const user = result.items[0];
    expect(user).to.have.property("user_id");
    expect(user).to.have.property("user_name");
    expect(user).to.have.property("user_description");
    expect(user).to.have.property("user_role");
    expect(user).to.have.property("department"); // full department object or null
    expect(user).to.have.property("create_at");
    expect(user).to.have.property("update_at");
    // department_id must NOT be directly present
    expect(user).to.not.have.property("department_id");
    // Sensitive fields must NOT be present
    expect(user).to.not.have.property("user_account");
    expect(user).to.not.have.property("user_password");
  });

  it("should paginate correctly", async () => {
    // Seed 3 users
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO "user" (user_name) VALUES ($1)`,
        [`PaginationUser_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 2, search: "PaginationUser_" }, client);

    expect(result.items.length).to.equal(2);
    expect(result.total).to.equal(3);
  });

  it("should return all items when unlimited is true", async () => {
    // Seed 3 users
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO "user" (user_name) VALUES ($1)`,
        [`UnlimitedUser_${i}`]
      );
    }

    const result = await getAll({ page: 1, limit: 1, unlimited: true, search: "UnlimitedUser_" }, client);

    expect(result.items.length).to.equal(3);
    expect(result.total).to.equal(3);
  });

  it("should filter by search keyword", async () => {
    await client.query(
      `INSERT INTO "user" (user_name) VALUES ($1)`,
      ["UniqueSearchUser_XYZ"]
    );

    const result = await getAll({ page: 1, limit: 10, search: "UniqueSearchUser_XYZ" }, client);

    expect(result.items.length).to.equal(1);
    expect(result.items[0].user_name).to.equal("UniqueSearchUser_XYZ");
  });

  it("should return empty items when search matches nothing", async () => {
    const result = await getAll({ page: 1, limit: 10, search: "NonExistentUser_999888" }, client);

    expect(result.items).to.be.an("array").that.is.empty;
    expect(result.total).to.equal(0);
  });

  it("should filter by role", async () => {
    // Seed users with different roles
    await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2), ($3, $4)`,
      ["RoleUser_Admin", "admin", "RoleUser_HR", "hr"]
    );

    const result = await getAll({ page: 1, limit: 10, role: "admin" }, client);
    const adminUser = result.items.find(u => u.user_name === "RoleUser_Admin");
    const hrUser = result.items.find(u => u.user_name === "RoleUser_HR");

    expect(adminUser).to.not.be.undefined;
    expect(hrUser).to.be.undefined;
    expect(adminUser!.user_role).to.equal("admin");
  });

  it("should filter by both search keyword and role", async () => {
    await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2), ($3, $4)`,
      ["SearchAndRoleUser_Target", "hr", "SearchAndRoleUser_Other", "admin"]
    );

    const result = await getAll({
      page: 1,
      limit: 10,
      search: "SearchAndRoleUser_",
      role: "hr"
    }, client);

    expect(result.items.length).to.equal(1);
    expect(result.items[0].user_name).to.equal("SearchAndRoleUser_Target");
    expect(result.items[0].user_role).to.equal("hr");
  });
});
