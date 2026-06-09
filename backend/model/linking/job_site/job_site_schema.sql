CREATE TABLE job_site (
    job_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (job_id, site_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id),
    FOREIGN KEY (site_id) REFERENCES site(site_id)
);
