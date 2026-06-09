CREATE TABLE site (
    site_id SERIAL PRIMARY KEY,
    site_code VARCHAR(255),
    site_name VARCHAR(255) NOT NULL,
    site_description VARCHAR(255),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_updated_at_site
BEFORE UPDATE ON site
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
