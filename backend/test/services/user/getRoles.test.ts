import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import getRoles from "@services/user/getRoles";

describe("getRoles service", () => {
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

  it("should return the list of defined roles in the app", async () => {
    const roles = await getRoles(client);
    expect(roles).to.be.an("array").that.deep.equals(["admin", "hr", "user", "banned"]);
  });
});
