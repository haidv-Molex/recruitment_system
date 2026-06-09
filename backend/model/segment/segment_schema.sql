CREATE TABLE segment (
    segment_id SERIAL PRIMARY KEY,
    segment_code VARCHAR(255),
    segment_name VARCHAR(255) NOT NULL,
    segment_description VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_updated_at_segment
BEFORE UPDATE ON segment
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
