CREATE TABLE candidate_note (
    candidate_id INT NOT NULL,
    note_id INT NOT NULL,
    PRIMARY KEY (candidate_id, note_id),
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES note(note_id) ON DELETE CASCADE
);

CREATE INDEX candidate_note_note_id_idx ON candidate_note(note_id);