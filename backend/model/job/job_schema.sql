CREATE TABLE job (
    job_id SERIAL PRIMARY KEY,
    job_code VARCHAR(255) NOT NULL,
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

CREATE TRIGGER set_updated_at_job
BEFORE UPDATE ON job
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();