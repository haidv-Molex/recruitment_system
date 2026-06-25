CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    user_code VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_account VARCHAR(255),
    user_password VARCHAR(255),
    user_description VARCHAR(255),
    user_role VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_updated_at_user
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON "user"
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

