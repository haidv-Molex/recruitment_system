import { PoolClient } from "pg";
import User from "@services/user/_User";
import Platform from "@services/platform/_Platform";
import Company from "@services/company/_Company";
import Level from "@services/level/_Level";
import Job from "@services/job/_Job";
import { create } from "@services/candidate/create";
import { update } from "@services/candidate/update";
import normalizeLookupKey from "@utilities/entity/normalizeLookupKey";
import resolveAndCreateEntities from "@utilities/entity/resolveAndCreateEntities";

export type CandidateImportItem = {
  row_index?: number | null;
  candidate_name: string;
  status: string;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  agency?: string | null;
  offer_date?: string | Date | null;
  onboard_date?: string | Date | null;
  expected_onboard_date?: string | Date | null;
  feedback_date?: string | Date | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  note?: string | null;
  job_id?: number | null;
  platform_id?: number | null;
  targeted_company?: number | null;
  reference?: number | null;
  candidate_levels?: number[];

  // FK by name
  reference_name?: string | null;
  platform_name?: string | null;
  targeted_company_name?: string | null;
  candidate_levels_name?: string[];
  job_code?: string | null;
  project?: string | null;
};

export type BatchImportResult = {
  success: boolean;
  importedCount: number;
  errors: Array<{ row_index?: number | null; candidate_name: string; candidate_email?: string | null; message: string }>;
};

export async function batchImport(
  candidates: CandidateImportItem[],
  pool: PoolClient
): Promise<BatchImportResult> {
  const referenceNames = new Set<string>();
  const platformNames = new Set<string>();
  const targetedCompanyNames = new Set<string>();
  const levelNames = new Set<string>();
  const jobCodes = new Set<string>();

  const jobCodeToProject = new Map<string, string | null>();
  for (const c of candidates) {
    if (c.reference_name?.trim()) referenceNames.add(c.reference_name.trim());
    if (c.platform_name?.trim()) platformNames.add(c.platform_name.trim());
    if (c.targeted_company_name?.trim()) targetedCompanyNames.add(c.targeted_company_name.trim());
    if (c.job_code?.trim()) {
      jobCodes.add(c.job_code.trim());
      const lowerCode = normalizeLookupKey(c.job_code);
      if (c.project?.trim() && !jobCodeToProject.has(lowerCode)) {
        jobCodeToProject.set(lowerCode, c.project.trim());
      }
    }
    (c.candidate_levels_name || []).forEach((n) => {
      if (n?.trim()) levelNames.add(n.trim());
    });
  }

  // Resolve references (User table)
  const referenceMap = await resolveAndCreateEntities({
    names: referenceNames,
    tableName: "user",
    idColumn: "user_id",
    nameColumn: "user_name",
    pool,
    create: async (name) => {
      const lower = normalizeLookupKey(name);
      const u = await User.create({ username: name }, pool);
      return u.user_id;
    }
  });

  // Resolve platforms
  const platformMap = await resolveAndCreateEntities({
    names: platformNames,
    tableName: "platform",
    idColumn: "platform_id",
    nameColumn: "platform_name",
    pool,
    create: async (name) => {
      const p = await Platform.create({ platform_name: name }, pool);
      return p.platform_id;
    }
  });

  // Resolve targeted companies
  const companyMap = await resolveAndCreateEntities({
    names: targetedCompanyNames,
    tableName: "company",
    idColumn: "company_id",
    nameColumn: "company_name",
    pool,
    create: async (name) => {
      const comp = await Company.create({ company_name: name }, pool);
      return comp.company_id;
    }
  });

  // Resolve levels
  const levelMap = await resolveAndCreateEntities({
    names: levelNames,
    tableName: "level",
    idColumn: "level_id",
    nameColumn: "level_name",
    pool,
    create: async (name) => {
      const l = await Level.create({ level_name: name }, pool);
      return l.level_id;
    }
  });

  // Resolve Job Codes to Job IDs (auto-create if missing)
  const jobMap = new Map<string, number>();
  if (jobCodes.size > 0) {
    const uniqueJobCodes = Array.from(jobCodes).map((jc) => normalizeLookupKey(jc)).filter(Boolean);
    const jobRes = await pool.query(
      `SELECT job_id, LOWER(TRIM(job_code)) AS lower_code FROM job WHERE LOWER(TRIM(job_code)) = ANY($1)`,
      [uniqueJobCodes]
    );
    for (const row of jobRes.rows) {
      jobMap.set(row.lower_code, Number(row.job_id));
    }

    // Auto-create missing jobs
    for (const jc of jobCodes) {
      const lower = normalizeLookupKey(jc);
      if (!jobMap.has(lower)) {
        const projectVal = jobCodeToProject.get(lower) || jc.trim();

        const newJob = await Job.create({
          job_code: jc.trim(),
          project: projectVal,
        }, pool);
        jobMap.set(lower, newJob.job_id);
      }
    }
  }

  let importedCount = 0;
  const errors: BatchImportResult["errors"] = [];

  for (const c of candidates) {
    try {
      // Use a nested savepoint to allow partial success
      await pool.query("SAVEPOINT import_candidate_savepoint");

      let resolvedJobId = c.job_id ?? null;
      if (!resolvedJobId && c.job_code?.trim()) {
        resolvedJobId = jobMap.get(normalizeLookupKey(c.job_code)) ?? null;
      }

          const resolvedReferenceId = c.reference || (c.reference_name?.trim() ? referenceMap.get(normalizeLookupKey(c.reference_name)) : null) || null;
      const resolvedPlatformId = c.platform_id || (c.platform_name?.trim() ? platformMap.get(normalizeLookupKey(c.platform_name)) : null) || null;
      const resolvedCompanyId = c.targeted_company || (c.targeted_company_name?.trim() ? companyMap.get(normalizeLookupKey(c.targeted_company_name)) : null) || null;

      const mergedLevels = [
        ...(c.candidate_levels || []),
        ...(c.candidate_levels_name || []).map((n) => levelMap.get(normalizeLookupKey(n))).filter(Boolean) as number[],
      ];

      const candidateEmail = c.candidate_email?.trim() || null;

      let existingCandidate: any = null;

      if (candidateEmail) {
        const emailRes = await pool.query(
          `SELECT candidate_id FROM candidate WHERE LOWER(TRIM(candidate_email)) = $1 LIMIT 1`,
          [normalizeLookupKey(candidateEmail)]
        );
        if (emailRes.rows.length > 0) {
          existingCandidate = emailRes.rows[0];
        }
      }

      const candidateData = {
        candidate_name: c.candidate_name,
        candidate_phone: c.candidate_phone || null,
        agency: c.agency || null,
        offer_date: c.offer_date || null,
        onboard_date: c.onboard_date || null,
        expected_onboard_date: c.expected_onboard_date || null,
        feedback_date: c.feedback_date || null,
        current_salary: c.current_salary || null,
        expected_salary: c.expected_salary || null,
        status: c.status,
        note: c.note || null,
        job_id: resolvedJobId,
        reference: resolvedReferenceId,
        platform_id: resolvedPlatformId,
        targeted_company: resolvedCompanyId,
        candidate_levels: Array.from(new Set(mergedLevels)),
      };

      if (existingCandidate) {
        await update(
          Number(existingCandidate.candidate_id),
          {
            ...candidateData,
            candidate_email: candidateEmail || undefined,
          },
          pool
        );
      } else {
        await create(
          {
            ...candidateData,
            candidate_email: candidateEmail,
          },
          pool
        );
      }

      await pool.query("RELEASE SAVEPOINT import_candidate_savepoint");
      importedCount++;
    } catch (err: any) {
      await pool.query("ROLLBACK TO SAVEPOINT import_candidate_savepoint");
      errors.push({
        row_index: c.row_index ?? null,
        candidate_name: c.candidate_name || "Unknown Candidate",
        candidate_email: c.candidate_email || null,
        message: err.message || "Unknown error during candidate creation",
      });
    }
  }

  return {
    success: errors.length === 0,
    importedCount,
    errors,
  };
}
