-- ============================================================================
-- CMAS / CLO SYSTEM — Enterprise Schema — MySQL 8.0 dialect
-- Course-Level Learning Outcome Assessment & Tracking Platform
--
-- Source of truth : docs/markdown/sql/schema.sql (PostgreSQL 14+)
-- This file        : hand-translated to MySQL 8.0.16+ so MySQL Workbench can
--                    "Reverse Engineer" it into an EER diagram.
--
-- Translation notes (Postgres -> MySQL 8):
--   BIGSERIAL              -> BIGINT AUTO_INCREMENT
--   TIMESTAMPTZ + now()    -> TIMESTAMP + CURRENT_TIMESTAMP
--                             (updated_at also ON UPDATE CURRENT_TIMESTAMP)
--   TEXT used in UNIQUE/PK -> VARCHAR(n) (MySQL cannot index full TEXT)
--   NUMERIC(p,s)           -> DECIMAL(p,s)
--   CHECK (x IN (...))     -> kept (enforced on MySQL 8.0.16+; drawn by Workbench)
--   GENERATED ... STORED   -> same syntax, supported by MySQL 8
--   DEFAULT CURRENT_DATE   -> DEFAULT (CURRENT_DATE)  [expression default]
--   CREATE EXTENSION       -> removed (Postgres-only)
--   Reserved words (role)  -> back-ticked
--   All tables InnoDB + utf8mb4 so Thai (_th) columns store correctly.
--   FKs are TABLE-LEVEL constraints (MySQL ignores inline column REFERENCES),
--   so Workbench renders every relationship line.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- SECTION 1: INSTITUTIONAL HIERARCHY
-- ----------------------------------------------------------------------------
CREATE TABLE institutions (
    institution_id  BIGINT       NOT NULL AUTO_INCREMENT,
    name_th         VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE faculties (
    faculty_id      BIGINT       NOT NULL AUTO_INCREMENT,
    institution_id  BIGINT       NOT NULL,
    name_th         VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (faculty_id),
    KEY idx_faculties_institution (institution_id),
    CONSTRAINT fk_faculties_institution
        FOREIGN KEY (institution_id) REFERENCES institutions (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
    department_id   BIGINT       NOT NULL AUTO_INCREMENT,
    faculty_id      BIGINT       NOT NULL,
    name_th         VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (department_id),
    KEY idx_departments_faculty (faculty_id),
    CONSTRAINT fk_departments_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties (faculty_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 2: PROGRAM & CURRICULUM VERSIONING
-- ----------------------------------------------------------------------------
CREATE TABLE programs (
    program_id       BIGINT       NOT NULL AUTO_INCREMENT,
    department_id    BIGINT       NOT NULL,
    name_th          VARCHAR(255) NOT NULL,
    name_en          VARCHAR(255) NOT NULL,
    degree_full_th   VARCHAR(255) NOT NULL,
    degree_full_en   VARCHAR(255) NOT NULL,
    degree_short_th  VARCHAR(100) NOT NULL,
    degree_short_en  VARCHAR(100) NOT NULL,
    major_track      VARCHAR(255) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (program_id),
    KEY idx_programs_department (department_id),
    CONSTRAINT fk_programs_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE curriculum_versions (
    curriculum_version_id BIGINT       NOT NULL AUTO_INCREMENT,
    program_id            BIGINT       NOT NULL,
    curriculum_code       VARCHAR(13)  NULL,
    revision_label_th     VARCHAR(255) NOT NULL,
    revision_year_be      INT          NOT NULL,
    revision_year_ce      INT          NOT NULL,
    total_credits         DECIMAL(5,1) NOT NULL,
    duration_years        DECIMAL(3,1) NOT NULL DEFAULT 4,
    degree_form           VARCHAR(20)  NOT NULL DEFAULT 'bachelor_4yr',
    effective_date        DATE         NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'draft',
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (curriculum_version_id),
    KEY idx_curriculum_versions_program (program_id),
    CONSTRAINT fk_curriculum_versions_program
        FOREIGN KEY (program_id) REFERENCES programs (program_id),
    CONSTRAINT chk_cv_degree_form
        CHECK (degree_form IN ('bachelor_4yr','bachelor_5yr','bachelor_6yr','other')),
    CONSTRAINT chk_cv_status
        CHECK (status IN ('draft','under_review','active','retired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 3: CURRICULUM STRUCTURE (หมวดวิชา / กลุ่มวิชา)
-- ----------------------------------------------------------------------------
CREATE TABLE course_categories (
    category_id           BIGINT       NOT NULL AUTO_INCREMENT,
    curriculum_version_id BIGINT       NOT NULL,
    parent_category_id    BIGINT       NULL,
    category_level        VARCHAR(20)  NOT NULL,
    code                  VARCHAR(50)  NULL,
    name_th               VARCHAR(255) NOT NULL,
    name_en               VARCHAR(255) NULL,
    required_credits      DECIMAL(5,1) NOT NULL,
    sort_order            INT          NOT NULL DEFAULT 0,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    KEY idx_categories_curriculum (curriculum_version_id),
    KEY idx_categories_parent (parent_category_id),
    CONSTRAINT fk_categories_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id),
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_category_id) REFERENCES course_categories (category_id),
    CONSTRAINT chk_category_level
        CHECK (category_level IN ('หมวดวิชา','กลุ่มวิชา'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 4: COURSES (รายวิชา)
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    course_id                  BIGINT       NOT NULL AUTO_INCREMENT,
    course_code                VARCHAR(8)   NOT NULL,
    name_th                    VARCHAR(255) NOT NULL,
    name_en                    VARCHAR(255) NOT NULL,
    credits                    DECIMAL(3,1) NOT NULL,
    lecture_hours              DECIMAL(4,1) NOT NULL DEFAULT 0,
    practice_hours             DECIMAL(4,1) NOT NULL DEFAULT 0,
    self_study_hours           DECIMAL(4,1) NOT NULL DEFAULT 0,
    grading_type               VARCHAR(20)  NOT NULL DEFAULT 'letter',
    is_non_credit_prerequisite TINYINT(1)   NOT NULL DEFAULT 0,
    course_type                VARCHAR(30)  NOT NULL DEFAULT 'standard',
    description_ref_th         VARCHAR(255) NULL,
    active                     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id),
    UNIQUE KEY uq_courses_code (course_code),
    CONSTRAINT chk_courses_grading
        CHECK (grading_type IN ('letter','pass_fail')),
    CONSTRAINT chk_courses_type
        CHECK (course_type IN ('standard','internship','teaching_practice','project','elective_placeholder'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_code_segments (
    course_id             BIGINT     NOT NULL,
    faculty_segment       VARCHAR(2) NOT NULL,
    subject_group_segment VARCHAR(2) NOT NULL,
    degree_level_segment  VARCHAR(1) NOT NULL,
    sequence_segment      VARCHAR(3) NOT NULL,
    PRIMARY KEY (course_id),
    CONSTRAINT fk_code_segments_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_category_map (
    course_category_map_id BIGINT      NOT NULL AUTO_INCREMENT,
    curriculum_version_id  BIGINT      NOT NULL,
    course_id              BIGINT      NULL,
    category_id            BIGINT      NOT NULL,
    requirement_type       VARCHAR(20) NOT NULL,
    sort_order             INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (course_category_map_id),
    UNIQUE KEY uq_ccm (curriculum_version_id, course_id, category_id),
    KEY idx_ccm_course (course_id),
    KEY idx_ccm_category (category_id),
    CONSTRAINT fk_ccm_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id),
    CONSTRAINT fk_ccm_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
    CONSTRAINT fk_ccm_category
        FOREIGN KEY (category_id) REFERENCES course_categories (category_id),
    CONSTRAINT chk_ccm_requirement
        CHECK (requirement_type IN ('required','elective'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_prerequisites (
    course_id              BIGINT      NOT NULL,
    prerequisite_course_id BIGINT      NOT NULL,
    prerequisite_type      VARCHAR(20) NOT NULL DEFAULT 'must_pass',
    PRIMARY KEY (course_id, prerequisite_course_id),
    KEY idx_prereq_prereq (prerequisite_course_id),
    CONSTRAINT fk_prereq_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
    CONSTRAINT fk_prereq_prereq_course
        FOREIGN KEY (prerequisite_course_id) REFERENCES courses (course_id),
    CONSTRAINT chk_prereq_type
        CHECK (prerequisite_type IN ('must_pass','concurrent','recommended'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 5: LEARNING OUTCOMES — PLO / CLO AND THEIR MAPPING
-- ----------------------------------------------------------------------------
CREATE TABLE plos (
    plo_id                BIGINT      NOT NULL AUTO_INCREMENT,
    curriculum_version_id BIGINT      NOT NULL,
    plo_code              VARCHAR(50) NOT NULL,
    domain_no             INT         NOT NULL,
    sub_no                INT         NULL,
    description_th        TEXT        NULL,
    description_en        TEXT        NULL,
    created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (plo_id),
    UNIQUE KEY uq_plos_code (curriculum_version_id, plo_code),
    CONSTRAINT fk_plos_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clos (
    clo_id                    BIGINT       NOT NULL AUTO_INCREMENT,
    course_id                 BIGINT       NOT NULL,
    clo_code                  VARCHAR(50)  NOT NULL,
    description_th            TEXT         NOT NULL,
    description_en            TEXT         NULL,
    bloom_level               VARCHAR(20)  NULL,
    weight_percent            DECIMAL(5,2) NULL,
    target_attainment_percent DECIMAL(5,2) NULL DEFAULT 60.0,
    active                    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clo_id),
    UNIQUE KEY uq_clos_code (course_id, clo_code),
    CONSTRAINT fk_clos_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
    CONSTRAINT chk_clos_bloom
        CHECK (bloom_level IN ('remember','understand','apply','analyze','evaluate','create'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Behavioural objectives (จุดประสงค์เชิงพฤติกรรม) — the observable statements
-- that a CLO is broken down into. Present in the app schema but missing here,
-- which left the enterprise model unable to express the level of detail the
-- course outline (มคอ.3) is actually written at.
-- ----------------------------------------------------------------------------
CREATE TABLE clo_objectives (
    clo_objective_id BIGINT NOT NULL AUTO_INCREMENT,
    clo_id           BIGINT NOT NULL,
    objective_no     INT    NOT NULL,
    description_th   TEXT   NOT NULL,
    description_en   TEXT   NULL,
    PRIMARY KEY (clo_objective_id),
    UNIQUE KEY uq_clo_objectives (clo_id, objective_no),
    CONSTRAINT fk_clo_objectives_clo
        FOREIGN KEY (clo_id) REFERENCES clos (clo_id),
    CONSTRAINT chk_clo_objectives_no CHECK (objective_no > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The objective <-> instrument link lives in SECTION 10, next to
-- clo_instrument_map, so that every table is created after the tables it
-- references rather than depending on FOREIGN_KEY_CHECKS = 0.

CREATE TABLE clo_plo_map (
    clo_plo_map_id   BIGINT   NOT NULL AUTO_INCREMENT,
    clo_id           BIGINT   NOT NULL,
    plo_id           BIGINT   NOT NULL,
    mapping_strength SMALLINT NOT NULL,
    PRIMARY KEY (clo_plo_map_id),
    UNIQUE KEY uq_clo_plo (clo_id, plo_id),
    KEY idx_clo_plo_map_plo (plo_id),
    CONSTRAINT fk_clo_plo_clo
        FOREIGN KEY (clo_id) REFERENCES clos (clo_id),
    CONSTRAINT fk_clo_plo_plo
        FOREIGN KEY (plo_id) REFERENCES plos (plo_id),
    CONSTRAINT chk_mapping_strength
        CHECK (mapping_strength BETWEEN 1 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE identity_categories (
    identity_category_id  BIGINT       NOT NULL AUTO_INCREMENT,
    curriculum_version_id BIGINT       NOT NULL,
    code                  VARCHAR(50)  NOT NULL,
    name_th               VARCHAR(255) NOT NULL,
    PRIMARY KEY (identity_category_id),
    UNIQUE KEY uq_identity_cat (curriculum_version_id, code),
    CONSTRAINT fk_identity_cat_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE identity_attributes (
    identity_attribute_id BIGINT       NOT NULL AUTO_INCREMENT,
    identity_category_id  BIGINT       NOT NULL,
    name_th               VARCHAR(255) NOT NULL,
    sort_order            INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (identity_attribute_id),
    KEY idx_identity_attr_category (identity_category_id),
    CONSTRAINT fk_identity_attr_category
        FOREIGN KEY (identity_category_id) REFERENCES identity_categories (identity_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE identity_attribute_plo_map (
    identity_attribute_plo_map_id BIGINT NOT NULL AUTO_INCREMENT,
    identity_attribute_id         BIGINT NOT NULL,
    plo_id                        BIGINT NULL,
    teaching_method_th            TEXT   NULL,
    assessment_method_th          TEXT   NULL,
    PRIMARY KEY (identity_attribute_plo_map_id),
    KEY idx_iapm_attr (identity_attribute_id),
    KEY idx_iapm_plo (plo_id),
    CONSTRAINT fk_iapm_attr
        FOREIGN KEY (identity_attribute_id) REFERENCES identity_attributes (identity_attribute_id),
    CONSTRAINT fk_iapm_plo
        FOREIGN KEY (plo_id) REFERENCES plos (plo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 6: STUDY PLAN (แผนการศึกษา)
-- ----------------------------------------------------------------------------
CREATE TABLE study_plan_terms (
    study_plan_term_id    BIGINT       NOT NULL AUTO_INCREMENT,
    curriculum_version_id BIGINT       NOT NULL,
    year_no               INT          NOT NULL,
    term_no               INT          NOT NULL,
    term_label_th         VARCHAR(255) NOT NULL,
    term_type             VARCHAR(20)  NOT NULL DEFAULT 'regular',
    total_credits         DECIMAL(5,1) NOT NULL,
    PRIMARY KEY (study_plan_term_id),
    UNIQUE KEY uq_spt (curriculum_version_id, year_no, term_no),
    CONSTRAINT fk_spt_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id),
    CONSTRAINT chk_spt_term_type
        CHECK (term_type IN ('regular','special'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE study_plan_courses (
    study_plan_course_id   BIGINT       NOT NULL AUTO_INCREMENT,
    study_plan_term_id     BIGINT       NOT NULL,
    course_id              BIGINT       NULL,
    category_id            BIGINT       NULL,
    elective_slot_label_th VARCHAR(255) NULL,
    credits_at_placement   DECIMAL(3,1) NOT NULL,
    sort_order             INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (study_plan_course_id),
    KEY idx_spc_term (study_plan_term_id),
    KEY idx_spc_course (course_id),
    KEY idx_spc_category (category_id),
    CONSTRAINT fk_spc_term
        FOREIGN KEY (study_plan_term_id) REFERENCES study_plan_terms (study_plan_term_id),
    CONSTRAINT fk_spc_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
    CONSTRAINT fk_spc_category
        FOREIGN KEY (category_id) REFERENCES course_categories (category_id),
    CONSTRAINT chk_spc_course_or_category
        CHECK (course_id IS NOT NULL OR category_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 7: ACADEMIC CALENDAR
-- ----------------------------------------------------------------------------
CREATE TABLE academic_years (
    academic_year_id BIGINT      NOT NULL AUTO_INCREMENT,
    year_th          VARCHAR(10) NOT NULL,
    start_date       DATE        NULL,
    end_date         DATE        NULL,
    PRIMARY KEY (academic_year_id),
    UNIQUE KEY uq_academic_year (year_th)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE terms (
    term_id          BIGINT NOT NULL AUTO_INCREMENT,
    academic_year_id BIGINT NOT NULL,
    term_no          INT    NOT NULL,
    start_date       DATE   NULL,
    end_date         DATE   NULL,
    PRIMARY KEY (term_id),
    UNIQUE KEY uq_terms (academic_year_id, term_no),
    CONSTRAINT fk_terms_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (academic_year_id),
    CONSTRAINT chk_terms_no
        CHECK (term_no IN (1,2,3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 8: INSTRUCTORS, OFFERINGS / SECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE instructors (
    instructor_id BIGINT       NOT NULL AUTO_INCREMENT,
    employee_code VARCHAR(50)  NULL,
    name_th       VARCHAR(255) NOT NULL,
    name_en       VARCHAR(255) NULL,
    department_id BIGINT       NULL,
    email         VARCHAR(255) NULL,
    active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (instructor_id),
    UNIQUE KEY uq_instructors_emp (employee_code),
    KEY idx_instructors_department (department_id),
    CONSTRAINT fk_instructors_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_sections (
    section_id            BIGINT      NOT NULL AUTO_INCREMENT,
    course_id             BIGINT      NOT NULL,
    term_id               BIGINT      NOT NULL,
    section_no            VARCHAR(10) NOT NULL DEFAULT '01',
    primary_instructor_id BIGINT      NULL,
    max_students          INT         NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'planned',
    created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (section_id),
    UNIQUE KEY uq_sections (course_id, term_id, section_no),
    KEY idx_sections_term (term_id),
    KEY idx_sections_instructor (primary_instructor_id),
    CONSTRAINT fk_sections_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
    CONSTRAINT fk_sections_term
        FOREIGN KEY (term_id) REFERENCES terms (term_id),
    CONSTRAINT fk_sections_instructor
        FOREIGN KEY (primary_instructor_id) REFERENCES instructors (instructor_id),
    CONSTRAINT chk_sections_status
        CHECK (status IN ('planned','open','in_progress','grading','closed','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE section_instructors (
    section_id    BIGINT      NOT NULL,
    instructor_id BIGINT      NOT NULL,
    `role`        VARCHAR(20) NOT NULL DEFAULT 'co_instructor',
    PRIMARY KEY (section_id, instructor_id),
    KEY idx_sec_instr_instructor (instructor_id),
    CONSTRAINT fk_sec_instr_section
        FOREIGN KEY (section_id) REFERENCES course_sections (section_id),
    CONSTRAINT fk_sec_instr_instructor
        FOREIGN KEY (instructor_id) REFERENCES instructors (instructor_id),
    CONSTRAINT chk_sec_instr_role
        CHECK (`role` IN ('lead','co_instructor','lab_instructor','ta'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 9: STUDENTS & ENROLLMENT
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    student_id             BIGINT       NOT NULL AUTO_INCREMENT,
    student_code           VARCHAR(50)  NOT NULL,
    name_th                VARCHAR(255) NOT NULL,
    name_en                VARCHAR(255) NULL,
    program_id             BIGINT       NOT NULL,
    curriculum_version_id  BIGINT       NOT NULL,
    admit_academic_year_id BIGINT       NULL,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id),
    UNIQUE KEY uq_students_code (student_code),
    KEY idx_students_program (program_id),
    KEY idx_students_curriculum (curriculum_version_id),
    KEY idx_students_admit_year (admit_academic_year_id),
    CONSTRAINT fk_students_program
        FOREIGN KEY (program_id) REFERENCES programs (program_id),
    CONSTRAINT fk_students_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id),
    CONSTRAINT fk_students_admit_year
        FOREIGN KEY (admit_academic_year_id) REFERENCES academic_years (academic_year_id),
    CONSTRAINT chk_students_status
        CHECK (status IN ('active','on_leave','graduated','withdrawn','dismissed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
    enrollment_id   BIGINT      NOT NULL AUTO_INCREMENT,
    student_id      BIGINT      NOT NULL,
    section_id      BIGINT      NOT NULL,
    enrollment_date DATE        NOT NULL DEFAULT (CURRENT_DATE),
    final_grade     VARCHAR(5)  NULL,
    grade_status    VARCHAR(20) NOT NULL DEFAULT 'enrolled',
    PRIMARY KEY (enrollment_id),
    UNIQUE KEY uq_enrollments (student_id, section_id),
    KEY idx_enrollments_section (section_id),
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES students (student_id),
    CONSTRAINT fk_enrollments_section
        FOREIGN KEY (section_id) REFERENCES course_sections (section_id),
    CONSTRAINT chk_enrollments_status
        CHECK (grade_status IN ('enrolled','completed','withdrawn','failed','incomplete'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 10: ASSESSMENT INSTRUMENTS & CLO-LEVEL SCORING
-- ----------------------------------------------------------------------------
CREATE TABLE assessment_methods (
    assessment_method_id BIGINT       NOT NULL AUTO_INCREMENT,
    name_th              VARCHAR(255) NOT NULL,
    name_en              VARCHAR(255) NULL,
    category             VARCHAR(20)  NOT NULL,
    PRIMARY KEY (assessment_method_id),
    CONSTRAINT chk_assess_method_category
        CHECK (category IN ('exam','quiz','assignment','project','presentation','practicum','participation','other'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assessment_instruments (
    instrument_id        BIGINT       NOT NULL AUTO_INCREMENT,
    section_id           BIGINT       NOT NULL,
    assessment_method_id BIGINT       NOT NULL,
    title                VARCHAR(255) NOT NULL,
    max_score            DECIMAL(6,2) NOT NULL,
    weight_percent       DECIMAL(5,2) NULL,
    assessment_date      DATE         NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (instrument_id),
    KEY idx_instruments_section (section_id),
    KEY idx_instruments_method (assessment_method_id),
    CONSTRAINT fk_instruments_section
        FOREIGN KEY (section_id) REFERENCES course_sections (section_id),
    CONSTRAINT fk_instruments_method
        FOREIGN KEY (assessment_method_id) REFERENCES assessment_methods (assessment_method_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clo_instrument_map (
    clo_instrument_map_id BIGINT       NOT NULL AUTO_INCREMENT,
    instrument_id         BIGINT       NOT NULL,
    clo_id                BIGINT       NOT NULL,
    max_score_allocated   DECIMAL(6,2) NOT NULL,
    PRIMARY KEY (clo_instrument_map_id),
    UNIQUE KEY uq_cim (instrument_id, clo_id),
    KEY idx_cim_clo (clo_id),
    CONSTRAINT fk_cim_instrument
        FOREIGN KEY (instrument_id) REFERENCES assessment_instruments (instrument_id),
    CONSTRAINT fk_cim_clo
        FOREIGN KEY (clo_id) REFERENCES clos (clo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Which behavioural objectives a given CLO-instrument pairing evidences.
-- Traceability only: it feeds no attainment calculation, exactly as
-- ObjectiveAssessment does not in the application schema.
CREATE TABLE clo_objective_instrument_map (
    coi_map_id            BIGINT NOT NULL AUTO_INCREMENT,
    clo_instrument_map_id BIGINT NOT NULL,
    clo_objective_id      BIGINT NOT NULL,
    PRIMARY KEY (coi_map_id),
    UNIQUE KEY uq_coi_map (clo_instrument_map_id, clo_objective_id),
    KEY idx_coi_objective (clo_objective_id),
    CONSTRAINT fk_coi_cim
        FOREIGN KEY (clo_instrument_map_id) REFERENCES clo_instrument_map (clo_instrument_map_id),
    CONSTRAINT fk_coi_objective
        FOREIGN KEY (clo_objective_id) REFERENCES clo_objectives (clo_objective_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_clo_scores (
    student_clo_score_id BIGINT       NOT NULL AUTO_INCREMENT,
    enrollment_id        BIGINT       NOT NULL,
    instrument_id        BIGINT       NOT NULL,
    clo_id               BIGINT       NOT NULL,
    raw_score            DECIMAL(6,2) NOT NULL,
    max_score            DECIMAL(6,2) NOT NULL,
    percent_score        DECIMAL(5,2) GENERATED ALWAYS AS
                             (CASE WHEN max_score > 0 THEN (raw_score / max_score) * 100 ELSE NULL END) STORED,
    graded_by            BIGINT       NULL,
    graded_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_clo_score_id),
    UNIQUE KEY uq_scores (enrollment_id, instrument_id, clo_id),
    KEY idx_scores_clo (clo_id),
    KEY idx_scores_instrument (instrument_id),
    KEY idx_scores_graded_by (graded_by),
    CONSTRAINT fk_scores_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES enrollments (enrollment_id),
    CONSTRAINT fk_scores_instrument
        FOREIGN KEY (instrument_id) REFERENCES assessment_instruments (instrument_id),
    CONSTRAINT fk_scores_clo
        FOREIGN KEY (clo_id) REFERENCES clos (clo_id),
    CONSTRAINT fk_scores_graded_by
        FOREIGN KEY (graded_by) REFERENCES instructors (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 11: ATTAINMENT AGGREGATION (CLO -> PLO ROLLUP)
-- ----------------------------------------------------------------------------
CREATE TABLE clo_attainment_results (
    clo_attainment_id       BIGINT       NOT NULL AUTO_INCREMENT,
    section_id              BIGINT       NOT NULL,
    clo_id                  BIGINT       NOT NULL,
    target_percent          DECIMAL(5,2) NOT NULL,
    students_meeting_target INT          NOT NULL,
    total_students_assessed INT          NOT NULL,
    attainment_percent      DECIMAL(5,2) NOT NULL,
    average_score_percent   DECIMAL(5,2) NULL,
    computed_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (clo_attainment_id),
    UNIQUE KEY uq_clo_attainment (section_id, clo_id),
    KEY idx_clo_attainment_clo (clo_id),
    CONSTRAINT fk_clo_attain_section
        FOREIGN KEY (section_id) REFERENCES course_sections (section_id),
    CONSTRAINT fk_clo_attain_clo
        FOREIGN KEY (clo_id) REFERENCES clos (clo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plo_attainment_results (
    plo_attainment_id  BIGINT       NOT NULL AUTO_INCREMENT,
    program_id         BIGINT       NOT NULL,
    plo_id             BIGINT       NOT NULL,
    academic_year_id   BIGINT       NOT NULL,
    cohort_label       VARCHAR(50)  NOT NULL DEFAULT '',
    attainment_percent DECIMAL(5,2) NOT NULL,
    students_included  INT          NOT NULL,
    computed_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (plo_attainment_id),
    UNIQUE KEY uq_plo_attainment (program_id, plo_id, academic_year_id, cohort_label),
    KEY idx_plo_attainment_plo (plo_id),
    KEY idx_plo_attainment_year (academic_year_id),
    CONSTRAINT fk_plo_attain_program
        FOREIGN KEY (program_id) REFERENCES programs (program_id),
    CONSTRAINT fk_plo_attain_plo
        FOREIGN KEY (plo_id) REFERENCES plos (plo_id),
    CONSTRAINT fk_plo_attain_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years (academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 12: FIELD EXPERIENCE / PRACTICUM TRACKING
-- ----------------------------------------------------------------------------
CREATE TABLE field_experience_types (
    field_experience_type_id BIGINT       NOT NULL AUTO_INCREMENT,
    name_th                  VARCHAR(255) NOT NULL,
    name_en                  VARCHAR(255) NULL,
    PRIMARY KEY (field_experience_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE field_experience_learning_outcomes (
    field_experience_outcome_id BIGINT       NOT NULL AUTO_INCREMENT,
    field_experience_type_id    BIGINT       NOT NULL,
    description_th              TEXT         NOT NULL,
    plo_id                      BIGINT       NULL,
    evaluation_tool_th          VARCHAR(255) NULL,
    PRIMARY KEY (field_experience_outcome_id),
    KEY idx_felo_type (field_experience_type_id),
    KEY idx_felo_plo (plo_id),
    CONSTRAINT fk_felo_type
        FOREIGN KEY (field_experience_type_id) REFERENCES field_experience_types (field_experience_type_id),
    CONSTRAINT fk_felo_plo
        FOREIGN KEY (plo_id) REFERENCES plos (plo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE field_experience_placements (
    placement_id             BIGINT       NOT NULL AUTO_INCREMENT,
    student_id               BIGINT       NOT NULL,
    field_experience_type_id BIGINT       NOT NULL,
    course_id                BIGINT       NULL,
    term_id                  BIGINT       NOT NULL,
    host_organization_name   VARCHAR(255) NULL,
    external_supervisor_name VARCHAR(255) NULL,
    faculty_advisor_id       BIGINT       NULL,
    start_date               DATE         NULL,
    end_date                 DATE         NULL,
    total_hours              DECIMAL(6,1) NULL,
    overall_result           VARCHAR(20)  NULL,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (placement_id),
    KEY idx_placements_student (student_id),
    KEY idx_placements_type (field_experience_type_id),
    KEY idx_placements_course (course_id),
    KEY idx_placements_term (term_id),
    KEY idx_placements_advisor (faculty_advisor_id),
    CONSTRAINT fk_placements_student
        FOREIGN KEY (student_id) REFERENCES students (student_id),
    CONSTRAINT fk_placements_type
        FOREIGN KEY (field_experience_type_id) REFERENCES field_experience_types (field_experience_type_id),
    CONSTRAINT fk_placements_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
    CONSTRAINT fk_placements_term
        FOREIGN KEY (term_id) REFERENCES terms (term_id),
    CONSTRAINT fk_placements_advisor
        FOREIGN KEY (faculty_advisor_id) REFERENCES instructors (instructor_id),
    CONSTRAINT chk_placements_result
        CHECK (overall_result IN ('pass','fail','in_progress'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE field_experience_scores (
    field_experience_score_id   BIGINT       NOT NULL AUTO_INCREMENT,
    placement_id                BIGINT       NOT NULL,
    field_experience_outcome_id BIGINT       NOT NULL,
    evaluator_type              VARCHAR(20)  NOT NULL,
    score                       DECIMAL(5,2) NULL,
    max_score                   DECIMAL(5,2) NULL,
    comments                    TEXT         NULL,
    scored_at                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (field_experience_score_id),
    KEY idx_fe_scores_placement (placement_id),
    KEY idx_fe_scores_outcome (field_experience_outcome_id),
    CONSTRAINT fk_fe_scores_placement
        FOREIGN KEY (placement_id) REFERENCES field_experience_placements (placement_id),
    CONSTRAINT fk_fe_scores_outcome
        FOREIGN KEY (field_experience_outcome_id) REFERENCES field_experience_learning_outcomes (field_experience_outcome_id),
    CONSTRAINT chk_fe_scores_evaluator
        CHECK (evaluator_type IN ('industry_supervisor','faculty_advisor','self'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 13: AUDIT / CHANGE LOG
-- ----------------------------------------------------------------------------
CREATE TABLE curriculum_change_log (
    change_log_id         BIGINT       NOT NULL AUTO_INCREMENT,
    curriculum_version_id BIGINT       NOT NULL,
    entity_table          VARCHAR(100) NOT NULL,
    entity_id             BIGINT       NULL,
    change_description    TEXT         NOT NULL,
    changed_by            VARCHAR(100) NULL,
    changed_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (change_log_id),
    KEY idx_change_log_curriculum (curriculum_version_id),
    CONSTRAINT fk_change_log_curriculum
        FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions (curriculum_version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SECTION 14: REPORTING VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW v_course_catalog AS
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
    cat.name_th        AS category_name_th,
    parent.name_th     AS parent_category_name_th,
    ccm.requirement_type,
    cv.revision_label_th
FROM courses c
JOIN course_category_map ccm ON ccm.course_id = c.course_id
JOIN course_categories cat   ON cat.category_id = ccm.category_id
LEFT JOIN course_categories parent ON parent.category_id = cat.parent_category_id
JOIN curriculum_versions cv  ON cv.curriculum_version_id = ccm.curriculum_version_id;

CREATE OR REPLACE VIEW v_study_plan AS
SELECT
    spt.curriculum_version_id,
    spt.year_no,
    spt.term_no,
    spt.term_label_th,
    COALESCE(c.course_code, '9064XXXX/XXXXXXXX')     AS course_code,
    COALESCE(c.name_th, spc.elective_slot_label_th)  AS course_or_slot_name_th,
    spc.credits_at_placement,
    spt.total_credits AS term_total_credits
FROM study_plan_terms spt
JOIN study_plan_courses spc ON spc.study_plan_term_id = spt.study_plan_term_id
LEFT JOIN courses c ON c.course_id = spc.course_id
ORDER BY spt.year_no, spt.term_no, spc.sort_order;

CREATE OR REPLACE VIEW v_clo_attainment_summary AS
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
JOIN courses co         ON co.course_id = cs.course_id
JOIN terms t            ON t.term_id = cs.term_id
JOIN clos cl            ON cl.clo_id = car.clo_id;

CREATE OR REPLACE VIEW v_student_plo_progress AS
SELECT
    e.student_id,
    p.plo_id,
    p.plo_code,
    AVG(scs.percent_score * cpm.mapping_strength) / NULLIF(AVG(cpm.mapping_strength), 0) AS weighted_plo_score
FROM student_clo_scores scs
JOIN enrollments e   ON e.enrollment_id = scs.enrollment_id
JOIN clo_plo_map cpm ON cpm.clo_id = scs.clo_id
JOIN plos p          ON p.plo_id = cpm.plo_id
GROUP BY e.student_id, p.plo_id, p.plo_code;

-- Objective traceability: which behavioural objectives are actually evidenced
-- by an assessment instrument, and which exist only in the course outline.
CREATE OR REPLACE VIEW v_objective_coverage AS
SELECT
    co.course_id,
    co.course_code,
    cl.clo_code,
    o.objective_no,
    o.description_th,
    COUNT(coim.coi_map_id) AS evidenced_by_instruments,
    CASE WHEN COUNT(coim.coi_map_id) = 0 THEN 'NOT_ASSESSED' ELSE 'OK' END AS status
FROM clo_objectives o
JOIN clos    cl ON cl.clo_id    = o.clo_id
JOIN courses co ON co.course_id = cl.course_id
LEFT JOIN clo_objective_instrument_map coim
       ON coim.clo_objective_id = o.clo_objective_id
GROUP BY co.course_id, co.course_code, cl.clo_code,
         o.clo_objective_id, o.objective_no, o.description_th;

-- Curriculum-design audit: a PLO that no CLO maps to is a promise the course
-- structure never actually measures.
CREATE OR REPLACE VIEW v_plo_coverage_audit AS
SELECT
    cv.curriculum_version_id,
    cv.revision_label_th,
    p.plo_id,
    p.plo_code,
    COUNT(m.clo_plo_map_id) AS mapped_clo_count,
    CASE WHEN COUNT(m.clo_plo_map_id) = 0 THEN 'UNMAPPED' ELSE 'OK' END AS status
FROM plos p
JOIN curriculum_versions cv ON cv.curriculum_version_id = p.curriculum_version_id
LEFT JOIN clo_plo_map m ON m.plo_id = p.plo_id
GROUP BY cv.curriculum_version_id, cv.revision_label_th,
         p.plo_id, p.plo_code;

-- ============================================================================
-- END — 38 tables, 6 views. Reverse-engineer in MySQL Workbench:
--   Database > Reverse Engineer... (against a DB where this ran)  OR
--   File > Import > Reverse Engineer MySQL Create Script... (this .sql file)
-- ============================================================================
