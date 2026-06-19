CREATE TABLE platform (
    platform_id SERIAL PRIMARY KEY,
    platform_code VARCHAR(255),
    platform_name VARCHAR(255) NOT NULL,
    platform_description VARCHAR(255)
);
