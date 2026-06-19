CREATE TABLE job (
    job_id SERIAL PRIMARY KEY,
    job_code VARCHAR(255) NOT NULL,
    CONSTRAINT job_job_code_not_blank CHECK (TRIM(job_code) <> ''),
    project VARCHAR(255) NOT NULL,
    note TEXT,
    request_date DATE,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_id INT,
    recruiter_id INT,
    FOREIGN KEY (file_id) REFERENCES file(file_id),
    FOREIGN KEY (recruiter_id) REFERENCES "user"(user_id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION set_default_job_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_code IS NULL OR TRIM(NEW.job_code) = '' THEN
        IF NEW.job_id IS NULL THEN
            NEW.job_id = nextval(pg_get_serial_sequence('job', 'job_id'));
        END IF;
        NEW.job_code = 'J' || LPAD(NEW.job_id::TEXT, GREATEST(3, LENGTH(NEW.job_id::TEXT)), '0');
    ELSE
        NEW.job_code = TRIM(NEW.job_code);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE UNIQUE INDEX job_job_code_unique_idx ON job (LOWER(TRIM(job_code)));

CREATE TRIGGER set_default_job_code_before_insert
BEFORE INSERT ON job
FOR EACH ROW
EXECUTE FUNCTION set_default_job_code();

CREATE TRIGGER set_updated_at_job
BEFORE UPDATE ON job
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();