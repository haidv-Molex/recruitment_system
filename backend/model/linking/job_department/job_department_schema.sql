CREATE TABLE job_department (
    job_id INT NOT NULL,
    department_id INT NOT NULL,
    candidate_required INT NOT NULL DEFAULT 1,
    user_id INT,
    PRIMARY KEY (job_id, department_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES department(department_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE SET NULL
);
