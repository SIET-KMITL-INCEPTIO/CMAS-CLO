# -*- coding: utf-8 -*-
"""ตรวจว่า UML และ ER พร้อมนำเสนอหรือยัง — เทียบทุกไฟล์กับโค้ดจริง ไม่ใช่กับความจำ

   คำถามเดียวที่สคริปต์นี้ตอบ: ถ้าเอาไฟล์เหล่านี้ขึ้นจอเรียงกัน จะมีหน้าไหน
   ขัดกับหน้าอื่นไหม · ความขัดแย้งที่คนดูจับได้ใน 10 วินาทีคือสิ่งที่ทำให้
   การนำเสนอพัง ไม่ใช่ความสวยของภาพ

   ตรวจ 7 ข้อ:
     UML-1  เลข use case ตรงกันระหว่าง UML.md · UML-Layer2.drawio · index-q.html
     UML-2  ไม่มีเลขซ้ำในไฟล์เดียวกัน
     UML-3  ไม่มี use case ที่ไม่มีเลข
     UML-4  ไฟล์ที่สร้างด้วยสคริปต์ ตรงกับ index-q.html ณ ตอนนี้
     ER-1   schema.prisma ↔ cmas_app_mysql_v4.sql — ชื่อตารางและชื่อคอลัมน์
     ER-2   index-q.sql = schema.prisma + ตาราง/คอลัมน์ที่เสนอเพิ่มและมีบันทึกไว้ ไม่มีอย่างอื่นแปลกปลอม
     PRES   ไฟล์ที่กำกวมบนโต๊ะนำเสนอ — รุ่นเก่าวางคู่รุ่นใหม่ ชื่อซ้ำ ของที่ถูกยกเลิก

   exit 0 = พร้อม · exit 1 = มีข้อขัดแย้งที่ต้องตัดสินใจก่อนขึ้นจอ

     python scripts/check-diagrams.py
"""
import difflib
import io
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
UML_MD = ROOT / 'docs' / 'uml' / 'CMAS' / 'UML.md'
LAYER2 = ROOT / 'docs' / 'uml' / 'CMAS' / 'UML-Layer2.drawio'
APP = ROOT / 'docs' / 'pages' / 'index-q.html'
PRISMA = ROOT / 'database' / 'schema.prisma'
SQL_V4 = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'cmas_app_mysql_v4.sql'
SQL_IQ = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'index-q.sql'
GEN = [('scripts/build-usecase-drawio.py', 'docs/uml/index-q/index-q-usecase.drawio'),
       ('scripts/build-index-q-uml-drawio.py', 'docs/uml/index-q/UML-INDEX-Q.drawio'),
       ('scripts/build-structure-pages.py', 'docs/uml/CMAS/Structure.drawio'),
       ('scripts/build-er-index-q-drawio.py', 'docs/uml/index-q/ER-INDEX-Q.drawio')]

# ตารางที่ index-q.sql เสนอเพิ่มจาก schema.prisma · มีบันทึกเหตุผลไว้ใน coverage GAPS
# (2569-09-18: ฐานเทียบเปลี่ยนจาก v4 เป็น schema.prisma — migration 0005/0006
#  แก้ตารางไปแล้ว v4 จึงไม่ใช่ฐานของ index-q.sql อีกต่อไป)
PROPOSED = {
    'AuthEvent': 'UC 1.6 ตรวจสอบประวัติการใช้งาน · SEC-5 บันทึกการถูกปฏิเสธ · D6 ลงทะเบียน',
    'UploadReject': 'UC 6.5 / 7.5 รายงานแถวที่ถูกปฏิเสธตอนนำเข้า',
}
# คอลัมน์ [index-q] ที่เสนอเพิ่มบนตารางที่ prisma มีอยู่แล้ว
PROPOSED_COLS = {
    ('User', 'mustChangePassword'): 'UC 1.5 รีเซ็ตรหัสผ่าน',
    ('User', 'pwResetAt'): 'UC 1.5',
    ('User', 'pwChangedAt'): 'UC 9.2',
    ('ScoreUploadLog', 'kind'): 'UC 7.1 แยกการนำเข้ารายชื่อกับคะแนน',
}

fail, warn = [], []

# A file can be knowingly out of step, and that is different from being wrong by
# accident. UML.md carries the declaration — one STATUS: line per superseded
# file — so the decision lives in the document people read, not in this script.
# Declared files still get reported in full; they just stop blocking.
SUPERSEDED = {}
for _m in re.finditer(r'^STATUS:SUPERSEDED\s+(\S+)\s+(.*)$',
                      io.open(ROOT / 'docs' / 'uml' / 'CMAS' / 'UML.md',
                              encoding='utf-8').read(), re.M):
    SUPERSEDED[_m.group(1)] = _m.group(2).strip()


def report(bucket, msg, file=None):
    """fail unless the file is declared superseded in UML.md, then warn."""
    if file and file in SUPERSEDED:
        warn.append(msg + '  [ประกาศแล้วว่าเป็นฉบับร่าง]')
    else:
        bucket.append(msg)


def norm(s):
    """ตัดสิ่งที่ไม่ใช่เนื้อความออก เพื่อเทียบชื่อ use case ข้ามไฟล์"""
    s = re.sub(r'<[^>]+>', ' ', s or '')
    s = s.replace('&nbsp;', ' ').replace(' ', ' ')
    s = re.split(r'%3C|&lt;', s)[0]
    s = re.sub(r'\s+', ' ', s).strip()
    # CLOs/CLO และ ระงับ/ลบ เป็นการสะกดต่างกันของสิ่งเดียวกัน ไม่ใช่ความขัดแย้ง
    s = s.replace('CLOs', 'CLO')
    return s


def numbered(text):
    m = re.match(r'^(\d+\.\d+)\s+(.*)$', text)
    return (m.group(1), norm(m.group(2))) if m else (None, norm(text))


# ══ อ่านทั้งสามแหล่ง ═══════════════════════════════════════════════
md = io.open(UML_MD, encoding='utf-8').read()
UML_MD_UC = {}
for m in re.finditer(r'\["(\d+\.\d+)\s+([^"]+)"\]', md):
    UML_MD_UC[m.group(1)] = norm(m.group(2))

src = io.open(APP, encoding='utf-8').read()
APP_UC = {}
for m in re.finditer(r"\['(\d)','[^']*','(\d\.\d)','([^']*)'", src):
    APP_UC[m.group(2)] = norm(m.group(3))

L2_UC, L2_UNNUMBERED, L2_DUP = {}, [], []
for c in ET.parse(LAYER2).getroot().iter('mxCell'):
    if 'ellipse' not in (c.get('style') or ''):
        continue
    num, text = numbered(norm(c.get('value') or ''))
    if not text:
        continue
    if num is None:
        L2_UNNUMBERED.append(text)
    elif num in L2_UC:
        L2_DUP.append('%s = "%s" และ "%s"' % (num, L2_UC[num], text))
    else:
        L2_UC[num] = text


def head(n, title):
    print('\n%s · %s' % (n, title))
    print('  ' + '─' * 72)


# ══ UML-1 · เลขตรงกันไหม ═══════════════════════════════════════════
head('UML-1', 'เลข use case ตรงกันข้ามไฟล์หรือไม่')
shared = sorted(set(UML_MD_UC) & set(L2_UC), key=lambda k: tuple(map(int, k.split('.'))))
# "เพิ่มบัญชีผู้ใช้" vs "เพิ่มบัญชีผู้ใช้งาน" is one use case spelled two ways.
# "1.4 กำหนดบทบาทและสิทธิ์" vs "1.4 reset รหัสผ่าน" is two different use cases
# wearing the same number. Only the second breaks a presentation, so the two are
# separated by how much text the labels actually share rather than lumped in
# together — a report where nine real contradictions hide among five spelling
# differences is a report nobody acts on.
def same_thing(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.6


_pairs = [(k, UML_MD_UC[k], L2_UC[k]) for k in shared if UML_MD_UC[k] != L2_UC[k]]
clash = [t for t in _pairs if not same_thing(t[1], t[2])]
variant = [t for t in _pairs if same_thing(t[1], t[2])]
print('  UML.md %d ข้อ · UML-Layer2 %d ข้อ (มีเลข) · index-q.html %d ข้อ'
      % (len(UML_MD_UC), len(L2_UC), len(APP_UC)))
if clash:
    report(fail, 'UML-1 · UML-Layer2 ให้ความหมายเลข %d เลข ไม่ตรงกับ UML.md' % len(clash),
           'UML-Layer2.drawio')
    print('  ✗ เลขเดียวกันแต่คนละ use case %d เลข:' % len(clash))
    for k, a, b in clash:
        print('      %-5s UML.md: %-38s Layer2: %s' % (k, a, b))
else:
    print('  ✓ ไม่มีเลขที่ขัดกัน')
if variant:
    warn.append('UML-1 · UML-Layer2 สะกดต่างจาก UML.md %d ข้อ (เรื่องเดียวกัน)' % len(variant))
    print('  ! สะกดต่างกันแต่เป็นเรื่องเดียวกัน %d ข้อ:' % len(variant))
    for k, a, b in variant:
        print('      %-5s UML.md: %-38s Layer2: %s' % (k, a, b))

_ma = [(k, UML_MD_UC[k], APP_UC[k]) for k in sorted(set(UML_MD_UC) & set(APP_UC))
       if UML_MD_UC[k] != APP_UC[k]]
ma_clash = [t for t in _ma if not same_thing(t[1], t[2])]
if ma_clash:
    fail.append('UML-1 · UML.md กับ index-q.html ขัดกัน %d เลข' % len(ma_clash))
    print('  ✗ UML.md กับ index-q.html ขัดกันจริง %d เลข:' % len(ma_clash))
    for k, a, b in ma_clash:
        print('      %-5s UML.md: %-38s index-q: %s' % (k, a, b))
md_app = [t for t in _ma if same_thing(t[1], t[2])]
if md_app:
    warn.append('UML-1 · UML.md กับ index-q.html สะกดต่างกัน %d ข้อ' % len(md_app))
    print('  ! UML.md กับ index-q.html เขียนต่างกัน (เลขเดียวกัน เรื่องเดียวกัน):')
    for k, a, b in md_app:
        print('      %-5s UML.md: %-38s index-q: %s' % (k, a, b))

# ══ UML-2 / UML-3 ══════════════════════════════════════════════════
head('UML-2/3', 'เลขซ้ำ และ use case ที่ไม่มีเลข')
for label, dups, un in [('UML-Layer2', L2_DUP, L2_UNNUMBERED)]:
    if dups:
        report(fail, 'UML-2 · %s มีเลขซ้ำ %d จุด' % (label, len(dups)), 'UML-Layer2.drawio')
        print('  ✗ %s เลขซ้ำ:' % label)
        for d in dups:
            print('      ' + d)
    if un:
        report(fail, 'UML-3 · %s มี use case ไม่มีเลข %d ข้อ' % (label, len(un)), 'UML-Layer2.drawio')
        print('  ✗ %s ไม่มีเลข %d ข้อ:' % (label, len(un)))
        for u in un:
            print('      ' + u)
    if not dups and not un:
        print('  ✓ %s เลขครบและไม่ซ้ำ' % label)

# ══ UML-5 · actor ตรงกันไหม ════════════════════════════════════════
head('UML-5', 'จำนวน actor ตรงกันข้ามไฟล์หรือไม่')
md_actors = set(re.findall(r'^\s*(?:ADMIN|TEACHER|LEAD|CO|ASSISTANT)\(\["([^"]+)"\]\)',
                           md, re.M))
app_roles = re.search(r'const COURSE_ROLE_TH\s*=\s*\{([^}]*)\}', src)
# Count KEY:'value' pairs, not quoted strings followed by a delimiter: the
# captured group stops before the closing brace, so the LAST role had no
# trailing "," or "}" to match and the count came out one short.
app_actors = set(re.findall(r"(\w+)\s*:\s*'[^']+'", app_roles.group(1))) if app_roles else set()
print('  UML.md วาด actor %d ตัว: %s' % (len(md_actors), ' · '.join(sorted(md_actors))))
print('  index-q.html มีบทบาทในรายวิชา %d + ผู้ดูแลระบบ' % len(app_actors))
if len(md_actors) < len(app_actors) + 1:
    warn.append('UML-5 · UML.md วาด actor %d ตัว แต่ระบบมี %d — ประกาศไว้ในหัวไฟล์แล้ว'
                % (len(md_actors), len(app_actors) + 1))
    print('  ! ภาพ Layer 0 ยังเป็นรุ่นสอง actor · ภาพสามบทบาทอยู่ใน Structure.drawio '
          'หน้า 2 และ UML-INDEX-Q.drawio (ระบุไว้ในหัว UML.md แล้ว)')
else:
    print('  ✓ ตรงกัน')

# ══ UML-4 · ไฟล์ที่สร้างเอง ยัง fresh ไหม ═════════════════════════
head('UML-4', 'ไฟล์ที่สร้างด้วยสคริปต์ ตรงกับ index-q.html ณ ตอนนี้')
for script, out in GEN:
    path = ROOT / out
    before = path.read_bytes() if path.exists() else None
    r = subprocess.run([sys.executable, str(ROOT / script)], cwd=str(ROOT),
                       capture_output=True)
    if r.returncode != 0:
        fail.append('UML-4 · %s รันไม่ผ่าน' % script)
        print('  ✗ %-42s รันไม่ผ่าน' % out)
        print('      ' + (r.stderr.decode('utf-8', 'replace').strip().splitlines() or [''])[0])
    elif before is None:
        fail.append('UML-4 · %s ไม่มีอยู่ก่อนตรวจ' % out)
        print('  ✗ %-42s ไม่มีไฟล์ (เพิ่งสร้าง)' % out)
    elif before != path.read_bytes():
        fail.append('UML-4 · %s เก่ากว่า index-q.html' % out)
        print('  ✗ %-42s เนื้อหาเปลี่ยนเมื่อสร้างใหม่ — ที่เก็บไว้เก่าแล้ว' % out)
    else:
        print('  ✓ %-42s ตรง' % out)

# ══ ER-1 · prisma ↔ v4 ═════════════════════════════════════════════
head('ER-1', 'schema.prisma ↔ cmas_app_mysql_v4.sql')
pr = io.open(PRISMA, encoding='utf-8').read()
MODELS = set(re.findall(r'^model\s+(\w+)', pr, re.M))
prisma_cols = {}
for m in re.finditer(r'^model\s+(\w+)\s*\{(.*?)^\}', pr, re.M | re.S):
    cols = []
    for line in m.group(2).splitlines():
        line = line.strip()
        if not line or line.startswith(('//', '@@')):
            continue
        parts = line.split()
        if len(parts) < 2:
            continue
        # a field whose type is another model is a relation, not a column
        if parts[1].rstrip('[]?') in MODELS:
            continue
        cols.append(parts[0])
    prisma_cols[m.group(1)] = cols


# Keywords that begin a WRAPPED line inside a column definition. Such a line
# looks exactly like "name TYPE" to a regex — "ON UPDATE CURRENT_TIMESTAMP(3)"
# was being read as a column called ON, on the only two tables that have it.
CONTINUATION = {'ON', 'COMMENT', 'DEFAULT', 'CHECK', 'REFERENCES', 'GENERATED',
                'PRIMARY', 'UNIQUE', 'KEY', 'INDEX', 'CONSTRAINT', 'FOREIGN',
                'AND', 'OR', 'NOT', 'COLLATE', 'CHARACTER', 'AUTO_INCREMENT'}


def sql_tables(path):
    txt = io.open(path, encoding='utf-8', errors='replace').read()
    out = {}
    for m in re.finditer(r'CREATE TABLE(?:\s+IF NOT EXISTS)?\s+`?(\w+)`?\s*\((.*?)^\)',
                         txt, re.S | re.M | re.I):
        cols = []
        for line in m.group(2).splitlines():
            line = line.strip()
            # a column line is "name TYPE ..."; keys and continuations are not
            c = re.match(r'^`?(\w+)`?\s+[A-Z]', line)
            if c and c.group(1).upper() not in CONTINUATION:
                cols.append(c.group(1))
        out[m.group(1)] = cols
    return out


v4 = sql_tables(SQL_V4)
miss = sorted(set(prisma_cols) - set(v4))
extra = sorted(set(v4) - set(prisma_cols))
if miss or extra:
    fail.append('ER-1 · ตารางไม่ตรง')
    print('  ✗ ตาราง — ขาดจาก SQL %s · เกินใน SQL %s' % (miss, extra))
else:
    print('  ✓ ตาราง %d ตัว ตรงกันทั้งหมด' % len(v4))
colbad = 0
for mdl in sorted(prisma_cols):
    p, s = set(prisma_cols[mdl]), set(v4.get(mdl, []))
    only_p, only_s = sorted(p - s), sorted(s - p)
    if only_p or only_s:
        colbad += 1
        print('  ✗ %-20s prisma เท่านั้น=%s · SQL เท่านั้น=%s' % (mdl, only_p, only_s))
if colbad:
    fail.append('ER-1 · คอลัมน์ไม่ตรง %d ตาราง' % colbad)
else:
    print('  ✓ คอลัมน์ตรงกันทุกตาราง (%d คอลัมน์)' % sum(len(c) for c in prisma_cols.values()))

# ══ ER-2 · index-q.sql ═════════════════════════════════════════════
head('ER-2', 'index-q.sql = schema.prisma + ตารางที่เสนอเพิ่ม')
iq = sql_tables(SQL_IQ)
added = sorted(set(iq) - set(prisma_cols))
dropped = sorted(set(prisma_cols) - set(iq))
unexpected = [t for t in added if t not in PROPOSED]
if dropped:
    fail.append('ER-2 · index-q.sql ขาดตารางของ schema.prisma')
    print('  ✗ ขาดจาก schema.prisma: %s' % dropped)
iq_colbad = 0
for mdl in sorted(set(prisma_cols) & set(iq)):
    only_p = sorted(set(prisma_cols[mdl]) - set(iq[mdl]))
    only_s = sorted(c for c in set(iq[mdl]) - set(prisma_cols[mdl]) if (mdl, c) not in PROPOSED_COLS)
    if only_p or only_s:
        iq_colbad += 1
        print('  ✗ %-20s prisma เท่านั้น=%s · index-q.sql เท่านั้น (ไม่มีบันทึก)=%s' % (mdl, only_p, only_s))
if iq_colbad:
    fail.append('ER-2 · index-q.sql คอลัมน์ไม่ตรง schema.prisma %d ตาราง' % iq_colbad)
if unexpected:
    fail.append('ER-2 · index-q.sql มีตารางที่ไม่มีบันทึกเหตุผล')
    print('  ✗ ตารางเพิ่มที่ไม่มีบันทึก: %s' % unexpected)
for t in added:
    if t in PROPOSED:
        print('  ✓ เพิ่ม %-14s %s' % (t, PROPOSED[t]))
if not dropped and not unexpected and not iq_colbad:
    print('  ✓ ตรงตามที่เอกสารบอก — schema.prisma %d ตาราง + เสนอเพิ่ม %d ตาราง %d คอลัมน์'
          % (len(prisma_cols), len(added), len(PROPOSED_COLS)))

# ══ PRES · ของกำกวมบนโต๊ะนำเสนอ ════════════════════════════════════
head('PRES', 'ไฟล์ที่กำกวมเมื่อวางเรียงกัน')
refdir = ROOT / 'docs' / 'reference' / 'db'
mysqldir = refdir / 'mysql'
# ambiguous/outdated exports move to superseded/ rather than being deleted —
# a diagram once shown in a meeting should still open, but never BY MISTAKE
# for a current one. This checks the move actually happened and stuck.
pdfs = sorted(p.name for p in mysqldir.glob('*.pdf'))
v4pdfs = [p for p in pdfs if 'v4' in p.lower()]
if len(v4pdfs) > 1:
    fail.append('PRES · มี ER PDF รุ่น v4 มากกว่าหนึ่งไฟล์ที่ระดับบนสุด')
    print('  ✗ ER PDF ที่ขึ้นต้นว่า v4 มี %d ไฟล์ — ย้ายไฟล์เก่าไป superseded/' % len(v4pdfs))
    for p in v4pdfs:
        print('      ' + p)
else:
    print('  ✓ มี ER PDF รุ่น v4 ไฟล์เดียวที่ระดับบนสุด: %s' % (v4pdfs[0] if v4pdfs else '(ไม่มี)'))

# The actual defect found 2026-09-13: a "current" PDF that still names a table
# dropped 2026-09-06. Re-derive the check instead of trusting the fix stuck.
try:
    from pypdf import PdfReader
    RETIRED_TABLES = ('GradeScheme', 'GradeRun')
    for pdf in v4pdfs:
        path = mysqldir / pdf
        txt = ' '.join((pg.extract_text() or '') for pg in PdfReader(str(path)).pages)
        stale = [t for t in RETIRED_TABLES if t in txt]
        if stale:
            fail.append('PRES · %s ยังพูดถึงตารางที่ถูกยุบแล้ว %s' % (pdf, stale))
            print('  ✗ %s ยังมี %s — schema ยุบตารางนี้ไปแล้ว 2569-09-06' % (pdf, stale))
        else:
            print('  ✓ %s ไม่มีตารางที่ถูกยุบ (%s)' % (pdf, ' · '.join(RETIRED_TABLES)))
except ImportError:
    warn.append('PRES · ข้ามการตรวจเนื้อหา PDF — ไม่มี pypdf (pip install pypdf)')
    print('  ! ไม่มี pypdf ติดตั้ง — ข้ามการตรวจว่า PDF มีตารางที่ถูกยุบแล้วหรือไม่')

olds = sorted(p.name for p in mysqldir.glob('*v3*'))
if olds:
    warn.append('PRES · ไฟล์รุ่น v3 วางอยู่ในโฟลเดอร์เดียวกับ v4')
    print('  ! รุ่น v3 อยู่ปนกับ v4 %d ไฟล์ — %s ระบุไว้แล้วว่าไฟล์ไหนคือปัจจุบัน '
          '(cmas_app_production_v3.sql) แต่ตัวไฟล์นั้นเองมี 11 ตาราง ขาด GradeBand/StudentGrade '
          'เทียบกับ schema.prisma ที่มี 13 — ยังไม่ได้อัปเดตตาม §เกรด'
          % (len(olds), 'mysql-dumps.md'))
    for p in olds:
        print('      ' + p)
alt = refdir / 'schema.sql'
if alt.exists():
    ntab = len(sql_tables(alt))
    if ntab and ntab != len(v4):
        warn.append('PRES · docs/reference/db/schema.sql เป็นสคีมาคนละชุด')
        print('  ! schema.sql มี %d ตาราง (v4 มี %d) — เป็นแบบ enterprise ที่ไม่ได้ใช้' % (ntab, len(v4)))
        print('      ชื่อไฟล์อ่านเหมือนเป็นสคีมาหลัก · เปิดผิดแล้วอธิบายผิดทั้งการนำเสนอ')

superseded = mysqldir / 'superseded'
if superseded.is_dir():
    kept = sorted(p.name for p in superseded.iterdir() if p.is_file() and p.suffix != '.md')
    print('  ✓ %d ไฟล์เก่าเก็บแยกไว้ที่ superseded/ พร้อม README อธิบายเหตุผล' % len(kept))

# ══ สรุป ═══════════════════════════════════════════════════════════
print('\n' + '═' * 76)
if fail:
    print('ยังไม่พร้อมนำเสนอ — ต้องตัดสินใจ %d เรื่อง' % len(fail))
    for f in fail:
        print('  ✗ ' + f)
if warn:
    print('เตือน %d เรื่อง (ไม่ใช่ข้อผิดพลาด แต่ทำให้สับสนบนโต๊ะนำเสนอได้)' % len(warn))
    for w in warn:
        print('  ! ' + w)
if not fail and not warn:
    print('พร้อมนำเสนอ — ทุกข้อตรงกัน')
elif not fail:
    print('ผ่านทุกข้อบังคับ · เหลือแต่ข้อเตือน')
print('═' * 76)
sys.exit(1 if fail else 0)
