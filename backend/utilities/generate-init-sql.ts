#!/usr/bin/env ts-node
/**
 * Tự động gom + sắp xếp .sql theo FOREIGN KEY
 * Dùng Node.js + TypeScript → Không cần Python
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { fileURLToPath } from 'url';

// === CẤU HÌNH ===
const MODEL_ROOT = "./model";
const INIT_DIR = resolve("./init-db");

// === INIT SCRIPT ===
const INIT_SQL = `-- INIT: Extensions + Functions
-- Chạy trước mọi bảng

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT unaccent($1);
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id INT;
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    pk_keys JSONB := '{}'::JSONB;
    tbl_name TEXT := TG_TABLE_NAME;
    act TEXT := TG_OP;
    row_val JSONB;
BEGIN
    -- Lấy thông tin user từ session context
    BEGIN
        current_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INT;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    -- Xác định dữ liệu cũ/mới dựa trên hành động
    IF (TG_OP = 'DELETE') THEN
        row_val := to_jsonb(OLD);
        old_val := row_val;
        IF (tbl_name = 'user') THEN
            old_val := old_val - 'user_password' - 'user_account';
        END IF;
    ELSE
        row_val := to_jsonb(NEW);
        new_val := row_val;
        IF (TG_OP = 'UPDATE') THEN
            old_val := to_jsonb(OLD);
            IF (tbl_name = 'user') THEN
                old_val := old_val - 'user_password' - 'user_account';
                new_val := new_val - 'user_password' - 'user_account';
            END IF;
        ELSE
            IF (tbl_name = 'user') THEN
                new_val := new_val - 'user_password' - 'user_account';
            END IF;
        END IF;
    END IF;

    -- Tự động trích xuất khóa chính của bảng (hỗ trợ cả composite key)
    CASE tbl_name
        -- Các bảng có khóa chính đơn
        WHEN 'company' THEN pk_keys := jsonb_build_object('company_id', row_val->'company_id');
        WHEN 'file' THEN pk_keys := jsonb_build_object('file_id', row_val->'file_id');
        WHEN 'level' THEN pk_keys := jsonb_build_object('level_id', row_val->'level_id');
        WHEN 'platform' THEN pk_keys := jsonb_build_object('platform_id', row_val->'platform_id');
        WHEN 'segment' THEN pk_keys := jsonb_build_object('segment_id', row_val->'segment_id');
        WHEN 'site' THEN pk_keys := jsonb_build_object('site_id', row_val->'site_id');
        WHEN 'user' THEN pk_keys := jsonb_build_object('user_id', row_val->'user_id');
        WHEN 'department' THEN pk_keys := jsonb_build_object('department_id', row_val->'department_id');
        WHEN 'job' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id');
        WHEN 'candidate' THEN pk_keys := jsonb_build_object('candidate_id', row_val->'candidate_id');
        WHEN 'access' THEN pk_keys := jsonb_build_object('access_id', row_val->'access_id');
        WHEN 'note' THEN pk_keys := jsonb_build_object('note_id', row_val->'note_id');
        
        -- Các bảng liên kết trung gian (Composite Primary Keys)
        WHEN 'employee_level' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id', 'level_id', row_val->'level_id');
        WHEN 'hiring_manager' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id', 'user_id', row_val->'user_id');
        WHEN 'job_department' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id', 'department_id', row_val->'department_id');
        WHEN 'job_segment' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id', 'segment_id', row_val->'segment_id');
        WHEN 'job_site' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id', 'site_id', row_val->'site_id');
        WHEN 'job_title' THEN pk_keys := jsonb_build_object('job_id', row_val->'job_id', 'level_id', row_val->'level_id');
        WHEN 'candidate_level' THEN pk_keys := jsonb_build_object('candidate_id', row_val->'candidate_id', 'level_id', row_val->'level_id');
        ELSE pk_keys := '{}'::JSONB;
    END CASE;

    -- Ghi log
    INSERT INTO audit_log (table_name, action, record_keys, old_data, new_data, changed_by)
    VALUES (tbl_name, act, pk_keys, old_val, new_val, current_user_id);

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
`;

// === BIỂU THỨC ===
const FK_PATTERN = /FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+(?:"([^"]+)"|(\w+))/gi;

// === HÀM ===
interface Graph {
    [parent: string]: Set<string>;
}

interface TableFile {
    [table: string]: string;
}

function extractTableName(sql: string): string | null {
    const match = sql.match(/CREATE\s+TABLE\s+(?:"([^"]+)"|(\w+))/i);
    return match ? (match[1] || match[2]).toLowerCase() : null;
}

function extractReferences(sql: string): string[] {
    return [...sql.matchAll(FK_PATTERN)].map(m => (m[1] || m[2]).toLowerCase());
}

function buildDependencyGraph(sqlFiles: string[]): { graph: Graph; tableToFile: TableFile } {
    const graph: Graph = {};
    const tableToFile: TableFile = {};

    for (const filePath of sqlFiles) {
        const sql = readFileSync(filePath, 'utf-8');
        const table = extractTableName(sql);
        if (!table) continue;

        tableToFile[table] = filePath;
        const refs = extractReferences(sql);

        for (const ref of refs) {
            if (!graph[ref]) graph[ref] = new Set();
            graph[ref].add(table); // ref → table (cha → con)
        }
    }

    return { graph, tableToFile };
}

function topologicalSort(graph: Graph, allTables: string[]): string[] {
    const indegree: { [key: string]: number } = {};
    for (const node of allTables) indegree[node] = 0;
    for (const children of Object.values(graph)) {
        for (const child of children) indegree[child]++;
    }

    const queue: string[] = allTables.filter(node => indegree[node] === 0);
    const order: string[] = [];

    while (queue.length > 0) {
        const node = queue.shift()!;
        order.push(node);
        const children = graph[node] || new Set();
        for (const child of children) {
            indegree[child]--;
            if (indegree[child] === 0) queue.push(child);
        }
    }

    if (order.length !== allTables.length) {
        throw new Error("Có vòng phụ thuộc (circular dependency)!");
    }

    return order;
}

function getSqlFiles(dir: string): string[] {
    let results: string[] = [];
    const list = readdirSync(dir);
    list.forEach(file => {
        const fullPath = resolve(dir, file);
        const stat = statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getSqlFiles(fullPath));
        } else if (file.endsWith('.sql')) {
            results.push(fullPath);
        }
    });
    return results;
}

// === MAIN ===
function main() {
    console.log("Đang tìm tất cả .sql trong Model...");
    const sqlFiles = getSqlFiles(MODEL_ROOT);

    console.log(`Tìm thấy ${sqlFiles.length} file SQL`);

    // Lấy bảng
    const allTables = new Set<string>();
    const tableToFile: TableFile = {};

    for (const file of sqlFiles) {
        const sql = readFileSync(file, 'utf-8');
        const table = extractTableName(sql);
        if (table) {
            allTables.add(table);
            tableToFile[table] = file;
        }
    }

    // Xóa init-db cũ
    if (require('fs').existsSync(INIT_DIR)) {
        rmSync(INIT_DIR, { recursive: true, force: true });
    }
    mkdirSync(INIT_DIR, { recursive: true });

    // 1. 000-init.sql
    writeFileSync(`${INIT_DIR}/000-init.sql`, INIT_SQL);
    console.log("000 → init.sql");

    // 2. Sắp xếp bảng
    let orderedTables: string[] = [];
    if (allTables.size > 0) {
        const { graph } = buildDependencyGraph(sqlFiles);
        try {
            orderedTables = topologicalSort(graph, Array.from(allTables));
        } catch (e: any) {
            console.error("Lỗi:", e.message);
            process.exit(1);
        }
    }

    // 3. Tạo file bảng
    for (let i = 0; i < orderedTables.length; i++) {
        const table = orderedTables[i];
        const srcFile = tableToFile[table];
        const padded = String(i + 1).padStart(3, '0');
        const destName = `${padded}-${basename(srcFile)}`;
        const destPath = `${INIT_DIR}/${destName}`;

        const content = readFileSync(srcFile, 'utf-8');
        const header = `-- SOURCE: ${srcFile}\n-- TABLE: ${table}\n\n`;
        writeFileSync(destPath, header + content);
        console.log(`${padded} → ${table} (${basename(srcFile)})`);
    }

    // 4. 999-seed-data.sql
    const seedSQL = `-- SEED: Dữ liệu mặc định
INSERT INTO "user" (user_name, user_account, user_password, user_role)
VALUES ('Admin', 'Admin', '$2b$10$nNypYH8ZYca/XbrsYVMFWuE25u7zOxA9LRiYYNujEGvo73Xg2QJPi', 'admin');

INSERT INTO department (department_code, department_name) VALUES
('CA', 'CA'),
('OTC', 'OTC'),
('BOD', 'BOD'),
('FM/EHS', 'FM/EHS'),
('GA', 'GA'),
('HR', 'HR'),
('LOG', 'LOG'),
('ME', 'ME'),
('PC', 'PC'),
('PUR', 'PUR'),
('QC', 'QC'),
('SC', 'SC'),
('AS', 'AS'),
('MD', 'MD'),
('PLT', 'PLT'),
('STP', 'STP');

INSERT INTO platform (platform_name) VALUES
('Linkedin Job Post'),
('Linkedin Search'),
('Vietnamworks Job Post'),
('Vietnamworks Search'),
('TopCV Job Post'),
('TopCV Search'),
('Headhunt'),
('Internal referral'),
('Internal transfer'),
('Facebook'),
('Network'),
('Others');

INSERT INTO level (level_code, level_name) VALUES
('Manager', 'Manager'),
('Supervisor', 'Supervisor'),
('Engineer', 'Engineer'),
('Professional', 'Professional'),
('Technician', 'Technician'),
('Technical Operator', 'Technical Operator'),
('Operator', 'Operator'),
('Leader', 'Leader'),
('Intern', 'Intern');

INSERT INTO site (site_code, site_name) VALUES
('D', 'D'),
('S', 'S'),
('SK', 'SK'),
('MXV', 'MXV');
`;
    writeFileSync(`${INIT_DIR}/999-seed-default-data.sql`, seedSQL);
    console.log("999 → seed-default-data.sql");

    console.log(`\nHOÀN TẤT! File sẵn sàng trong: ${INIT_DIR}`);
}

main();