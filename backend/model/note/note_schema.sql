CREATE TABLE note (
    note_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    CONSTRAINT note_message_not_blank CHECK (TRIM(message) <> ''),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE INDEX note_user_id_idx ON note(user_id);

CREATE TRIGGER set_updated_at_note
BEFORE UPDATE ON note
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();