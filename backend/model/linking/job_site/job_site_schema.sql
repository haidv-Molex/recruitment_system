CREATE TABLE job_site (
    job_id INT NOT NULL,
    site_id INT NOT NULL,
    PRIMARY KEY (job_id, site_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES site(site_id) ON DELETE CASCADE
);

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON job_site
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

