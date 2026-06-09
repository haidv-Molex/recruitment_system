import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import updatePassword from "@services/user/updatePassword";
import bcrypt from "bcrypt";

describe("updatePassword service", () => {
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

  it("should successfully update user password with bcrypt hash", async () => {
    // Seed a user
    const insertRes = await client.query(
      `INSERT INTO "user" (user_name, user_account, user_password, user_role) VALUES ($1, $2, $3, 'user') RETURNING user_id`,
      ["Test User", "test_user_pw", "old_hashed_pw"]
    );
    const userId = insertRes.rows[0].user_id;

    // Update password
    await updatePassword(userId, "newSecretPassword123", client);

    // Fetch updated password
    const checkRes = await client.query(`SELECT user_password FROM "user" WHERE user_id = $1`, [userId]);
    const hashedPw = checkRes.rows[0].user_password;

    expect(hashedPw).to.not.equal("old_hashed_pw");
    const isCorrect = await bcrypt.compare("newSecretPassword123", hashedPw);
    expect(isCorrect).to.be.true;
  });

  it("should throw AppError 404 when user does not exist", async () => {
    try {
      await updatePassword(999999, "newSecretPassword123", client);
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.equal("Không tìm thấy người dùng");
    }
  });

  it("should throw AppError 400 when password is empty", async () => {
    try {
      await updatePassword(1, "", client);
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(400);
      expect(err.message).to.equal("Mật khẩu không được để trống");
    }
  });
});
