-- ============================================================================
-- CLO SYSTEM — Course-Level Learning Outcome Assessment & Tracking Platform
-- Enterprise Database Schema (PostgreSQL 14+)
--
-- Derived from: หลักสูตรครุศาสตรอุตสาหกรรมบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์
--               (ค.อ.บ. เทคโนโลยีคอมพิวเตอร์), หลักสูตรปรับปรุง พ.ศ. 2567
--               สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)
--
-- ============================================================================
-- THIS FILE IS NOT THE APPLICATION'S DDL. It is a document-modelling artifact:
-- a full institutional schema derived from the printed curriculum, kept for
-- reference and for the eventual faculty/department/program hierarchy.
--
-- The app's schema is `database/schema.prisma`, applied via
-- `database/migrations/`. Naming differs ON PURPOSE — do not "fix" the
-- divergence:
--
--     this file          app schema
--     ---------          ----------
--     name_th            name        (unqualified = Thai; the UI is Thai-only
--                                     per SRS OI-07, so the column every query
--                                     sorts and searches carries no suffix)
--     name_en            nameEn      (nullable in the app: a course opened
--                                     mid-term has no approved English name.
--                                     NOT NULL here is correct only because
--                                     every row here is transcribed from a
--                                     bilingual PDF)
--
-- SCOPE ALSO DIFFERS, and as of 2026-08-04 it differs a lot more than it used
-- to. This file models the full institutional hierarchy
-- (institutions -> faculties -> departments -> programs -> curriculum
-- versions -> courses). The APP no longer has any of those levels: task 2.7
-- made it SINGLE-TENANT and deleted Institution, Membership, Curriculum and
-- CurriculumCourse outright. The app's hierarchy now starts and ends at
-- `Course` — 11 tables.
--
-- That is not drift to be reconciled. This file is the reference model for the
-- day PLO / มคอ.2 mapping comes into scope; the app schema is what v1 actually
-- implements. Adding these levels back is NOT purely additive any more: it
-- means creating the parent tables and BACKFILLING a program key onto every
-- existing Course row. Recorded as known technical debt in
-- mysql/cmas_app_production_v3.sql.
-- ============================================================================
--
-- Design notes:
--  - All primary keys are BIGSERIAL for simplicity; swap for UUID if the
--    system needs to merge data across multiple institutions/DBs.
--  - Thai (_th) and English (_en) name columns are kept side by side
--    throughout, matching how the source curriculum document is bilingual.
--  - CLO -> PLO mapping uses an "I/R/M" (Introduced/Reinforced/Mastered)
--    strength scale (1/2/3), the standard OBE/AUN-QA convention.
--  - Course codes follow the 8-digit KMITL scheme documented in the PDF
--    (digits 1-2 = faculty, 3-4 = subject group, 5 = degree level,
--    6-8 = sequence) — captured in courses.course_code plus a parsed
--    reference table (course_code_segments) for reporting.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 0: EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid() if needed later

-- ----------------------------------------------------------------------------
-- SECTION 1: INSTITUTIONAL HIERARCHY
-- ----------------------------------------------------------------------------
CREATE TABLE institutions (
    institution_id      BIGSERIAL PRIMARY KEY,
    name_th              TEXT NOT NULL,
    name_en              TEXT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faculties (
    faculty_id           BIGSERIAL PRIMARY KEY,
    institution_id       BIGINT NOT NULL REFERENCES institutions(institution_id),
    name_th              TEXT NOT NULL,
    name_en              TEXT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_faculties_institution ON faculties(institution_id);

CREATE TABLE departments (
    department_id        BIGSERIAL PRIMARY KEY,
    faculty_id           BIGINT NOT NULL REFERENCES faculties(faculty_id),
    name_th              TEXT NOT NULL,
    name_en              TEXT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_departments_faculty ON departments(faculty_id);

-- ----------------------------------------------------------------------------
-- SECTION 2: PROGRAM & CURRICULUM VERSIONING
-- ----------------------------------------------------------------------------
CREATE TABLE programs (
    program_id            BIGSERIAL PRIMARY KEY,
    department_id         BIGINT NOT NULL REFERENCES departments(department_id),
    name_th                TEXT NOT NULL,                 -- e.g. ครุศาสตรอุตสาหกรรมบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์
    name_en                TEXT NOT NULL,                 -- e.g. Bachelor of Science in Industrial Education Program in Computer Technology
    degree_full_th         TEXT NOT NULL,                 -- ครุศาสตรอุตสาหกรรมบัณฑิต (เทคโนโลยีคอมพิวเตอร์)
    degree_full_en         TEXT NOT NULL,                 -- Bachelor of Science in Industrial Education (Computer Technology)
    degree_short_th        TEXT NOT NULL,                 -- ค.อ.บ. (เทคโนโลยีคอมพิวเตอร์)
    degree_short_en        TEXT NOT NULL,                 -- B.S.Ind.Ed. (Computer Technology)
    major_track             TEXT,                          -- วิชาเอก/ความเชี่ยวชาญเฉพาะ, NULL if "ไม่มี"
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_programs_department ON programs(department_id);

CREATE TABLE curriculum_versions (
    curriculum_version_id   BIGSERIAL PRIMARY KEY,
    program_id               BIGINT NOT NULL REFERENCES programs(program_id),
    curriculum_code          VARCHAR(13),                  -- 13-digit สกอ. code, once assigned
    revision_label_th        TEXT NOT NULL,                 -- "หลักสูตรปรับปรุง พ.ศ. 2567"
    revision_year_be         INT NOT NULL,                  -- 2567
    revision_year_ce         INT NOT NULL,                  -- 2024
    total_credits            NUMERIC(5,1) NOT NULL,          -- 132
    duration_years           NUMERIC(3,1) NOT NULL DEFAULT 4,
    degree_form              TEXT NOT NULL DEFAULT 'bachelor_4yr'
        CHECK (degree_form IN ('bachelor_4yr','bachelor_5yr','bachelor_6yr','other')),
    effective_date           DATE,
    status                    TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','under_review','active','retired')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_curriculum_versions_program ON curriculum_versions(program_id);

-- ----------------------------------------------------------------------------
-- SECTION 3: CURRICULUM STRUCTURE (หมวดวิชา / กลุ่มวิชา — hierarchical categories)
-- ----------------------------------------------------------------------------
CREATE TABLE course_categories (
    category_id              BIGSERIAL PRIMARY KEY,
    curriculum_version_id    BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    parent_category_id       BIGINT REFERENCES course_categories(category_id),
    category_level            TEXT NOT NULL
        CHECK (category_level IN ('หมวดวิชา','กลุ่มวิชา')),  -- top-level "หมวด" vs sub "กลุ่ม"
    code                       TEXT,                          -- short code, e.g. 'GEN_ED', 'GEN_ED.IDENTITY'
    name_th                    TEXT NOT NULL,
    name_en                    TEXT,
    required_credits           NUMERIC(5,1) NOT NULL,          -- e.g. 24, 12, 3, 9, 102, 39, 63, 60, 3, 6
    sort_order                 INT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_curriculum ON course_categories(curriculum_version_id);
CREATE INDEX idx_categories_parent ON course_categories(parent_category_id);

-- ----------------------------------------------------------------------------
-- SECTION 4: COURSES (รายวิชา)
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    course_id                 BIGSERIAL PRIMARY KEY,
    course_code                VARCHAR(8) NOT NULL UNIQUE,    -- 8-digit code, e.g. 03376116
    name_th                    TEXT NOT NULL,
    name_en                    TEXT NOT NULL,
    credits                    NUMERIC(3,1) NOT NULL,          -- the leading number, e.g. 3, 0, 6
    lecture_hours               NUMERIC(4,1) NOT NULL DEFAULT 0, -- first number in (X-X-X)
    practice_hours              NUMERIC(4,1) NOT NULL DEFAULT 0, -- second number in (X-X-X)
    self_study_hours            NUMERIC(4,1) NOT NULL DEFAULT 0, -- third number in (X-X-X)
    grading_type                 TEXT NOT NULL DEFAULT 'letter'
        CHECK (grading_type IN ('letter','pass_fail')),         -- pass_fail = ผ่าน(S)/ไม่ผ่าน(U)
    is_non_credit_prerequisite   BOOLEAN NOT NULL DEFAULT FALSE, -- e.g. 90641008, credits = 0 but mandatory
    course_type                  TEXT NOT NULL DEFAULT 'standard'
        CHECK (course_type IN ('standard','internship','teaching_practice','project','elective_placeholder')),
    description_ref_th            TEXT,                          -- pointer/note, e.g. "ภาคผนวก จ"
    active                        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_code ON courses(course_code);

-- Parsed breakdown of the 8-digit course code, per the numbering scheme
-- documented in the curriculum (มติสภาวิชาการ ครั้งที่ 11/2553).
CREATE TABLE course_code_segments (
    course_id                 BIGINT PRIMARY KEY REFERENCES courses(course_id),
    faculty_segment            VARCHAR(2) NOT NULL,   -- digits 1-2, e.g. '03' = คณะครุศาสตร์อุตสาหกรรม
    subject_group_segment      VARCHAR(2) NOT NULL,   -- digits 3-4, e.g. '20','30' = วิชาชีพครู, '37' = เทคโนโลยีคอมพิวเตอร์
    degree_level_segment       VARCHAR(1) NOT NULL,   -- digit 5, e.g. '6' = ปริญญาตรี
    sequence_segment           VARCHAR(3) NOT NULL    -- digits 6-8, running number
);

-- Which category/categories a course belongs to, and whether it's required
-- or elective within that category, for a specific curriculum version.
CREATE TABLE course_category_map (
    course_category_map_id     BIGSERIAL PRIMARY KEY,
    curriculum_version_id      BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    course_id                  BIGINT REFERENCES courses(course_id),   -- NULL allowed for elective placeholder rows
    category_id                BIGINT NOT NULL REFERENCES course_categories(category_id),
    requirement_type            TEXT NOT NULL
        CHECK (requirement_type IN ('required','elective')),
    sort_order                  INT NOT NULL DEFAULT 0,
    UNIQUE (curriculum_version_id, course_id, category_id)
);
CREATE INDEX idx_ccm_curriculum ON course_category_map(curriculum_version_id);
CREATE INDEX idx_ccm_course ON course_category_map(course_id);
CREATE INDEX idx_ccm_category ON course_category_map(category_id);

CREATE TABLE course_prerequisites (
    course_id                  BIGINT NOT NULL REFERENCES courses(course_id),
    prerequisite_course_id      BIGINT NOT NULL REFERENCES courses(course_id),
    prerequisite_type            TEXT NOT NULL DEFAULT 'must_pass'
        CHECK (prerequisite_type IN ('must_pass','concurrent','recommended')),
    PRIMARY KEY (course_id, prerequisite_course_id)
);

-- ----------------------------------------------------------------------------
-- SECTION 5: LEARNING OUTCOMES — PLO / CLO AND THEIR MAPPING
-- ----------------------------------------------------------------------------
CREATE TABLE plos (
    plo_id                     BIGSERIAL PRIMARY KEY,
    curriculum_version_id       BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    plo_code                    TEXT NOT NULL,          -- e.g. 'PLO 1.1', 'PLO 2.4', 'PLO 4.2'
    domain_no                    INT NOT NULL,           -- leading number, e.g. 1,2,3,4
    sub_no                       INT,                    -- decimal part, e.g. 1,2,3...
    description_th               TEXT,                   -- full text (source TQF2 doc, not all present in excerpt)
    description_en               TEXT,
    UNIQUE (curriculum_version_id, plo_code),
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plos_curriculum ON plos(curriculum_version_id);

CREATE TABLE clos (
    clo_id                      BIGSERIAL PRIMARY KEY,
    course_id                    BIGINT NOT NULL REFERENCES courses(course_id),
    clo_code                     TEXT NOT NULL,          -- e.g. 'CLO1', 'CLO2'
    description_th                TEXT NOT NULL,
    description_en                TEXT,
    bloom_level                   TEXT
        CHECK (bloom_level IN ('remember','understand','apply','analyze','evaluate','create')),
    weight_percent                NUMERIC(5,2),           -- relative weight of this CLO within the course, 0-100
    target_attainment_percent      NUMERIC(5,2) DEFAULT 60.0,  -- pass threshold used for attainment calc
    active                         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, clo_code)
);
CREATE INDEX idx_clos_course ON clos(course_id);

-- CLO -> PLO mapping matrix (the core OBE traceability link).
-- mapping_strength follows the standard I/R/M scale:
--   1 = Introduced, 2 = Reinforced, 3 = Mastered/Assessed
CREATE TABLE clo_plo_map (
    clo_plo_map_id               BIGSERIAL PRIMARY KEY,
    clo_id                        BIGINT NOT NULL REFERENCES clos(clo_id),
    plo_id                         BIGINT NOT NULL REFERENCES plos(plo_id),
    mapping_strength                SMALLINT NOT NULL CHECK (mapping_strength BETWEEN 1 AND 3),
    UNIQUE (clo_id, plo_id)
);
CREATE INDEX idx_clo_plo_map_clo ON clo_plo_map(clo_id);
CREATE INDEX idx_clo_plo_map_plo ON clo_plo_map(plo_id);

-- Institutional identity / graduate attributes (คุณลักษณะอันพึงประสงค์ของนักศึกษา),
-- e.g. "ใช้ชีวิตและเรียนรู้เป็น", "สอนเป็น", "ปฏิบัติเป็น" from Section 4.1 of the document.
CREATE TABLE identity_categories (
    identity_category_id           BIGSERIAL PRIMARY KEY,
    curriculum_version_id           BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    code                             TEXT NOT NULL,        -- 'LIVE_LEARN','TEACH','PRACTICE'
    name_th                          TEXT NOT NULL,         -- ใช้ชีวิตและเรียนรู้เป็น / สอนเป็น / ปฏิบัติเป็น
    UNIQUE (curriculum_version_id, code)
);

CREATE TABLE identity_attributes (
    identity_attribute_id            BIGSERIAL PRIMARY KEY,
    identity_category_id              BIGINT NOT NULL REFERENCES identity_categories(identity_category_id),
    name_th                           TEXT NOT NULL,        -- e.g. ซื่อสัตย์, ใฝ่รู้
    sort_order                        INT NOT NULL DEFAULT 0
);

-- Maps a graduate attribute to the PLO(s) it supports, plus the
-- teaching method and assessment method described in the document table.
CREATE TABLE identity_attribute_plo_map (
    identity_attribute_plo_map_id      BIGSERIAL PRIMARY KEY,
    identity_attribute_id               BIGINT NOT NULL REFERENCES identity_attributes(identity_attribute_id),
    plo_id                               BIGINT REFERENCES plos(plo_id),  -- nullable: some attributes have no PLO yet (e.g. ซื่อสัตย์)
    teaching_method_th                   TEXT,   -- แนวทาง/วิธีการ/กิจกรรม
    assessment_method_th                 TEXT
);

-- ----------------------------------------------------------------------------
-- SECTION 6: STUDY PLAN (แผนการศึกษา — curriculum map by year/term)
-- ----------------------------------------------------------------------------
CREATE TABLE study_plan_terms (
    study_plan_term_id            BIGSERIAL PRIMARY KEY,
    curriculum_version_id          BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    year_no                         INT NOT NULL,          -- ปีที่ 1-4
    term_no                         INT NOT NULL,          -- 1, 2, or 0 for special/summer term
    term_label_th                   TEXT NOT NULL,         -- "ปีที่ 1 ภาคการศึกษาที่ 1", "ปีที่ 2 ภาคการศึกษาพิเศษ"
    term_type                       TEXT NOT NULL DEFAULT 'regular'
        CHECK (term_type IN ('regular','special')),
    total_credits                   NUMERIC(5,1) NOT NULL, -- "รวม" row, e.g. 21, 22, 16, 6, 0
    UNIQUE (curriculum_version_id, year_no, term_no)
);
CREATE INDEX idx_spt_curriculum ON study_plan_terms(curriculum_version_id);

CREATE TABLE study_plan_courses (
    study_plan_course_id            BIGSERIAL PRIMARY KEY,
    study_plan_term_id               BIGINT NOT NULL REFERENCES study_plan_terms(study_plan_term_id),
    course_id                        BIGINT REFERENCES courses(course_id),        -- NULL for elective slots
    category_id                      BIGINT REFERENCES course_categories(category_id), -- used when course_id IS NULL
    elective_slot_label_th            TEXT,        -- e.g. "วิชาเลือกหมวดศึกษาทั่วไป (วิชาที่ 1)"
    credits_at_placement              NUMERIC(3,1) NOT NULL,  -- credit value shown in the plan for that slot
    sort_order                        INT NOT NULL DEFAULT 0,
    CHECK (course_id IS NOT NULL OR category_id IS NOT NULL)
);
CREATE INDEX idx_spc_term ON study_plan_courses(study_plan_term_id);
CREATE INDEX idx_spc_course ON study_plan_courses(course_id);

-- ----------------------------------------------------------------------------
-- SECTION 7: ACADEMIC CALENDAR
-- ----------------------------------------------------------------------------
CREATE TABLE academic_years (
    academic_year_id                 BIGSERIAL PRIMARY KEY,
    year_th                           TEXT NOT NULL UNIQUE,  -- e.g. '2568'
    start_date                        DATE,
    end_date                          DATE
);

CREATE TABLE terms (
    term_id                           BIGSERIAL PRIMARY KEY,
    academic_year_id                  BIGINT NOT NULL REFERENCES academic_years(academic_year_id),
    term_no                           INT NOT NULL CHECK (term_no IN (1,2,3)),  -- 3 = summer/special
    start_date                        DATE,
    end_date                          DATE,
    UNIQUE (academic_year_id, term_no)
);
CREATE INDEX idx_terms_year ON terms(academic_year_id);

-- ----------------------------------------------------------------------------
-- SECTION 8: INSTRUCTORS, OFFERINGS / SECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE instructors (
    instructor_id                     BIGSERIAL PRIMARY KEY,
    employee_code                      TEXT UNIQUE,
    name_th                            TEXT NOT NULL,
    name_en                            TEXT,
    department_id                      BIGINT REFERENCES departments(department_id),
    email                               TEXT,
    active                               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course_sections (
    section_id                          BIGSERIAL PRIMARY KEY,
    course_id                            BIGINT NOT NULL REFERENCES courses(course_id),
    term_id                              BIGINT NOT NULL REFERENCES terms(term_id),
    section_no                           TEXT NOT NULL DEFAULT '01',
    primary_instructor_id                 BIGINT REFERENCES instructors(instructor_id),
    max_students                          INT,
    status                                TEXT NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned','open','in_progress','grading','closed','cancelled')),
    created_at                             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, term_id, section_no)
);
CREATE INDEX idx_sections_course ON course_sections(course_id);
CREATE INDEX idx_sections_term ON course_sections(term_id);

CREATE TABLE section_instructors (   -- supports co-teaching / lab instructors
    section_id                            BIGINT NOT NULL REFERENCES course_sections(section_id),
    instructor_id                          BIGINT NOT NULL REFERENCES instructors(instructor_id),
    role                                    TEXT NOT NULL DEFAULT 'co_instructor'
        CHECK (role IN ('lead','co_instructor','lab_instructor','ta')),
    PRIMARY KEY (section_id, instructor_id)
);

-- ----------------------------------------------------------------------------
-- SECTION 9: STUDENTS & ENROLLMENT
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    student_id                             BIGSERIAL PRIMARY KEY,
    student_code                            TEXT NOT NULL UNIQUE,     -- รหัสนักศึกษา
    name_th                                 TEXT NOT NULL,
    name_en                                 TEXT,
    program_id                              BIGINT NOT NULL REFERENCES programs(program_id),
    curriculum_version_id                    BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    admit_academic_year_id                   BIGINT REFERENCES academic_years(academic_year_id),
    status                                    TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','on_leave','graduated','withdrawn','dismissed')),
    created_at                                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_program ON students(program_id);
CREATE INDEX idx_students_curriculum ON students(curriculum_version_id);

CREATE TABLE enrollments (
    enrollment_id                              BIGSERIAL PRIMARY KEY,
    student_id                                  BIGINT NOT NULL REFERENCES students(student_id),
    section_id                                  BIGINT NOT NULL REFERENCES course_sections(section_id),
    enrollment_date                              DATE NOT NULL DEFAULT CURRENT_DATE,
    final_grade                                  TEXT,     -- 'A','B+','B'...,'S','U'
    grade_status                                  TEXT NOT NULL DEFAULT 'enrolled'
        CHECK (grade_status IN ('enrolled','completed','withdrawn','failed','incomplete')),
    UNIQUE (student_id, section_id)
);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_section ON enrollments(section_id);

-- ----------------------------------------------------------------------------
-- SECTION 10: ASSESSMENT INSTRUMENTS & CLO-LEVEL SCORING
-- ----------------------------------------------------------------------------
CREATE TABLE assessment_methods (
    assessment_method_id                         BIGSERIAL PRIMARY KEY,
    name_th                                       TEXT NOT NULL,   -- ข้อสอบ, ควิซ, โครงงาน, ผลงาน, การนำเสนอ, ฝึกปฏิบัติ
    name_en                                       TEXT,
    category                                       TEXT NOT NULL
        CHECK (category IN ('exam','quiz','assignment','project','presentation','practicum','participation','other'))
);

-- A specific assessment instrument used within a section, tagged to the
-- CLO(s) it measures. One instrument (e.g. Midterm) can assess multiple CLOs
-- via clo_instrument_map, each with its own point allocation.
CREATE TABLE assessment_instruments (
    instrument_id                                  BIGSERIAL PRIMARY KEY,
    section_id                                      BIGINT NOT NULL REFERENCES course_sections(section_id),
    assessment_method_id                             BIGINT NOT NULL REFERENCES assessment_methods(assessment_method_id),
    title                                             TEXT NOT NULL,     -- "Midterm Exam", "Project Milestone 2"
    max_score                                         NUMERIC(6,2) NOT NULL,
    weight_percent                                    NUMERIC(5,2),      -- weight toward final course grade
    assessment_date                                   DATE,
    created_at                                        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_instruments_section ON assessment_instruments(section_id);

CREATE TABLE clo_instrument_map (
    clo_instrument_map_id                              BIGSERIAL PRIMARY KEY,
    instrument_id                                       BIGINT NOT NULL REFERENCES assessment_instruments(instrument_id),
    clo_id                                              BIGINT NOT NULL REFERENCES clos(clo_id),
    max_score_allocated                                 NUMERIC(6,2) NOT NULL,   -- portion of instrument's max_score tied to this CLO
    UNIQUE (instrument_id, clo_id)
);
CREATE INDEX idx_cim_instrument ON clo_instrument_map(instrument_id);
CREATE INDEX idx_cim_clo ON clo_instrument_map(clo_id);

-- Raw per-student, per-instrument, per-CLO scores. This is the atomic
-- fact table that everything else (attainment, PLO rollups) aggregates from.
CREATE TABLE student_clo_scores (
    student_clo_score_id                                 BIGSERIAL PRIMARY KEY,
    enrollment_id                                         BIGINT NOT NULL REFERENCES enrollments(enrollment_id),
    instrument_id                                         BIGINT NOT NULL REFERENCES assessment_instruments(instrument_id),
    clo_id                                                BIGINT NOT NULL REFERENCES clos(clo_id),
    raw_score                                             NUMERIC(6,2) NOT NULL,
    max_score                                             NUMERIC(6,2) NOT NULL,
    percent_score                                         NUMERIC(5,2) GENERATED ALWAYS AS
                                                              (CASE WHEN max_score > 0 THEN (raw_score / max_score) * 100 ELSE NULL END) STORED,
    graded_by                                             BIGINT REFERENCES instructors(instructor_id),
    graded_at                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (enrollment_id, instrument_id, clo_id)
);
CREATE INDEX idx_scores_enrollment ON student_clo_scores(enrollment_id);
CREATE INDEX idx_scores_clo ON student_clo_scores(clo_id);

-- ----------------------------------------------------------------------------
-- SECTION 11: ATTAINMENT AGGREGATION (CLO -> PLO ROLLUP)
-- These tables hold pre-computed / cached results, refreshed by a batch
-- job or materialized view refresh after each term's grading closes.
-- ----------------------------------------------------------------------------
CREATE TABLE clo_attainment_results (
    clo_attainment_id                                     BIGSERIAL PRIMARY KEY,
    section_id                                             BIGINT NOT NULL REFERENCES course_sections(section_id),
    clo_id                                                 BIGINT NOT NULL REFERENCES clos(clo_id),
    target_percent                                          NUMERIC(5,2) NOT NULL,
    students_meeting_target                                 INT NOT NULL,
    total_students_assessed                                 INT NOT NULL,
    attainment_percent                                      NUMERIC(5,2) NOT NULL,  -- students_meeting_target / total * 100
    average_score_percent                                   NUMERIC(5,2),
    computed_at                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (section_id, clo_id)
);
CREATE INDEX idx_clo_attainment_section ON clo_attainment_results(section_id);

CREATE TABLE plo_attainment_results (
    plo_attainment_id                                       BIGSERIAL PRIMARY KEY,
    program_id                                               BIGINT NOT NULL REFERENCES programs(program_id),
    plo_id                                                   BIGINT NOT NULL REFERENCES plos(plo_id),
    academic_year_id                                         BIGINT NOT NULL REFERENCES academic_years(academic_year_id),
    cohort_label                                             TEXT,          -- e.g. "รหัส 67", admitted-year cohort
    attainment_percent                                       NUMERIC(5,2) NOT NULL,
    students_included                                        INT NOT NULL,
    computed_at                                              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (program_id, plo_id, academic_year_id, cohort_label)
);
CREATE INDEX idx_plo_attainment_program ON plo_attainment_results(program_id);

-- ----------------------------------------------------------------------------
-- SECTION 12: FIELD EXPERIENCE / PRACTICUM TRACKING
-- (ฝึกงานอุตสาหกรรม / การปฏิบัติการสอนในสถานศึกษา — Section 3.4 of the document)
-- ----------------------------------------------------------------------------
CREATE TABLE field_experience_types (
    field_experience_type_id                                  BIGSERIAL PRIMARY KEY,
    name_th                                                     TEXT NOT NULL,   -- "การฝึกงานอุตสาหกรรม", "การปฏิบัติการสอนในสถานศึกษา"
    name_en                                                     TEXT
);

CREATE TABLE field_experience_learning_outcomes (
    field_experience_outcome_id                                  BIGSERIAL PRIMARY KEY,
    field_experience_type_id                                     BIGINT NOT NULL REFERENCES field_experience_types(field_experience_type_id),
    description_th                                                TEXT NOT NULL,     -- e.g. "พัฒนาบุคลิกภาพ การวางตัว และการมนุษยสัมพันธ์..."
    plo_id                                                        BIGINT REFERENCES plos(plo_id),
    evaluation_tool_th                                            TEXT               -- e.g. "แบบประเมินผลการฝึกงาน คณะครุศาสตร์ฯ"
);

CREATE TABLE field_experience_placements (
    placement_id                                                   BIGSERIAL PRIMARY KEY,
    student_id                                                     BIGINT NOT NULL REFERENCES students(student_id),
    field_experience_type_id                                       BIGINT NOT NULL REFERENCES field_experience_types(field_experience_type_id),
    course_id                                                      BIGINT REFERENCES courses(course_id),   -- link back to e.g. 03376131 / 03300009
    term_id                                                        BIGINT NOT NULL REFERENCES terms(term_id),
    host_organization_name                                        TEXT,     -- company or school name
    external_supervisor_name                                      TEXT,
    faculty_advisor_id                                             BIGINT REFERENCES instructors(instructor_id),
    start_date                                                     DATE,
    end_date                                                       DATE,
    total_hours                                                    NUMERIC(6,1),
    overall_result                                                 TEXT
        CHECK (overall_result IN ('pass','fail','in_progress')),
    created_at                                                     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_placements_student ON field_experience_placements(student_id);

CREATE TABLE field_experience_scores (
    field_experience_score_id                                       BIGSERIAL PRIMARY KEY,
    placement_id                                                    BIGINT NOT NULL REFERENCES field_experience_placements(placement_id),
    field_experience_outcome_id                                     BIGINT NOT NULL REFERENCES field_experience_learning_outcomes(field_experience_outcome_id),
    evaluator_type                                                  TEXT NOT NULL
        CHECK (evaluator_type IN ('industry_supervisor','faculty_advisor','self')),
    score                                                           NUMERIC(5,2),
    max_score                                                       NUMERIC(5,2),
    comments                                                        TEXT,
    scored_at                                                       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fe_scores_placement ON field_experience_scores(placement_id);

-- ----------------------------------------------------------------------------
-- SECTION 13: AUDIT / CHANGE LOG
-- ----------------------------------------------------------------------------
CREATE TABLE curriculum_change_log (
    change_log_id                                                     BIGSERIAL PRIMARY KEY,
    curriculum_version_id                                             BIGINT NOT NULL REFERENCES curriculum_versions(curriculum_version_id),
    entity_table                                                      TEXT NOT NULL,   -- e.g. 'courses', 'course_categories'
    entity_id                                                         BIGINT,
    change_description                                                TEXT NOT NULL,
    changed_by                                                        TEXT,
    changed_at                                                        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_change_log_curriculum ON curriculum_change_log(curriculum_version_id);

-- ============================================================================
-- SECTION 14: REPORTING VIEWS
-- ============================================================================

-- Flat, human-readable course listing with category and credit breakdown
-- (mirrors the "3.3.2 รายวิชา" table layout in the source document).
CREATE VIEW v_course_catalog AS
SELECT
    c.course_id,
    c.course_code,
    c.name_th,
    c.name_en,
    c.credits,
    c.lecture_hours,
    c.practice_hours,
    c.self_study_hours,
    c.grading_type,
    cat.name_th  AS category_name_th,
    parent.name_th AS parent_category_name_th,
    ccm.requirement_type,
    cv.revision_label_th
FROM courses c
JOIN course_category_map ccm ON ccm.course_id = c.course_id
JOIN course_categories cat ON cat.category_id = ccm.category_id
LEFT JOIN course_categories parent ON parent.category_id = cat.parent_category_id
JOIN curriculum_versions cv ON cv.curriculum_version_id = ccm.curriculum_version_id;

-- Study plan laid out by year/term (mirrors "3.3.3 แผนการศึกษา").
CREATE VIEW v_study_plan AS
SELECT
    spt.curriculum_version_id,
    spt.year_no,
    spt.term_no,
    spt.term_label_th,
    COALESCE(c.course_code, '9064XXXX/XXXXXXXX') AS course_code,
    COALESCE(c.name_th, spc.elective_slot_label_th) AS course_or_slot_name_th,
    spc.credits_at_placement,
    spt.total_credits AS term_total_credits
FROM study_plan_terms spt
JOIN study_plan_courses spc ON spc.study_plan_term_id = spt.study_plan_term_id
LEFT JOIN courses c ON c.course_id = spc.course_id
ORDER BY spt.year_no, spt.term_no, spc.sort_order;

-- CLO attainment per section with course/term context.
CREATE VIEW v_clo_attainment_summary AS
SELECT
    cs.section_id,
    co.course_code,
    co.name_th AS course_name_th,
    t.term_id,
    cl.clo_code,
    cl.description_th AS clo_description,
    car.target_percent,
    car.attainment_percent,
    car.total_students_assessed,
    car.computed_at
FROM clo_attainment_results car
JOIN course_sections cs ON cs.section_id = car.section_id
JOIN courses co ON co.course_id = cs.course_id
JOIN terms t ON t.term_id = cs.term_id
JOIN clos cl ON cl.clo_id = car.clo_id;

-- Student-level PLO progress rollup, weighted by CLO->PLO mapping strength.
CREATE VIEW v_student_plo_progress AS
SELECT
    e.student_id,
    p.plo_id,
    p.plo_code,
    AVG(scs.percent_score * cpm.mapping_strength) / NULLIF(AVG(cpm.mapping_strength), 0) AS weighted_plo_score
FROM student_clo_scores scs
JOIN enrollments e ON e.enrollment_id = scs.enrollment_id
JOIN clo_plo_map cpm ON cpm.clo_id = scs.clo_id
JOIN plos p ON p.plo_id = cpm.plo_id
GROUP BY e.student_id, p.plo_id, p.plo_code;