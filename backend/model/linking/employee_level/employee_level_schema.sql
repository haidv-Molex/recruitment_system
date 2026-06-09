CREATE TABLE employee_level (
    job_id INT NOT NULL,
    level_id INT NOT NULL,
    PRIMARY KEY (job_id, level_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id),
    FOREIGN KEY (level_id) REFERENCES level(level_id)
);
