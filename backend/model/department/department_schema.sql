CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(255) NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    department_description VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
