CREATE TABLE candidate_detail (
    candidate_detail_id        SERIAL PRIMARY KEY,
    summary                    TEXT,

    -- ===== Thông tin cá nhân =====
    date_of_birth              DATE,
    gender                     VARCHAR(20) CHECK (gender IS NULL OR gender IN ('male', 'female')),
    marital_status             VARCHAR(20) CHECK (marital_status IS NULL OR marital_status IN ('single', 'married')),
    nationality                VARCHAR(100),
    location                   VARCHAR(255),                -- Thành phố / tỉnh

    -- ===== Liên kết & kỹ năng =====
    links                      TEXT[]       NOT NULL DEFAULT '{}',
    skills                     TEXT[]       NOT NULL DEFAULT '{}',

    -- ===== Ngôn ngữ =====
    languages                  TEXT[]       NOT NULL DEFAULT '{}',
    language_details           JSONB        NOT NULL DEFAULT '[]'::jsonb,  -- [{language, level, certificate}]
    -- ===== Học vấn =====
    education                  TEXT,
    education_details          JSONB        NOT NULL DEFAULT '[]'::jsonb,

    -- ===== Kinh nghiệm hiện tại =====
    experience_years           VARCHAR(50),
    current_position           VARCHAR(255),
    current_level              VARCHAR(100),                -- 'Intern' | 'Junior' | 'Senior' | 'Manager' | ...
    current_salary             NUMERIC(15,2),
    last_company               VARCHAR(255),
    work_experience            TEXT,
    work_experience_details    JSONB        NOT NULL DEFAULT '[]'::jsonb,
    certifications             TEXT[]       NOT NULL DEFAULT '{}',

    -- ===== Mong muốn công việc =====
    expected_position          VARCHAR(255),
    expected_level             VARCHAR(100),
    expected_salary            NUMERIC(15,2),
    expected_work_location     VARCHAR(255),
    

    -- ===== Quy trình tuyển dụng =====
    offer_date                 DATE,                        -- Ngày gửi/nhận offer
    expected_onboard_date      DATE,                        -- Ngày dự kiến onboard
    onboard_date               DATE,                        -- Ngày onboard thực tế
    feedback_date              DATE,                        -- Ngày feedback (thử việc / phỏng vấn)

    ----- ===== Thông tin khác =====
    salary_currency           VARCHAR(10)  NOT NULL DEFAULT 'VND',

    -- ===== Metadata =====
    create_at                  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at                  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_updated_at_candidate_detail
BEFORE UPDATE ON candidate_detail
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();