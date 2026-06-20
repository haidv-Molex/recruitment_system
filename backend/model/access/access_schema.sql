-- Create app_user role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'Haidv2806';
    END IF;
END
$$;

ALTER ROLE app_user SET search_path TO public;

CREATE TABLE access (
    access_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    candidate_id INT,
    job_id INT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    CONSTRAINT chk_access_target CHECK (
        (candidate_id IS NOT NULL AND job_id IS NULL) OR
        (candidate_id IS NULL AND job_id IS NOT NULL)
    )
);

CREATE TRIGGER set_updated_at_access
BEFORE UPDATE ON access
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON access
FOR EACH ROW EXECUTE FUNCTION process_audit_log();


-- Grant privileges to app_user
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;

-- Kích hoạt RLS
ALTER TABLE job ENABLE ROW LEVEL SECURITY;
ALTER TABLE job FORCE ROW LEVEL SECURITY;

ALTER TABLE candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate FORCE ROW LEVEL SECURITY;

-- Policy cho job
DROP POLICY IF EXISTS job_access_policy ON job;
CREATE POLICY job_access_policy ON job
FOR ALL
USING (
    NULLIF(current_setting('app.current_user_role', true), '') = 'admin'
    OR NOT EXISTS (SELECT 1 FROM access WHERE access.job_id = job.job_id)
    OR EXISTS (
        SELECT 1 FROM access 
        WHERE access.job_id = job.job_id 
          AND access.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
    )
);

-- Policy cho candidate
DROP POLICY IF EXISTS candidate_access_policy ON candidate;
CREATE POLICY candidate_access_policy ON candidate
FOR ALL
USING (
    NULLIF(current_setting('app.current_user_role', true), '') = 'admin'
    OR (
        NOT EXISTS (SELECT 1 FROM access WHERE access.candidate_id = candidate.candidate_id)
        AND (
            candidate.job_id IS NULL 
            OR EXISTS (SELECT 1 FROM job WHERE job.job_id = candidate.job_id)
        )
    )
    OR EXISTS (
        SELECT 1 FROM access 
        WHERE access.candidate_id = candidate.candidate_id 
          AND access.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
    )
);
