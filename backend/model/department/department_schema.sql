CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(255) NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    department_description VARCHAR(255),
    user_id INTEGER,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE SET NULL
);

CREATE TRIGGER set_updated_at_department
BEFORE UPDATE ON department
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON department
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

