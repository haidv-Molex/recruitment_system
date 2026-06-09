CREATE TABLE candidate (
    candidate_id SERIAL PRIMARY KEY,
    candidate_code VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_phone VARCHAR(50) NOT NULL,
    agency VARCHAR(255),
    offer_date DATE NOT NULL,
    onboard_date DATE NOT NULL,
    feedback_date DATE NOT NULL,
    current_salary VARCHAR(255) NOT NULL,
    expected_salary VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source INT NOT NULL,
    recruiter INT NOT NULL,
    job_id INT NOT NULL,
    targeted_company INT,
    reference INT,
    file_id INT,
    FOREIGN KEY (source) REFERENCES platform(platform_id),
    FOREIGN KEY (recruiter) REFERENCES "user"(user_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id),
    FOREIGN KEY (targeted_company) REFERENCES company(company_id),
    FOREIGN KEY (reference) REFERENCES "user"(user_id),
    FOREIGN KEY (file_id) REFERENCES file(file_id)
);

CREATE TRIGGER set_updated_at_candidate
BEFORE UPDATE ON candidate
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
