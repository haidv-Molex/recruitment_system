import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import updateProfile from "@services/user/updateProfile";

describe("updateProfile service", () => {
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

  it("should successfully update user name and description", async () => {
    // Seed a user
    const insertRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_description, user_role) VALUES ($1, $2, $3, 'user') RETURNING user_id`,
      ["Old Name", "test_user_profile", "Old Description"]
    );
    const userId = insertRes.rows[0].user_id;

    // Update profile
    const updated = await updateProfile(userId, { username: "New Name", description: "New Description" }, client);

    expect(updated.user_name).to.equal("New Name");
    expect(updated.user_description).to.equal("New Description");

    // Fetch from db to verify persistence
    const checkRes = await client.query(`SELECT user_name, user_description FROM "user" WHERE user_id = $1`, [userId]);
    expect(checkRes.rows[0].user_name).to.equal("New Name");
    expect(checkRes.rows[0].user_description).to.equal("New Description");
  });

  it("should successfully update only username", async () => {
    // Seed a user
    const insertRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_description, user_role) VALUES ($1, $2, $3, 'user') RETURNING user_id`,
      ["Old Name", "test_user_profile2", "Old Description"]
    );
    const userId = insertRes.rows[0].user_id;

    // Update profile
    const updated = await updateProfile(userId, { username: "New Name Only" }, client);

    expect(updated.user_name).to.equal("New Name Only");
    expect(updated.user_description).to.equal("Old Description");
  });

  it("should throw AppError 404 when user does not exist", async () => {
    try {
      await updateProfile(999999, { username: "Ghost" }, client);
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.equal("Không tìm thấy người dùng");
    }
  });

  it("should throw AppError 400 when data is empty", async () => {
    try {
      await updateProfile(1, {}, client);
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.equal("Không có thông tin nào để cập nhật"); // check custom message in service
    }
  });
});
