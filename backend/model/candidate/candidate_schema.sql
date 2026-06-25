CREATE TABLE candidate (
    candidate_id SERIAL PRIMARY KEY,
    candidate_code VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255),
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(50),
    agency VARCHAR(255),
    offer_date DATE,
    onboard_date DATE,
    expected_onboard_date DATE,
    feedback_date DATE,
    current_salary VARCHAR(255),
    expected_salary VARCHAR(255),
    status VARCHAR(100) NOT NULL,
    note TEXT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    platform_id INT,
    job_id INT,
    targeted_company INT,
    reference INT,
    file_id INT,
    FOREIGN KEY (platform_id) REFERENCES platform(platform_id) ON DELETE SET NULL,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE SET NULL,
    FOREIGN KEY (targeted_company) REFERENCES company(company_id) ON DELETE SET NULL,
    FOREIGN KEY (reference) REFERENCES "user"(user_id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES file(file_id) ON DELETE SET NULL,
    CONSTRAINT candidate_email_or_phone_required CHECK (candidate_email IS NOT NULL OR candidate_phone IS NOT NULL)
);

CREATE TRIGGER set_updated_at_candidate
BEFORE UPDATE ON candidate
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON candidate
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE OR REPLACE FUNCTION set_default_candidate_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.candidate_id IS NULL THEN
        NEW.candidate_id = nextval(pg_get_serial_sequence('candidate', 'candidate_id'));
    END IF;

    NEW.candidate_code = 'C' || LPAD(NEW.candidate_id::TEXT, GREATEST(5, LENGTH(NEW.candidate_id::TEXT)), '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE UNIQUE INDEX candidate_candidate_code_unique_idx ON candidate (LOWER(TRIM(candidate_code)));

CREATE UNIQUE INDEX candidate_candidate_email_unique_idx ON candidate (LOWER(TRIM(candidate_email))) WHERE candidate_email IS NOT NULL;

CREATE TRIGGER set_default_candidate_code_before_insert
BEFORE INSERT OR UPDATE ON candidate
FOR EACH ROW
EXECUTE FUNCTION set_default_candidate_code();

