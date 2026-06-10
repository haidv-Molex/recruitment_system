import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import comparePassword from "@services/user/comparePassword";
import bcrypt from "bcrypt";

describe("comparePassword service", () => {
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

  it("should return true when plaintext password matches the hashed password in database", async () => {
    const rawPassword = "mySecretPassword123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Seed a user
    const insertRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role) VALUES ($1, $2, $3, 'user') RETURNING user_id`,
      ["Test User Compare", "test_user_compare", hashedPassword]
    );
    const userId = insertRes.rows[0].user_id;

    // Compare correct password
    const result = await comparePassword(rawPassword, userId, client);
    expect(result).to.be.true;
  });

  it("should return false when plaintext password does not match the hashed password in database", async () => {
    const rawPassword = "mySecretPassword123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Seed a user
    const insertRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role) VALUES ($1, $2, $3, 'user') RETURNING user_id`,
      ["Test User Compare", "test_user_compare", hashedPassword]
    );
    const userId = insertRes.rows[0].user_id;

    // Compare incorrect password
    const result = await comparePassword("wrongPassword", userId, client);
    expect(result).to.be.false;
  });

  it("should return false when hashed password in database is null/falsy", async () => {
    // Seed a user with null password
    const insertRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role) VALUES ($1, $2, NULL, 'user') RETURNING user_id`,
      ["Test User Compare Null", "test_user_compare_null"]
    );
    const userId = insertRes.rows[0].user_id;

    const result = await comparePassword("anyPassword", userId, client);
    expect(result).to.be.false;
  });

  it("should throw AppError 404 when user does not exist", async () => {
    try {
      await comparePassword("anyPassword", 999999, client);
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.equal("Không tìm thấy người dùng");
    }
  });
});
