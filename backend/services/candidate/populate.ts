import { PoolClient } from "pg";

export async function populateCandidateRelations(candidateRow: any, pool: PoolClient) {
  if (!candidateRow) return null;

  const {
    candidate_id,
    platform_id,
    recruiter,
    job_id,
    targeted_company,
    reference,
    file_id
  } = candidateRow;

  const queries = [
    platform_id ? pool.query("SELECT platform_id, platform_name, platform_description FROM platform WHERE platform_id = $1", [platform_id]) : Promise.resolve(null),
    recruiter ? pool.query('SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at FROM "user" WHERE user_id = $1', [recruiter]) : Promise.resolve(null),
    job_id ? pool.query("SELECT job_id, job_code, project, note, file_id, create_at, update_at FROM job WHERE job_id = $1", [job_id]) : Promise.resolve(null),
    targeted_company ? pool.query("SELECT company_id, company_name, company_description FROM company WHERE company_id = $1", [targeted_company]) : Promise.resolve(null),
    reference ? pool.query('SELECT user_id, user_name, user_description, user_role, department_id, create_at, update_at FROM "user" WHERE user_id = $1', [reference]) : Promise.resolve(null),
    file_id ? pool.query("SELECT file_id, file_path FROM file WHERE file_id = $1", [file_id]) : Promise.resolve(null),
    candidate_id ? pool.query("SELECT l.level_id, l.level_code, l.level_name, l.level_description, l.create_at, l.update_at FROM candidate_level cl JOIN level l ON cl.level_id = l.level_id WHERE cl.candidate_id = $1", [candidate_id]) : Promise.resolve(null)
  ];

  const [
    platformRes,
    recruiterRes,
    jobRes,
    companyRes,
    referenceRes,
    fileRes,
    candidateLevelsRes
  ] = await Promise.all(queries);

  const fileData = fileRes && fileRes.rows.length > 0 ? {
    file_id: fileRes.rows[0].file_id,
    file_path: fileRes.rows[0].file_path,
    file_url: `${process.env.HOST}/file/${fileRes.rows[0].file_path}`
  } : null;

  // Destructure out the raw ID foreign key columns to return a clean populated response
  const {
    platform_id: _p,
    recruiter: _r,
    job_id: _j,
    targeted_company: _tc,
    reference: _ref,
    file_id: _f,
    ...rest
  } = candidateRow;

  return {
    ...rest,
    platform: platformRes && platformRes.rows.length > 0 ? platformRes.rows[0] : null,
    recruiter: recruiterRes && recruiterRes.rows.length > 0 ? recruiterRes.rows[0] : null,
    job: jobRes && jobRes.rows.length > 0 ? jobRes.rows[0] : null,
    targeted_company: companyRes && companyRes.rows.length > 0 ? companyRes.rows[0] : null,
    reference: referenceRes && referenceRes.rows.length > 0 ? referenceRes.rows[0] : null,
    file: fileData,
    candidate_levels: candidateLevelsRes && candidateLevelsRes.rows.length > 0 ? candidateLevelsRes.rows : []
  };
}

export async function populateCandidateList(rows: any[], pool: PoolClient) {
  return await Promise.all(rows.map(row => populateCandidateRelations(row, pool)));
}
