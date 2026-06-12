CREATE TABLE candidate_level (
    candidate_id INT NOT NULL,
    level_id INT NOT NULL,
    PRIMARY KEY (candidate_id, level_id),
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES level(level_id) ON DELETE CASCADE
);
