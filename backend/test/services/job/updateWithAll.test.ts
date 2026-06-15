import { PoolClient } from "pg";
import { pool } from "@middlewares/database";
import updateJob from "@services/job/update";
import createWithAll from "@services/job/createWithAll";

describe("update job service with auto-creation names", () => {
  let client: PoolClient;
  let expect: any;
  let sampleJobId: number;

  before(async () => {
    const { expect: localExpect } = await new Function(
      "specifier",
      "return import(specifier)"
    )("chai");
    expect = localExpect;
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query("BEGIN");

    // Seed a job to update
    const seed = await createWithAll(
      {
        job_code: "SEED-JOB-001",
        project: "Seed Project",
      },
      client
    );
    sampleJobId = seed.job_id;
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  it("should successfully update job metadata", async () => {
    const result = await updateJob(
      sampleJobId,
      {
        project: "Updated Seed Project",
      },
      client
    );

    expect(result.project).to.equal("Updated Seed Project");
    // candidate_required is now per-department (in departments[].candidate_required)
    // so it's no longer a top-level field on the job output
  });

  it("should auto-create related entities by name on update", async () => {
    const result = await updateJob(
      sampleJobId,
      {
        partners_name: ["Update Partner A", "Update Partner B"],
        departments_name: [
          { name: "Update Dept X", candidate_required: 3 },
          { name: "Update Dept W", candidate_required: 2 }
        ],
        segments_name: ["Update Seg Y"],
        sites_name: ["Update Site Z"],
        titles_name: ["Update Title L1"],
        managers_name: ["Update Manager M1"],
        employee_levels_name: ["Update Level E1"],
      },
      client
    );

    expect(result.partners).to.be.an("array").with.lengthOf(2);
    const partnerNames = result.partners!.map((p: any) => p.user_name);
    expect(partnerNames).to.include("Update Partner A");
    expect(partnerNames).to.include("Update Partner B");

    expect(result.departments).to.be.an("array").with.lengthOf(2);
    const deptNames = result.departments!.map((d: any) => d.department_name);
    expect(deptNames).to.include("Update Dept X");
    expect(deptNames).to.include("Update Dept W");

    expect(result.segments).to.be.an("array").with.lengthOf(1);
    expect(result.segments![0]).to.have.property("segment_name", "Update Seg Y");

    expect(result.sites).to.be.an("array").with.lengthOf(1);
    expect(result.sites![0]).to.have.property("site_name", "Update Site Z");

    expect(result.titles).to.be.an("array").with.lengthOf(1);
    expect(result.titles![0]).to.have.property("level_name", "Update Title L1");

    expect(result.managers).to.be.an("array").with.lengthOf(1);
    expect(result.managers![0]).to.have.property("user_name", "Update Manager M1");

    expect(result.employee_levels).to.be.an("array").with.lengthOf(1);
    expect(result.employee_levels![0]).to.have.property("level_name", "Update Level E1");
  });
});
