CREATE TABLE job_department (
    job_id INT NOT NULL,
    department_id INT NOT NULL,
    candidate_required INT NOT NULL DEFAULT 1,
    PRIMARY KEY (job_id, department_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE CASCADE
);
