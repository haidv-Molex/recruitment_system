CREATE TABLE job_segment (
    job_id INT NOT NULL,
    segment_id INT NOT NULL,
    PRIMARY KEY (job_id, segment_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES segment(segment_id) ON DELETE CASCADE
);

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON job_segment
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

