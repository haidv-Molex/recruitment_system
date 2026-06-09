CREATE TABLE job_department (
    job_id INT NOT NULL,
    department_id INT NOT NULL,
    PRIMARY KEY (job_id, department_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id),
    FOREIGN KEY (department_id) REFERENCES department(department_id)
);
