CREATE TABLE candidate (
    candidate_id SERIAL PRIMARY KEY,
    candidate_code VARCHAR(255) NOT NULL,
    CONSTRAINT candidate_candidate_code_not_blank CHECK (TRIM(candidate_code) <> ''),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    CONSTRAINT candidate_candidate_email_not_blank CHECK (candidate_email IS NULL OR TRIM(candidate_email) <> ''),
    candidate_phone VARCHAR(50),
    agency VARCHAR(255),
    status VARCHAR(100) NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    candidate_detail_id INT,
    platform_id INT,
    job_id INT,
    targeted_company INT,
    reference INT,
    file_id INT,
    FOREIGN KEY (candidate_detail_id) REFERENCES candidate_detail(candidate_detail_id) ON DELETE SET NULL,
    FOREIGN KEY (platform_id) REFERENCES platform(platform_id) ON DELETE SET NULL,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE SET NULL,
    FOREIGN KEY (targeted_company) REFERENCES company(company_id) ON DELETE SET NULL,
    FOREIGN KEY (reference) REFERENCES "user"(user_id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES file(file_id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION get_next_candidate_code()
RETURNS VARCHAR AS $$
DECLARE
    next_number INT;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('candidate_candidate_code'));

    SELECT COALESCE(MAX(SUBSTRING(candidate_code FROM 2)::INT), 0) + 1
    INTO next_number
    FROM candidate
    WHERE candidate_code ~* '^V[0-9]+$';

    RETURN 'V' || LPAD(next_number::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_default_candidate_code_and_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.candidate_code IS NULL OR TRIM(NEW.candidate_code) = '' THEN
        NEW.candidate_code = get_next_candidate_code();
    ELSE
        NEW.candidate_code = TRIM(NEW.candidate_code);
    END IF;

    IF NEW.candidate_email IS NOT NULL THEN
        NEW.candidate_email = LOWER(NULLIF(TRIM(NEW.candidate_email), ''));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE UNIQUE INDEX candidate_candidate_code_unique_idx ON candidate (LOWER(TRIM(candidate_code)));
CREATE UNIQUE INDEX candidate_candidate_email_unique_idx ON candidate (LOWER(TRIM(candidate_email))) WHERE candidate_email IS NOT NULL;

CREATE TRIGGER set_default_candidate_code_and_email_before_insert_or_update
BEFORE INSERT OR UPDATE OF candidate_code, candidate_email ON candidate
FOR EACH ROW
EXECUTE FUNCTION set_default_candidate_code_and_email();

CREATE TRIGGER set_updated_at_candidate
BEFORE UPDATE ON candidate
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
