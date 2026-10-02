-- ============================================================================
-- SEED DATA — populated directly from the uploaded curriculum document:
-- "หลักสูตรครุศาสตรอุตสาหกรรมบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์ (ค.อ.บ.),
--  หลักสูตรปรับปรุง พ.ศ. 2567", สจล.
--
-- All FK lookups use natural keys (course_code, plo_code, etc.) via
-- subqueries so this script does not depend on generated ID values.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Institution / Faculty / Department / Program / Curriculum version
-- ----------------------------------------------------------------------------
INSERT INTO institutions (name_th, name_en) VALUES
('สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง', 'King Mongkut''s Institute of Technology Ladkrabang');

INSERT INTO faculties (institution_id, name_th, name_en)
SELECT institution_id, 'คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี', 'Faculty of Industrial Education and Technology'
FROM institutions WHERE name_en = 'King Mongkut''s Institute of Technology Ladkrabang';

INSERT INTO departments (faculty_id, name_th, name_en)
SELECT faculty_id, 'ภาควิชาครุศาสตร์วิศวกรรม', 'Department of Technical Education'
FROM faculties WHERE name_th = 'คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี';

INSERT INTO programs (department_id, name_th, name_en, degree_full_th, degree_full_en, degree_short_th, degree_short_en, major_track)
SELECT department_id,
       'ครุศาสตร์อุตสาหกรรมบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์',
       'Bachelor of Science in Industrial Education Program in Computer Technology',
       'ครุศาสตร์อุตสาหกรรมบัณฑิต (เทคโนโลยีคอมพิวเตอร์)',
       'Bachelor of Science in Industrial Education (Computer Technology)',
       'ค.อ.บ. (เทคโนโลยีคอมพิวเตอร์)',
       'B.S.Ind.Ed. (Computer Technology)',
       NULL
FROM departments WHERE name_th = 'ภาควิชาครุศาสตร์วิศวกรรม';

INSERT INTO curriculum_versions (program_id, revision_label_th, revision_year_be, revision_year_ce, total_credits, duration_years, degree_form, status)
SELECT program_id, 'หลักสูตรปรับปรุง พ.ศ. 2567', 2567, 2024, 132, 4, 'bachelor_4yr', 'active'
FROM programs WHERE degree_short_th = 'ค.อ.บ. (เทคโนโลยีคอมพิวเตอร์)';

-- Convenience: from here on, curriculum_version_id is looked up via this filter.
-- (revision_year_be = 2567)

-- ----------------------------------------------------------------------------
-- Course categories (หมวดวิชา / กลุ่มวิชา)
-- ----------------------------------------------------------------------------
INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT curriculum_version_id, NULL, 'หมวดวิชา', 'GEN_ED', 'หมวดวิชาศึกษาทั่วไป', 24, 1
FROM curriculum_versions WHERE revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT cv.curriculum_version_id, cc.category_id, 'กลุ่มวิชา', 'GEN_ED.IDENTITY', 'กลุ่มทักษะส่งเสริมอัตลักษณ์สถาบันฯ', 12, 1
FROM curriculum_versions cv JOIN course_categories cc ON cc.curriculum_version_id = cv.curriculum_version_id AND cc.code = 'GEN_ED'
WHERE cv.revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT cv.curriculum_version_id, cc.category_id, 'กลุ่มวิชา', 'GEN_ED.LANG', 'กลุ่มวิชาเลือกด้านภาษาและการสื่อสาร', 3, 2
FROM curriculum_versions cv JOIN course_categories cc ON cc.curriculum_version_id = cv.curriculum_version_id AND cc.code = 'GEN_ED'
WHERE cv.revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT cv.curriculum_version_id, cc.category_id, 'กลุ่มวิชา', 'GEN_ED.ELECTIVE', 'กลุ่มวิชาเลือกหมวดวิชาศึกษาทั่วไป', 9, 3
FROM curriculum_versions cv JOIN course_categories cc ON cc.curriculum_version_id = cv.curriculum_version_id AND cc.code = 'GEN_ED'
WHERE cv.revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT curriculum_version_id, NULL, 'หมวดวิชา', 'SPECIALIZED', 'หมวดวิชาเฉพาะ', 102, 2
FROM curriculum_versions WHERE revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT cv.curriculum_version_id, cc.category_id, 'กลุ่มวิชา', 'SPEC.TEACHER', 'กลุ่มวิชาชีพครู', 39, 1
FROM curriculum_versions cv JOIN course_categories cc ON cc.curriculum_version_id = cv.curriculum_version_id AND cc.code = 'SPECIALIZED'
WHERE cv.revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT cv.curriculum_version_id, cc.category_id, 'กลุ่มวิชา', 'SPEC.MAJOR', 'กลุ่มวิชาชีพเฉพาะสาขาวิชา', 63, 2
FROM curriculum_versions cv JOIN course_categories cc ON cc.curriculum_version_id = cv.curriculum_version_id AND cc.code = 'SPECIALIZED'
WHERE cv.revision_year_be = 2567;

INSERT INTO course_categories (curriculum_version_id, parent_category_id, category_level, code, name_th, required_credits, sort_order)
SELECT curriculum_version_id, NULL, 'หมวดวิชา', 'FREE_ELECTIVE', 'หมวดวิชาเลือกเสรี', 6, 3
FROM curriculum_versions WHERE revision_year_be = 2567;

-- ----------------------------------------------------------------------------
-- Courses — group 1: กลุ่มทักษะส่งเสริมอัตลักษณ์สถาบันฯ (12 credits, S/U graded)
-- ----------------------------------------------------------------------------
INSERT INTO courses (course_code, name_th, name_en, credits, lecture_hours, practice_hours, self_study_hours, grading_type, is_non_credit_prerequisite, course_type) VALUES
('90641004', 'โครงงานกลุ่ม 1', 'TEAM-PROJECT 1', 1, 0, 2, 1, 'pass_fail', FALSE, 'project'),
('90641005', 'โครงงานกลุ่ม 2', 'TEAM-PROJECT 2', 1, 0, 2, 1, 'pass_fail', FALSE, 'project'),
('90641006', 'โครงงานกลุ่ม 3', 'TEAM-PROJECT 3', 1, 0, 2, 1, 'pass_fail', FALSE, 'project'),
('90641007', 'พลเมืองดิจิทัล', 'DIGITAL CITIZEN', 3, 3, 0, 6, 'pass_fail', FALSE, 'standard'),
('90641008', 'พื้นฐานทักษะการสื่อสารภาษาอังกฤษ', 'INTRODUCTION TO ENGLISH COMMUNICATION SKILLS', 0, 0, 0, 45, 'pass_fail', TRUE, 'standard'),
('90641009', 'ทักษะการสื่อสารภาษาอังกฤษระหว่างวัฒนธรรม 1', 'INTERCULTURAL COMMUNICATION SKILLS IN ENGLISH 1', 3, 3, 0, 6, 'pass_fail', FALSE, 'standard'),
('90641010', 'ทักษะการสื่อสารภาษาอังกฤษระหว่างวัฒนธรรม 2', 'INTERCULTURAL COMMUNICATION SKILLS IN ENGLISH 2', 3, 3, 0, 6, 'pass_fail', FALSE, 'standard'),
-- group 2: language & communication elective (3 credits)
('90644049', 'ภาษาไทยเพื่อการสร้างสรรค์', 'THAI LANGUAGE FOR CREATIVITY', 3, 3, 0, 6, 'letter', FALSE, 'standard'),
-- group 3: teacher-profession courses (39 credits)
('03206107', 'พื้นฐานการศึกษาสำหรับวิชาชีพครู', 'EDUCATIONAL FOUNDATION FOR TEACHER PROFESSION', 3, 3, 0, 6, 'letter', FALSE, 'standard'),
('03206108', 'จิตวิทยาการศึกษาเพื่อพัฒนาผู้เรียน', 'EDUCATIONAL PSYCHOLOGY FOR LEARNER DEVELOPMENT', 3, 3, 0, 6, 'letter', FALSE, 'standard'),
('03206109', 'นวัตกรรมเทคโนโลยีการเรียนรู้', 'TECHNOLOGY INNOVATION FOR LEARNING', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03206110', 'ภาษาเพื่อการสื่อสารสำหรับครู', 'LANGUAGE FOR COMMUNICATION FOR TEACHERS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03206111', 'การวัดและประเมินผลการเรียนรู้', 'MEASUREMENT AND EVALUATION OF LEARNING', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03206112', 'การพัฒนาหลักสูตรและการจัดการเรียนรู้', 'CURRICULUM DEVELOPMENT AND LEARNING MANAGEMENT', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03206113', 'การวิจัยในชั้นเรียน', 'CLASSROOM RESEARCH', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03300007', 'การฝึกปฏิบัติวิชาชีพระหว่างเรียน 1', 'PROFESSIONAL TEACHING PRACTICE 1', 3, 0, 6, 3, 'letter', FALSE, 'teaching_practice'),
('03300008', 'การฝึกปฏิบัติวิชาชีพระหว่างเรียน 2', 'PROFESSIONAL TEACHING PRACTICE 2', 3, 0, 6, 3, 'letter', FALSE, 'teaching_practice'),
('03300009', 'การปฏิบัติการสอนในสถานศึกษา 1', 'TEACHING PRACTICE IN EDUCATIONAL INSTITUTE 1', 6, 0, 18, 9, 'letter', FALSE, 'teaching_practice'),
('03300010', 'การปฏิบัติการสอนในสถานศึกษา 2', 'TEACHING PRACTICE IN EDUCATIONAL INSTITUTE 2', 6, 0, 18, 9, 'letter', FALSE, 'teaching_practice'),
-- group 4: major-specific required courses (60 credits)
('03376116', 'พื้นฐานการออกแบบและพัฒนาซอฟต์แวร์', 'PRINCIPLE OF SOFTWARE DESIGN AND DEVELOPMENT', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376117', 'ระบบคอมพิวเตอร์', 'COMPUTER SYSTEMS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376118', 'อุปกรณ์และวงจรแอนะล็อกเบื้องต้น', 'FUNDAMENTAL OF ANALOG DEVICES AND CIRCUITS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376119', 'ความปลอดภัยในการทำงาน', 'OCCUPATIONAL HEALTH AND SAFETY', 3, 3, 0, 6, 'letter', FALSE, 'standard'),
('03376120', 'ระบบฐานข้อมูล', 'DATABASE SYSTEM', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376121', 'การออกแบบและพัฒนาซอฟต์แวร์ 1', 'SOFTWARE DESIGN AND DEVELOPMENT 1', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376122', 'เครือข่ายคอมพิวเตอร์', 'COMPUTER NETWORKS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376123', 'อุปกรณ์และวงจรดิจิทัลเบื้องต้น', 'FUNDAMENTAL OF DIGITAL DEVICES AND CIRCUITS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376124', 'การออกแบบและพัฒนาซอฟต์แวร์ 2', 'SOFTWARE DESIGN AND DEVELOPMENT 2', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376125', 'สื่อดิจิทัลเพื่อการเรียนรู้', 'DIGITAL MEDIA FOR LEARNING', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376126', 'ไมโครคอนโทรลเลอร์และการใช้งาน', 'APPLICATIONS OF MICROCONTROLLERS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376127', 'การพัฒนาซอฟต์แวร์สำหรับเว็บ', 'WEB SOFTWARE DEVELOPMENT', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376128', 'การรักษาความปลอดภัยและความเชื่อมั่นของสารสนเทศ', 'INFORMATION ASSURANCE AND SECURITY', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376129', 'เทคโนโลยีสารสนเทศเพื่อการจัดการเรียนรู้', 'INFORMATION SYSTEM FOR LEARNING MANAGEMENT', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376130', 'เซ็นเซอร์และทรานสดิวเซอร์', 'SENSORS AND TRANSDUCERS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376131', 'การฝึกงานอุตสาหกรรม', 'INDUSTRIAL TRAINING', 0, 0, 45, 0, 'pass_fail', TRUE, 'internship'),
('03376132', 'ปัญญาประดิษฐ์เพื่องานด้านการศึกษา', 'ARTIFICIAL INTELLIGENCE FOR EDUCATION', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376133', 'การพัฒนาซอฟต์แวร์สำหรับอุปกรณ์เคลื่อนที่', 'MOBILE DEVICES SOFTWARE DEVELOPMENT', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376134', 'การประยุกต์ใช้ไอโอที', 'APPLICATIONS OF INTERNET OF THINGS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376135', 'โครงงานนวัตกรรมเพื่อการเรียนรู้ 1', 'INNOVATION PROJECT FOR LEARNING 1', 3, 0, 6, 3, 'letter', FALSE, 'project'),
('03376136', 'โครงงานนวัตกรรมเพื่อการเรียนรู้ 2', 'INNOVATION PROJECT FOR LEARNING 2', 3, 0, 6, 3, 'letter', FALSE, 'project'),
-- group 5: major-specific elective pool (choose 3 credits from these 12)
('03376140', 'เกมเพื่อการเรียนรู้', 'GAME-BASED LEARNING', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376141', 'การพัฒนาเกมคอมพิวเตอร์', 'COMPUTER GAME DEVELOPMENT', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376142', 'พื้นฐานวิทยาการข้อมูล', 'PRINCIPLE OF DATA SCIENCE', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376143', 'การประมวลผลแบบกลุ่มเมฆ', 'CLOUD COMPUTING', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376144', 'ความปลอดภัยในการประมวลผลแบบกลุ่มเมฆ', 'CLOUD COMPUTING SECURITY', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376145', 'ระบบปฏิบัติการ', 'OPERATING SYSTEMS', 3, 3, 0, 6, 'letter', FALSE, 'standard'),
('03376146', 'อุปกรณ์และระบบฝังตัวแบบเรียลไทม์', 'REAL-TIME EMBEDDED COMPONENTS AND SYSTEMS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376147', 'การเชื่อมต่อแอนะล็อกกับไมโครโพรเซสเซอร์แบบฝังตัว', 'ANALOG INTERFACING TO EMBEDDED MICROPROCESSOR SYSTEMS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376148', 'เครือข่ายไมโครคอนโทรลเลอร์และการประยุกต์ใช้', 'MICROCONTROLLER NETWORKS AND APPLICATIONS', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376149', 'การออกแบบและการสร้างระบบสมองกลฝังตัว', 'EMBEDDED SYSTEM DESIGN AND IMPLEMENTATION', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376150', 'หัวข้อเฉพาะด้านคอมพิวเตอร์ 1', 'SPECIAL TOPICS IN COMPUTER 1', 3, 2, 2, 5, 'letter', FALSE, 'standard'),
('03376151', 'หัวข้อเฉพาะด้านคอมพิวเตอร์ 2', 'SPECIAL TOPICS IN COMPUTER 2', 3, 2, 2, 5, 'letter', FALSE, 'standard');

-- Parsed course code segments (auto-derived from the 8-digit codes above)
INSERT INTO course_code_segments (course_id, faculty_segment, subject_group_segment, degree_level_segment, sequence_segment)
SELECT course_id,
       substring(course_code from 1 for 2),
       substring(course_code from 3 for 2),
       substring(course_code from 5 for 1),
       substring(course_code from 6 for 3)
FROM courses;

-- ----------------------------------------------------------------------------
-- Course -> Category mapping
-- ----------------------------------------------------------------------------
-- Helper pattern used repeatedly below:
--   INSERT INTO course_category_map (curriculum_version_id, course_id, category_id, requirement_type)
--   SELECT cv.curriculum_version_id, c.course_id, cat.category_id, '<required|elective>'
--   FROM curriculum_versions cv, courses c, course_categories cat
--   WHERE cv.revision_year_be = 2567 AND c.course_code = '...' AND cat.code = '...';

INSERT INTO course_category_map (curriculum_version_id, course_id, category_id, requirement_type)
SELECT cv.curriculum_version_id, c.course_id, cat.category_id, 'required'
FROM curriculum_versions cv, courses c, course_categories cat
WHERE cv.revision_year_be = 2567 AND cat.code = 'GEN_ED.IDENTITY'
  AND c.course_code IN ('90641004','90641005','90641006','90641007','90641008','90641009','90641010');

INSERT INTO course_category_map (curriculum_version_id, course_id, category_id, requirement_type)
SELECT cv.curriculum_version_id, c.course_id, cat.category_id, 'required'
FROM curriculum_versions cv, courses c, course_categories cat
WHERE cv.revision_year_be = 2567 AND cat.code = 'GEN_ED.LANG' AND c.course_code = '90644049';

INSERT INTO course_category_map (curriculum_version_id, course_id, category_id, requirement_type)
SELECT cv.curriculum_version_id, c.course_id, cat.category_id, 'required'
FROM curriculum_versions cv, courses c, course_categories cat
WHERE cv.revision_year_be = 2567 AND cat.code = 'SPEC.TEACHER'
  AND c.course_code IN ('03206107','03206108','03206109','03206110','03206111','03206112','03206113',
                         '03300007','03300008','03300009','03300010');

INSERT INTO course_category_map (curriculum_version_id, course_id, category_id, requirement_type)
SELECT cv.curriculum_version_id, c.course_id, cat.category_id, 'required'
FROM curriculum_versions cv, courses c, course_categories cat
WHERE cv.revision_year_be = 2567 AND cat.code = 'SPEC.MAJOR'
  AND c.course_code IN ('03376116','03376117','03376118','03376119','03376120','03376121','03376122',
                         '03376123','03376124','03376125','03376126','03376127','03376128','03376129',
                         '03376130','03376131','03376132','03376133','03376134','03376135','03376136');

INSERT INTO course_category_map (curriculum_version_id, course_id, category_id, requirement_type)
SELECT cv.curriculum_version_id, c.course_id, cat.category_id, 'elective'
FROM curriculum_versions cv, courses c, course_categories cat
WHERE cv.revision_year_be = 2567 AND cat.code = 'SPEC.MAJOR'
  AND c.course_code IN ('03376140','03376141','03376142','03376143','03376144','03376145',
                         '03376146','03376147','03376148','03376149','03376150','03376151');

-- ----------------------------------------------------------------------------
-- Program Learning Outcomes (PLO codes referenced in the document;
-- full descriptions live in the program's TQF2/มคอ.2 and are not present
-- in the excerpted pages — description fields are placeholders to fill in).
-- ----------------------------------------------------------------------------
INSERT INTO plos (curriculum_version_id, plo_code, domain_no, sub_no, description_th)
SELECT cv.curriculum_version_id, x.plo_code, x.domain_no, x.sub_no, 'รายละเอียดเต็มตาม มคอ.2 (ไม่ปรากฏในหน้าเอกสารที่แนบ)'
FROM curriculum_versions cv
CROSS JOIN (VALUES
    ('PLO 1.1', 1, 1),
    ('PLO 2.1', 2, 1),
    ('PLO 2.2', 2, 2),
    ('PLO 2.3', 2, 3),
    ('PLO 2.4', 2, 4),
    ('PLO 2.5', 2, 5),
    ('PLO 2.6', 2, 6),
    ('PLO 3.1', 3, 1),
    ('PLO 4.1', 4, 1),
    ('PLO 4.2', 4, 2)
) AS x(plo_code, domain_no, sub_no)
WHERE cv.revision_year_be = 2567;

-- ----------------------------------------------------------------------------
-- Institutional identity / graduate attributes (Section 4.1)
-- ----------------------------------------------------------------------------
INSERT INTO identity_categories (curriculum_version_id, code, name_th)
SELECT curriculum_version_id, x.code, x.name_th
FROM curriculum_versions cv
CROSS JOIN (VALUES
    ('LIVE_LEARN', 'ใช้ชีวิตและเรียนรู้เป็น'),
    ('TEACH', 'สอนเป็น'),
    ('PRACTICE', 'ปฏิบัติเป็น')
) AS x(code, name_th)
WHERE cv.revision_year_be = 2567;

INSERT INTO identity_attributes (identity_category_id, name_th, sort_order)
SELECT ic.identity_category_id, 'ซื่อสัตย์', 1
FROM identity_categories ic WHERE ic.code = 'LIVE_LEARN'
UNION ALL
SELECT ic.identity_category_id, 'ใฝ่รู้', 2
FROM identity_categories ic WHERE ic.code = 'LIVE_LEARN';

-- ซื่อสัตย์: no PLO mapping given (institutional conduct standard, not PLO-tied)
INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th, assessment_method_th)
SELECT ia.identity_attribute_id, NULL,
       'ส่งเสริมเรื่องความตรงต่อเวลาในทุกรายวิชา; ปลูกฝังเรื่องความซื่อสัตย์ในการทำงาน การอ้างอิงผลงาน', NULL
FROM identity_attributes ia WHERE ia.name_th = 'ซื่อสัตย์';

-- ใฝ่รู้ -> PLO 4.2 and PLO 1.1
INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id,
       'จัดการเรียนรู้ในรูปแบบ Inquiry-Based Learning; ประเมินความก้าวหน้า (Formative) และประเมินผลสรุปรวม (Summative)'
FROM identity_attributes ia, plos p
WHERE ia.name_th = 'ใฝ่รู้' AND p.plo_code = 'PLO 4.2';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id,
       'ทดสอบความรู้เกี่ยวกับวิชาชีพครูและวิชาชีพเฉพาะ; แสดงบทบาทสมมติตามที่กำหนดในรายวิชา'
FROM identity_attributes ia, plos p
WHERE ia.name_th = 'ใฝ่รู้' AND p.plo_code = 'PLO 1.1';

-- สอนเป็น -> PLO 2.1, 3.1, 4.1 (category itself used as the attribute here)
INSERT INTO identity_attributes (identity_category_id, name_th, sort_order)
SELECT identity_category_id, 'สอนเป็น', 1 FROM identity_categories WHERE code = 'TEACH';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id,
       'จัดการเรียนรู้ในรูปแบบ Role Playing หรือ Active Learning หรือ Problem-Based Learning หรือ Inquiry-Based Learning'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'สอนเป็น' AND p.plo_code = 'PLO 2.1';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id, 'จัดการเรียนรู้ในรูปแบบ Role Playing'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'สอนเป็น' AND p.plo_code = 'PLO 3.1';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id, 'จัดการเรียนรู้ในรูปแบบ Active Learning หรือ Problem-Based Learning'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'สอนเป็น' AND p.plo_code = 'PLO 4.1';

-- ปฏิบัติเป็น -> PLO 2.2 - 2.6
INSERT INTO identity_attributes (identity_category_id, name_th, sort_order)
SELECT identity_category_id, 'ปฏิบัติเป็น', 1 FROM identity_categories WHERE code = 'PRACTICE';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id,
       'จัดการเรียนในลักษณะทฤษฎีควบคู่กับปฏิบัติ; กำหนดโจทย์ให้ผู้เรียนค้นหาคำตอบและปฏิบัติ; ทดสอบภาคปฏิบัติตามสมรรถนะที่กำหนด'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'ปฏิบัติเป็น' AND p.plo_code = 'PLO 2.2';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id,
       'ใช้กรณีศึกษาให้นักศึกษาฝึกปฏิบัติตาม; กำหนดโจทย์ให้ผู้เรียนค้นหาคำตอบและปฏิบัติ; มอบหมายการทำโครงงานในรายวิชา'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'ปฏิบัติเป็น' AND p.plo_code = 'PLO 2.3';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id, 'จัดการเรียนรู้ในรูปแบบ Active Learning และ Problem-Based Learning'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'ปฏิบัติเป็น' AND p.plo_code = 'PLO 2.4';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id, 'จัดการเรียนรู้ในรูปแบบ Project-Based Learning หรือ Problem-Based Learning'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'ปฏิบัติเป็น' AND p.plo_code = 'PLO 2.5';

INSERT INTO identity_attribute_plo_map (identity_attribute_id, plo_id, teaching_method_th)
SELECT ia.identity_attribute_id, p.plo_id, 'จัดการเรียนรู้ในรูปแบบ Project-Based Learning'
FROM identity_attributes ia, plos p WHERE ia.name_th = 'ปฏิบัติเป็น' AND p.plo_code = 'PLO 2.6';

-- ----------------------------------------------------------------------------
-- Study plan terms (3.3.3 แผนการศึกษา) — 4 years x up to 2 regular terms + 1 special term
-- ----------------------------------------------------------------------------
INSERT INTO study_plan_terms (curriculum_version_id, year_no, term_no, term_label_th, term_type, total_credits)
SELECT cv.curriculum_version_id, x.year_no, x.term_no, x.label, x.term_type, x.total_credits
FROM curriculum_versions cv
CROSS JOIN (VALUES
    (1, 1, 'ปีที่ 1 ภาคการศึกษาที่ 1', 'regular', 21),
    (1, 2, 'ปีที่ 1 ภาคการศึกษาที่ 2', 'regular', 22),
    (2, 1, 'ปีที่ 2 ภาคการศึกษาที่ 1', 'regular', 21),
    (2, 2, 'ปีที่ 2 ภาคการศึกษาที่ 2', 'regular', 22),
    (2, 0, 'ปีที่ 2 ภาคการศึกษาพิเศษ', 'special', 0),
    (3, 1, 'ปีที่ 3 ภาคการศึกษาที่ 1', 'regular', 18),
    (3, 2, 'ปีที่ 3 ภาคการศึกษาที่ 2', 'regular', 16),
    (4, 1, 'ปีที่ 4 ภาคการศึกษาที่ 1', 'regular', 6),
    (4, 2, 'ปีที่ 4 ภาคการศึกษาที่ 2', 'regular', 6)
) AS x(year_no, term_no, label, term_type, total_credits)
WHERE cv.revision_year_be = 2567;

-- Helper macro pattern for course placements:
--   INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
--   SELECT spt.study_plan_term_id, c.course_id, c.credits, <n>
--   FROM study_plan_terms spt, courses c
--   WHERE spt.year_no = <y> AND spt.term_no = <t> AND c.course_code = '<code>';

-- Year 1 / Term 1
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, ord.n
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN (VALUES ('03376116',1),('03376117',2),('03376118',3),('03376119',4),('03376120',5),
             ('03206107',6),('03206108',7),('90641008',8)) AS ord(code,n) ON TRUE
JOIN courses c ON c.course_code = ord.code
WHERE spt.year_no = 1 AND spt.term_no = 1;

-- Year 1 / Term 2
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, ord.n
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN (VALUES ('03376121',1),('03376122',2),('03376123',3),('03206109',4),('03206110',5),
             ('90641007',6),('90644049',7),('90641004',8)) AS ord(code,n) ON TRUE
JOIN courses c ON c.course_code = ord.code
WHERE spt.year_no = 1 AND spt.term_no = 2;

-- Year 2 / Term 1 (includes 2 elective placeholder slots)
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, ord.n
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN (VALUES ('03376124',1),('03376125',2),('03376126',3),('03206111',4),('90641009',5)) AS ord(code,n) ON TRUE
JOIN courses c ON c.course_code = ord.code
WHERE spt.year_no = 2 AND spt.term_no = 1;

INSERT INTO study_plan_courses (study_plan_term_id, category_id, elective_slot_label_th, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, cat.category_id, 'วิชาเลือกหมวดศึกษาทั่วไป (วิชาที่ 1)', 3, 6
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN course_categories cat ON cat.curriculum_version_id = cv.curriculum_version_id AND cat.code = 'GEN_ED.ELECTIVE'
WHERE spt.year_no = 2 AND spt.term_no = 1;

INSERT INTO study_plan_courses (study_plan_term_id, category_id, elective_slot_label_th, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, cat.category_id, 'วิชาเลือกเสรี (วิชาที่ 1)', 3, 7
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN course_categories cat ON cat.curriculum_version_id = cv.curriculum_version_id AND cat.code = 'FREE_ELECTIVE'
WHERE spt.year_no = 2 AND spt.term_no = 1;

-- Year 2 / Term 2
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, ord.n
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN (VALUES ('03376127',1),('03376128',2),('03376129',3),('03376130',4),('03206112',5),
             ('03206113',6),('90641010',7),('90641005',8)) AS ord(code,n) ON TRUE
JOIN courses c ON c.course_code = ord.code
WHERE spt.year_no = 2 AND spt.term_no = 2;

-- Year 2 / Special term
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, 1
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN courses c ON c.course_code = '03376131'
WHERE spt.year_no = 2 AND spt.term_no = 0;

-- Year 3 / Term 1 (includes 1 elective placeholder)
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, ord.n
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN (VALUES ('03300007',1),('03376132',2),('03376133',3),('03376134',4),('03376135',5)) AS ord(code,n) ON TRUE
JOIN courses c ON c.course_code = ord.code
WHERE spt.year_no = 3 AND spt.term_no = 1;

INSERT INTO study_plan_courses (study_plan_term_id, category_id, elective_slot_label_th, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, cat.category_id, 'วิชาเลือกหมวดศึกษาทั่วไป (วิชาที่ 2)', 3, 6
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN course_categories cat ON cat.curriculum_version_id = cv.curriculum_version_id AND cat.code = 'GEN_ED.ELECTIVE'
WHERE spt.year_no = 3 AND spt.term_no = 1;

-- Year 3 / Term 2 (includes 3 elective placeholders: major elective, gen-ed elective, free elective)
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, ord.n
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN (VALUES ('03300008',1),('03376136',2),('90641006',3)) AS ord(code,n) ON TRUE
JOIN courses c ON c.course_code = ord.code
WHERE spt.year_no = 3 AND spt.term_no = 2;

INSERT INTO study_plan_courses (study_plan_term_id, category_id, elective_slot_label_th, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, cat.category_id, 'วิชาเลือกหมวดวิชาชีพเฉพาะสาขาวิชา', 3, 4
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN course_categories cat ON cat.curriculum_version_id = cv.curriculum_version_id AND cat.code = 'SPEC.MAJOR'
WHERE spt.year_no = 3 AND spt.term_no = 2;

INSERT INTO study_plan_courses (study_plan_term_id, category_id, elective_slot_label_th, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, cat.category_id, 'วิชาเลือกหมวดศึกษาทั่วไป (วิชาที่ 3)', 3, 5
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN course_categories cat ON cat.curriculum_version_id = cv.curriculum_version_id AND cat.code = 'GEN_ED.ELECTIVE'
WHERE spt.year_no = 3 AND spt.term_no = 2;

INSERT INTO study_plan_courses (study_plan_term_id, category_id, elective_slot_label_th, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, cat.category_id, 'วิชาเลือกเสรี (วิชาที่ 2)', 3, 6
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN course_categories cat ON cat.curriculum_version_id = cv.curriculum_version_id AND cat.code = 'FREE_ELECTIVE'
WHERE spt.year_no = 3 AND spt.term_no = 2;

-- Year 4 / Term 1 & 2
INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, 1
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN courses c ON c.course_code = '03300009'
WHERE spt.year_no = 4 AND spt.term_no = 1;

INSERT INTO study_plan_courses (study_plan_term_id, course_id, credits_at_placement, sort_order)
SELECT spt.study_plan_term_id, c.course_id, c.credits, 1
FROM study_plan_terms spt
JOIN curriculum_versions cv ON cv.curriculum_version_id = spt.curriculum_version_id AND cv.revision_year_be = 2567
JOIN courses c ON c.course_code = '03300010'
WHERE spt.year_no = 4 AND spt.term_no = 2;

-- ----------------------------------------------------------------------------
-- Field experience types & learning outcomes (Section 3.4)
-- ----------------------------------------------------------------------------
INSERT INTO field_experience_types (name_th, name_en) VALUES
('การฝึกงานอุตสาหกรรม', 'Industrial Training'),
('การปฏิบัติการสอนในสถานศึกษา', 'Teaching Practice in Educational Institute');

INSERT INTO field_experience_learning_outcomes (field_experience_type_id, description_th, plo_id, evaluation_tool_th)
SELECT fet.field_experience_type_id,
       'พัฒนาบุคลิกภาพ การวางตัว และการมนุษยสัมพันธ์ที่ดีในการทำงานร่วมกับผู้อื่น',
       p.plo_id,
       'แบบประเมินผลการฝึกงาน คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี สจล. โดยผู้ดูแลการฝึกงานจากภาคอุตสาหกรรมและอาจารย์นิเทศก์'
FROM field_experience_types fet, plos p
WHERE fet.name_th = 'การฝึกงานอุตสาหกรรม' AND p.plo_code = 'PLO 3.1';

INSERT INTO field_experience_learning_outcomes (field_experience_type_id, description_th, plo_id, evaluation_tool_th)
SELECT fet.field_experience_type_id,
       'แสดงออกถึงการบูรณาการด้านวิชาชีพเข้ากับการทำงาน',
       p.plo_id,
       'แบบประเมินผลการฝึกงาน คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี สจล. โดยผู้ดูแลการฝึกงานจากภาคอุตสาหกรรมและอาจารย์นิเทศก์'
FROM field_experience_types fet, plos p
WHERE fet.name_th = 'การฝึกงานอุตสาหกรรม' AND p.plo_code IN ('PLO 1.1', 'PLO 3.1');

INSERT INTO field_experience_learning_outcomes (field_experience_type_id, description_th, plo_id, evaluation_tool_th)
SELECT fet.field_experience_type_id,
       'แก้ปัญหาหรือหาแนวทางการแก้ปัญหาต่าง ๆ ในการทำงานได้อย่างเหมาะสม',
       p.plo_id,
       'แบบประเมินผลการฝึกงาน คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี สจล. โดยผู้ดูแลการฝึกงานจากภาคอุตสาหกรรมและอาจารย์นิเทศก์'
FROM field_experience_types fet, plos p
WHERE fet.name_th = 'การฝึกงานอุตสาหกรรม' AND p.plo_code IN ('PLO 4.1', 'PLO 4.2');

-- ----------------------------------------------------------------------------
-- Assessment method reference list (generic — extend as needed)
-- ----------------------------------------------------------------------------
INSERT INTO assessment_methods (name_th, name_en, category) VALUES
('ข้อสอบกลางภาค', 'Midterm Exam', 'exam'),
('ข้อสอบปลายภาค', 'Final Exam', 'exam'),
('แบบทดสอบย่อย', 'Quiz', 'quiz'),
('งานที่ได้รับมอบหมาย', 'Assignment', 'assignment'),
('โครงงาน', 'Project', 'project'),
('การนำเสนอผลงาน', 'Presentation', 'presentation'),
('ฝึกปฏิบัติ/ฝึกงาน', 'Practicum', 'practicum'),
('การมีส่วนร่วมในชั้นเรียน', 'Class Participation', 'participation');

COMMIT;