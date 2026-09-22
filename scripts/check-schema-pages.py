# -*- coding: utf-8 -*-
"""ยืนยันว่าหน้าเอกสารที่บรรยายฐานข้อมูล ยังตรงกับ database/schema.prisma

   ทำไมต้องมี: `database-preview.html` ผิดอยู่เกือบสองเดือนโดยไม่มีใครรู้ —
   ยังพูดถึงตาราง `Curriculum` ที่ถูกตัดตามมติ 2.7 และขาด 4 model ที่เพิ่มเข้ามา
   ทีหลัง การแก้เนื้อหาครั้งเดียวคือแก้อาการ · สคริปต์นี้แก้สาเหตุ คือไม่มีใคร
   รู้ว่าหน้านี้ต้องตามเมื่อ schema ขยับ

     python scripts/check-schema-pages.py
     exit 0 = ตรง · exit 1 = ไม่ตรง (บอกว่าขาดอะไร เกินอะไร)
"""
import io
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / 'database' / 'schema.prisma'
PAGE = ROOT / 'docs' / 'pages' / 'database-preview.html'

# ตารางที่เคยมีแล้วถูกตัดออก · ถ้ากลับมาโผล่ในหน้าอีกแปลว่าหน้าเก่ากว่ามติ
RETIRED = {
    'Curriculum': 'ตัดตามมติ 2.7 (2026-08-04) — ระบบเป็น single-tenant ระดับรายวิชา',
    'CurriculumCourse': 'ตัดพร้อม Curriculum',
    'Institution': 'ไม่เคยอยู่ใน schema v4',
    'GradeScheme': 'ยุบเข้า GradeBand (2026-09-06)',
    'GradeRun': 'ยุบเข้า StudentGrade (2026-09-06)',
}


def models_in_schema():
    text = io.open(SCHEMA, encoding='utf-8').read()
    return re.findall(r'^model\s+(\w+)', text, re.M)


def word_present(page, name):
    """นับเฉพาะที่ปรากฏเป็นคำเต็ม — 'Course' ต้องไม่ไปเจอใน 'CourseInstructor'"""
    return re.search(r'(?<![A-Za-z0-9_])' + re.escape(name) + r'(?![A-Za-z0-9_])', page) is not None


def main():
    for f in (SCHEMA, PAGE):
        if not f.exists():
            print('ไม่พบไฟล์:', f)
            return 1

    models = models_in_schema()
    page = io.open(PAGE, encoding='utf-8').read()
    # ส่วนที่อธิบายว่าตารางไหนถูกตัดออก ไม่ควรถูกนับว่าเป็นการใช้งานตารางนั้น
    # ใช้คู่คอมเมนต์เป็นขอบเขต ไม่ใช่แอตทริบิวต์ + regex หา tag ปิด — เพราะ
    # regex แบบนั้นหยุดที่ </code> ตัวแรกที่เจอ ไม่ใช่ที่ tag ปิดของบล็อกจริง
    page_wo_notes = re.sub(r'<!--\s*retired-note\s*-->.*?<!--\s*/retired-note\s*-->',
                           '', page, flags=re.S)

    missing = [m for m in models if not word_present(page, m)]
    zombies = [(m, why) for m, why in RETIRED.items() if word_present(page_wo_notes, m)]

    print('schema.prisma มี %d model' % len(models))
    print('หน้าอ้างถึงครบ  %d/%d' % (len(models) - len(missing), len(models)))

    if not missing and not zombies:
        print('\ntrง — database-preview.html ตรงกับ schema.prisma'.replace('trง', 'ตรง'))
        return 0

    if missing:
        print('\nขาดใน database-preview.html:')
        for m in missing:
            print('   ✕ %s' % m)
    if zombies:
        print('\nตารางที่ถูกตัดออกแล้วแต่ยังอยู่ในหน้า:')
        for m, why in zombies:
            print('   ✕ %-18s %s' % (m, why))
        print('\n   (ถ้าตั้งใจกล่าวถึงในฐานะบันทึกว่าเคยตัดออก ให้ครอบด้วย'
              ' <!--retired-note--> … <!--/retired-note--> เพื่อไม่ให้ถูกนับ)')
    return 1


if __name__ == '__main__':
    sys.exit(main())
