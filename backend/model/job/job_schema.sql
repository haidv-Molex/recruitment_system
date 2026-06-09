CREATE TABLE job (
    job_id SERIAL PRIMARY KEY,
    job_code VARCHAR(255) NOT NULL,
    project VARCHAR(255) NOT NULL,
    candidate_required INT NOT NULL,
    note TEXT,
    expected_onboard_date DATE NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_id INT,
    FOREIGN KEY (file_id) REFERENCES file(id)
);

CREATE TRIGGER set_updated_at_job
BEFORE UPDATE ON job
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();