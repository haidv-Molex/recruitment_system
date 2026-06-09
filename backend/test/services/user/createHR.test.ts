import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import { AppError } from "@middlewares/AppError";
import createHR from "@services/user/createHR";

describe("createHR service", () => {
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

  it("should successfully create a new HR user", async () => {
    const hrData = {
      username: "HR Person",
      account: "hr_person@example.com",
      password: "password123",
      description: "HR Recruiter"
    };

    const result = await createHR(hrData, client);

    expect(result).to.have.property("user_id").that.is.a("number");
    expect(result.user_name).to.equal(hrData.username);
    expect(result.user_role).to.equal("hr");
    expect(result.user_description).to.equal(hrData.description);
  });

  it("should throw AppError 409 when account already exists", async () => {
    // Seed an existing user
    await client.query(
      `INSERT INTO "user" (user_name, user_account, user_role) VALUES ($1, $2, 'hr')`,
      ["Existing HR", "hr_duplicate@example.com"]
    );

    const hrData = {
      username: "New HR",
      account: "hr_duplicate@example.com",
      password: "password123"
    };

    try {
      await createHR(hrData, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(409);
      expect((err as AppError).message).to.equal("Tài khoản đã tồn tại trong hệ thống");
    }
  });

  it("should throw AppError 400 when username is missing", async () => {
    const hrData = {
      username: "",
      account: "hr_invalid@example.com",
      password: "password123"
    };

    try {
      await createHR(hrData, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
      expect((err as AppError).message).to.equal("Tên người dùng và tài khoản là bắt buộc");
    }
  });

  it("should throw AppError 400 when account is missing", async () => {
    const hrData = {
      username: "Some Name",
      account: "",
      password: "password123"
    };

    try {
      await createHR(hrData, client);
      expect.fail("Should have thrown AppError");
    } catch (err) {
      expect(err).to.be.instanceOf(AppError);
      expect((err as AppError).statusCode).to.equal(400);
      expect((err as AppError).message).to.equal("Tên người dùng và tài khoản là bắt buộc");
    }
  });
});
