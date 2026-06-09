CREATE TABLE site (
    site_id SERIAL PRIMARY KEY,
    site_code VARCHAR(255),
    site_name VARCHAR(255) NOT NULL,
    site_description VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
