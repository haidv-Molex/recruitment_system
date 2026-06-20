CREATE TABLE platform (
    platform_id SERIAL PRIMARY KEY,
    platform_code VARCHAR(255),
    platform_name VARCHAR(255) NOT NULL,
    platform_description VARCHAR(255)
);

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON platform
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

