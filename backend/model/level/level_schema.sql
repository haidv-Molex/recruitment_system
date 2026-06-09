CREATE TABLE level (
    level_id SERIAL PRIMARY KEY,
    level_code VARCHAR(255),
    level_name VARCHAR(255) NOT NULL,
    level_description VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
