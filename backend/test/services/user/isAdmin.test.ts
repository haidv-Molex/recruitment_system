import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import isAdmin from "@services/user/isAdmin";

describe("isAdmin", () => {
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

  it("should return true when user is an admin", async () => {
    const res = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Admin User", "admin"]
    );
    const userId = res.rows[0].user_id;

    const result = await isAdmin(userId, client);
    expect(result).to.be.true;
  });

  it("should return false when user is not an admin", async () => {
    const res = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["HR User", "hr"]
    );
    const userId = res.rows[0].user_id;

    const result = await isAdmin(userId, client);
    expect(result).to.be.false;
  });

  it("should return false when user has another role", async () => {
    const res = await client.query(
      `INSERT INTO "user" (user_name, user_role) VALUES ($1, $2) RETURNING user_id`,
      ["Normal User", "user"]
    );
    const userId = res.rows[0].user_id;

    const result = await isAdmin(userId, client);
    expect(result).to.be.false;
  });

  it("should throw AppError 404 when user is not found", async () => {
    try {
      await isAdmin(999999, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(404);
      expect((err as AppError).message).to.equal("Không tìm thấy người dùng");
    }
  });

  it("should throw AppError 400 when userId is null/undefined", async () => {
    try {
      await isAdmin(null as any, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
      expect((err as AppError).message).to.equal("User ID là bắt buộc");
    }
  });
});
