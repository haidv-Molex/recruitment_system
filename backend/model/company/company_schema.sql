CREATE TABLE company (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_description VARCHAR(255)
);

CREATE TRIGGER audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON company
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

