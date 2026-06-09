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