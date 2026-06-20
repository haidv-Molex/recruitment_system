CREATE TABLE audit_log (
    audit_log_id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    action VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_keys JSONB NOT NULL,  -- Lưu trữ khóa chính (hỗ trợ cả khóa đơn và khóa composite)
    old_data JSONB,              -- Trạng thái cũ (NULL nếu INSERT)
    new_data JSONB,              -- Trạng thái mới (NULL nếu DELETE)
    changed_by INT,              -- Người thực hiện thay đổi
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_id BIGINT DEFAULT txid_current(), -- Nhóm các hành động trong cùng một transaction
    FOREIGN KEY (changed_by) REFERENCES "user"(user_id) ON DELETE SET NULL
);

