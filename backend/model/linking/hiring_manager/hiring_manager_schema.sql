CREATE TABLE hiring_manager (
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (job_id, user_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON hiring_manager
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

