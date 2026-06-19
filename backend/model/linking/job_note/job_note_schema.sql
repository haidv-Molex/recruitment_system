CREATE TABLE job_note (
    job_id INT NOT NULL,
    note_id INT NOT NULL,
    PRIMARY KEY (job_id, note_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES note(note_id) ON DELETE CASCADE
);

CREATE INDEX job_note_note_id_idx ON job_note(note_id);