CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(255) NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    department_description VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_updated_at_department
BEFORE UPDATE ON department
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
