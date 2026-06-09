CREATE TABLE job_business_partner (
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (job_id, user_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id),
    FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);
