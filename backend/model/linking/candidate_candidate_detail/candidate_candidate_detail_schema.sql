CREATE TABLE candidate_candidate_detail (
    candidate_id INT NOT NULL,
    candidate_detail_id INT NOT NULL,
    PRIMARY KEY (candidate_id, candidate_detail_id),
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_detail_id) REFERENCES candidate_detail(candidate_detail_id) ON DELETE CASCADE
)