CREATE TABLE note (
    note_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_id INT,
    candidate_id INT,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE SET NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id) ON DELETE CASCADE
);

CREATE TRIGGER set_updated_at_note
BEFORE UPDATE ON note
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON note
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

