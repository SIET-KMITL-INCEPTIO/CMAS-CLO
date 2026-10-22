# -*- coding: utf-8 -*-
"""Check the API design (docs/excel/api/api-endpoints.json) against the real system.

   The design is written in scripts/build-api-endpoints-workbook.py and exported to
   api-endpoints.json. This script reads that file and compares every row with the
   parts of the system that already exist, so a design that cannot be built fails
   here instead of in the middle of a sprint:

     COVER   every endpoint has a Design row, and every Design row names an endpoint
     CAP     the capability exists in app/server/.../capabilities.ts, and who may call
             the endpoint matches the roles that capability allows (D-1: ADMIN does
             no teaching work, so a teaching endpoint must not list ADMIN)
     HTTP    every status code is one api-design.md §2.3 allows · GET answers 200 ·
             create answers 201 · a course-scoped route answers 404 · a teaching
             route refuses ADMIN with 403
     FIELD   every body field named as a column exists in database/schema.prisma or,
             as a proposal, in docs/reference/db/mysql/index-q.sql — and a row that
             needs a proposed column has "ต้องมี 0008" ticked
     ENUM    enum values in the design equal the schema's (Prisma plus the proposal)
     A-8     no body takes courseId, uploadedBy, changedBy, updatedBy or status;
             role only on PATCH /users/:userId
     TEST    every ST-… id in "ตรวจใน" exists in system-test-plan.md
     PATH    resources are kebab-case, path parameters camelCase ending in Id (A-1)
     CODE    routes registered in app/server/src/modules match the "ทำแล้ว" rows,
             method, path and declared access (the runtime twin of this check is
             app/server/src/api-contract.test.ts)
     COUNT   system-test-plan.md states the same number of in-scope endpoints

     python scripts/check-api-design.py      exit 1 on any failure
"""
import io
import json
import re
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
DESIGN_JSON = ROOT / 'docs' / 'excel' / 'api' / 'api-endpoints.json'
CAPS_TS = ROOT / 'app' / 'server' / 'src' / 'modules' / 'authorization' / 'capabilities.ts'
PRISMA = ROOT / 'database' / 'schema.prisma'
SQL_IQ = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'index-q.sql'
TEST_PLAN = ROOT / 'docs' / 'markdown' / 'dev' / 'planning' / 'system-test-plan.md'
MODULES = ROOT / 'app' / 'server' / 'src' / 'modules'

ALLOWED_STATUS = {200, 201, 400, 401, 403, 404, 409, 422, 429, 500}
READ, NO = 'อ่าน', '—'
ROLE_ADMIN, ROLE_TEACH, ROLE_BOTH = 'ADMIN', 'ผู้สอนของรายวิชา', 'ADMIN · ผู้สอน'
ROLE_PUBLIC, ROLE_LOGGED = 'ไม่ต้องล็อกอิน', 'ผู้ใช้ที่ล็อกอิน'
FORBIDDEN_BODY = ['courseId', 'uploadedBy', 'changedBy', 'updatedBy', 'status']   # A-8
ROLE_IN_BODY_OK = {('PATCH', '/users/:userId')}

fails, notes = [], []


def fail(tag, msg):
    fails.append('%-5s %s' % (tag, msg))


def key(e):
    return '%s %s' % (e['method'], e['path'])


# ── sources ────────────────────────────────────────────────────────────────
data = json.load(io.open(DESIGN_JSON, encoding='utf-8'))
E = data['endpoints']
PREFIX = data['prefix']


def capabilities():
    out = {}
    src = io.open(CAPS_TS, encoding='utf-8').read()
    for m in re.finditer(r'"([a-z]+\.[a-z]+)":\s*\{\s*scope:\s*"(\w+)",\s*roles:\s*(TEACH|\[[^\]]*\])', src):
        roles = ['INSTRUCTOR'] if m.group(3) == 'TEACH' else re.findall(r'"(\w+)"', m.group(3))
        out[m.group(1)] = {'scope': m.group(2), 'roles': set(roles)}
    return out


def prisma_models():
    src = io.open(PRISMA, encoding='utf-8').read()
    enums = {m.group(1): re.findall(r'^\s*([A-Z_]+)\b', m.group(2), re.M)
             for m in re.finditer(r'^enum (\w+) \{(.*?)^\}', src, re.S | re.M)}
    models = {}
    for m in re.finditer(r'^model (\w+) \{(.*?)^\}', src, re.S | re.M):
        fields = {}
        for line in m.group(2).splitlines():
            f = re.match(r'^\s*(\w+)\s+(\w+)', line)
            if f and not line.strip().startswith(('//', '@@')):
                fields[f.group(1)] = f.group(2)
        models[m.group(1)] = fields
    return models, enums


def sql_tables():
    src = io.open(SQL_IQ, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^CREATE TABLE\s+`?(\w+)`?\s*\((.*?)^\)', src, re.S | re.M):
        cols = {}
        for line in m.group(2).splitlines():
            c = re.match(r'^\s*`?(\w+)`?\s+(ENUM\(([^)]*)\)|[A-Z]+)', line)
            if c and c.group(1).upper() not in ('PRIMARY', 'UNIQUE', 'KEY', 'CONSTRAINT', 'FOREIGN', 'INDEX'):
                cols[c.group(1)] = re.findall(r"'(\w+)'", c.group(3)) if c.group(3) else None
        out[m.group(1)] = cols
    return out


def test_ids():
    return set(re.findall(r'\bST-[A-Z]+-\d+\b', io.open(TEST_PLAN, encoding='utf-8').read()))


def referenced_tests(text):
    """ST-ACT-01, 02 · ST-COURSE-01…03 → {ST-ACT-01, ST-ACT-02, ST-COURSE-01..03}"""
    out = set()
    for m in re.finditer(r'\b(ST-[A-Z]+)-(\d+)((?:\s*(?:,|…)\s*\d+)*)', text):
        prefix, first, rest = m.group(1), int(m.group(2)), m.group(3)
        nums, prev = [first], first
        for sep, n in re.findall(r'(,|…)\s*(\d+)', rest):
            n = int(n)
            nums += list(range(prev + 1, n + 1)) if sep == '…' else [n]
            prev = n
        out |= {'%s-%02d' % (prefix, n) for n in nums}
    return out


def code_routes():
    """(METHOD, full path, access) for every route in app/server/src/modules — static read."""
    index = io.open(MODULES / 'index.ts', encoding='utf-8').read()
    prefixes = {}
    for m in re.finditer(r'register\((\w+)(?:,\s*\{\s*prefix:\s*"([^"]*)"\s*\})?\)', index):
        prefixes[m.group(1)] = m.group(2) or ''
    out = []
    for f in MODULES.glob('*/*.route.ts'):
        src = io.open(f, encoding='utf-8').read()
        fn = re.search(r'export async function (\w+)', src).group(1)
        consts = dict(re.findall(r'const (\w+)\s*=\s*(\{[^}]*\}|"[^"]*")', src))
        for m in re.finditer(r'app\.(get|post|put|patch|delete)\(\s*"([^"]*)"\s*,\s*\{\s*config:\s*\{\s*access(?::\s*([^}]+?))?\s*\}', src):
            raw = (m.group(3) or 'access').strip().rstrip(',')
            # `access: "public", rateLimit: X` — keep only the access value itself
            if not raw.startswith('{'):
                raw = raw.split(',', 1)[0].strip()
            raw = consts.get(raw, raw)
            cap = re.search(r'cap:\s*"([^"]+)"', raw)
            access = cap.group(1) if cap else raw.strip('"\' ')
            path = (prefixes.get(fn, '') + m.group(2)).rstrip('/') or '/'
            out.append((m.group(1).upper(), path, access))
    return out


CAPS = capabilities()
MODELS, ENUMS = prisma_models()
TABLES = sql_tables()
TESTS = test_ids()

# ── COVER ──────────────────────────────────────────────────────────────────
missing = [key(e) for e in E if e['design'] is None]
for k in missing:
    fail('COVER', 'ไม่มีแถวในแผ่น Design: %s' % k)

# ── per endpoint ──────────────────────────────────────────────────────────
for e in E:
    k, d, cap, role = key(e), e['design'], e['capability'], e['role']
    later = e['status'] == 'later'

    # CAP
    if cap not in (READ, NO):
        if cap not in CAPS:
            fail('CAP', '%s ใช้ capability "%s" ที่ไม่มีใน capabilities.ts' % (k, cap))
        else:
            roles = CAPS[cap]['roles']
            if roles == {'INSTRUCTOR'} and role != ROLE_TEACH:
                fail('CAP', '%s ใช้ %s (เฉพาะผู้สอน · D-1) แต่ระบุผู้เรียกว่า "%s"' % (k, cap, role))
            if roles == {'ADMIN'} and role != ROLE_ADMIN:
                fail('CAP', '%s ใช้ %s (เฉพาะ ADMIN) แต่ระบุผู้เรียกว่า "%s"' % (k, cap, role))
            if roles == {'ADMIN', 'INSTRUCTOR'} and role not in (ROLE_BOTH, ROLE_TEACH):
                fail('CAP', '%s ใช้ %s (ADMIN และผู้สอน) แต่ระบุผู้เรียกว่า "%s"' % (k, cap, role))
    if d is None or later:
        continue

    # HTTP
    # a status code starts the text or a " · " segment — "รวมเกิน 100%" is not a status
    def codes(text):
        return {int(c) for c in re.findall(r'(?:^|·)\s*([1-5]\d\d)\b', text)}
    ok_codes, err_codes = codes(d['success']), codes(d['errors'])
    for c in sorted((ok_codes | err_codes) - ALLOWED_STATUS):
        fail('HTTP', '%s ใช้ status %d ที่ api-design §2.3 ไม่มี' % (k, c))
    op = e['classification']['operation']
    if e['method'] == 'GET' and 200 not in ok_codes:
        fail('HTTP', '%s เป็น GET แต่คำตอบสำเร็จไม่ใช่ 200' % k)
    if op == 'สร้าง' and 201 not in ok_codes:
        fail('HTTP', '%s สร้างแถวใหม่แต่คำตอบสำเร็จไม่ใช่ 201' % k)
    if e['courseScope'] in ('จาก URL', 'resolve จาก id') and 404 not in err_codes:
        fail('HTTP', '%s ตรวจสิทธิ์รายวิชาแต่ไม่ระบุ 404 (A-2, A-13)' % k)
    if cap in CAPS and CAPS[cap]['roles'] == {'INSTRUCTOR'} and 403 not in err_codes:
        fail('HTTP', '%s เป็นงานสอน ADMIN ต้องได้ 403 (D-1) แต่ไม่ได้ระบุ' % k)
    if role not in (ROLE_PUBLIC,) and e['method'] == 'GET' and not ({401, 404} & err_codes):
        fail('HTTP', '%s ต้องล็อกอินแต่ไม่ระบุ 401 หรือ 404' % k)

    # FIELD
    bf = e.get('bodyFields')
    if bf:
        model, fields = bf
        needs_proposal = []
        for f in fields:
            in_prisma = f in MODELS.get(model, {})
            in_sql = f in TABLES.get(model, {})
            if not in_prisma and not in_sql:
                fail('FIELD', '%s รับ %s.%s ที่ไม่มีทั้งใน schema.prisma และ index-q.sql' % (k, model, f))
            elif not in_prisma:
                needs_proposal.append(f)
        if needs_proposal and not e['needs0008']:
            fail('FIELD', '%s ต้องใช้คอลัมน์ที่ยังเป็นข้อเสนอ (%s) แต่ไม่ได้ติ๊ก "ต้องมี 0008"' % (
                k, ', '.join('%s.%s' % (model, f) for f in needs_proposal)))

    # ENUM
    for field, values in (e.get('enumFields') or {}).items():
        model = (bf or [None])[0] or {'POST /courses/:courseId/clos': 'CLO', 'PATCH /users/:userId': 'User'}.get(k)
        prisma_type = MODELS.get(model, {}).get(field)
        prisma_vals = ENUMS.get(prisma_type, [])
        sql_vals = (TABLES.get(model, {}) or {}).get(field) or prisma_vals
        if set(values) != set(sql_vals):
            fail('ENUM', '%s %s.%s = %s แต่ schema = %s' % (k, model, field, values, sql_vals))
        if set(values) - set(prisma_vals) and not e['needs0008']:
            fail('ENUM', '%s ใช้ค่า %s ที่ยังไม่มีใน Prisma แต่ไม่ได้ติ๊ก "ต้องมี 0008"' % (
                k, sorted(set(values) - set(prisma_vals))))

    # A-8
    body = d['body']
    for f in FORBIDDEN_BODY:
        if re.search(r'(?<![\w.])%s(?![\w])' % f, body):
            fail('A-8', '%s รับ %s จาก body' % (k, f))
    if re.search(r'(?<![\w.])role(?!\w)', body) and (e['method'], e['path']) not in ROLE_IN_BODY_OK:
        fail('A-8', '%s รับ role จาก body' % k)

    # TEST
    refs = referenced_tests(d['tests'])
    if not refs:
        fail('TEST', '%s ไม่ได้อ้างกรณีทดสอบใด' % k)
    for t in sorted(refs - TESTS):
        fail('TEST', '%s อ้าง %s ที่ไม่มีใน system-test-plan.md' % (k, t))

# PATH (all rows)
for e in E:
    for seg in e['path'].strip('/').split('/'):
        if seg.startswith(':'):
            if not re.fullmatch(r':[a-z][A-Za-z]*Id|:id', seg):
                fail('PATH', '%s พารามิเตอร์ %s ไม่ใช่ camelCase ที่ลงท้ายด้วย Id' % (key(e), seg))
            elif seg == ':id':
                notes.append('PATH  %s ใช้ :id (ตรงกับโค้ด · contract ใช้ :userId)' % key(e))
        elif not re.fullmatch(r'[a-z]+(?:-[a-z]+)*', seg):
            fail('PATH', '%s ส่วน "%s" ไม่ใช่ kebab-case ตัวเล็ก (A-1)' % (key(e), seg))

# CODE — the "ทำแล้ว" rows against what app/server registers
def norm(p):
    return re.sub(r':\w+', ':_', p)

routes = code_routes()
done = {(e['method'], norm(e['path'])): e for e in E if e['status'] == 'done'}
seen = set()
for method, path, access in routes:
    if path == '/health':
        continue                                  # infrastructure, not part of the API table
    k = (method, norm(path))
    seen.add(k)
    e = done.get(k)
    if e is None:
        fail('CODE', 'โค้ดมี %s %s แต่ในตารางไม่ได้เป็น "ทำแล้ว"' % (method, path))
        continue
    # Same mapping as accessOf() in api-contract.test.ts: a read of course data is
    # guarded by course.view, a read with no course by any signed-in account.
    if e['role'] == ROLE_PUBLIC:
        want = 'public'
    elif e['capability'] in ('อ่าน', '—'):
        want = 'authenticated' if e['role'] == 'ผู้ใช้ที่ล็อกอิน' else 'course.view'
    else:
        want = e['capability']
    if access != want:
        fail('CODE', '%s %s ประกาศ access "%s" แต่ตารางระบุ "%s"' % (method, path, access, want))
for k, e in done.items():
    if k not in seen:
        fail('CODE', 'ตารางระบุว่า %s ทำแล้ว แต่ไม่พบ route ในโค้ด' % key(e))

# COUNT
in_scope = sum(1 for e in E if e['status'] != 'later')
m = re.search(r'Endpoint ในขอบเขต \(Excel\) \| (\d+) / (\d+)', io.open(TEST_PLAN, encoding='utf-8').read())
if not m or int(m.group(1)) != in_scope or int(m.group(2)) != in_scope:
    fail('COUNT', 'system-test-plan.md ระบุ endpoint ในขอบเขต %s แต่ตารางมี %d' % (
        '%s / %s' % m.groups() if m else '—', in_scope))

# ── report ─────────────────────────────────────────────────────────────────
by = {}
for e in E:
    by[e['status']] = by.get(e['status'], 0) + 1
designed = sum(1 for e in E if e['design'] is not None)
print('API design · %d endpoint · ออกแบบแล้ว %d · ในขอบเขต %d · %s' % (
    len(E), designed, in_scope, ' · '.join('%s %d' % kv for kv in sorted(by.items()))))
print('ตรวจกับ: capabilities.ts (%d) · schema.prisma (%d model) · index-q.sql (%d ตาราง) · system-test-plan.md (%d กรณี) · route ในโค้ด (%d)' % (
    len(CAPS), len(MODELS), len(TABLES), len(TESTS), len(routes)))
for n in notes:
    print('  ·', n)
if fails:
    print('\nไม่ผ่าน %d ข้อ' % len(fails))
    for f in fails:
        print('  ✗', f)
    sys.exit(1)
print('ผ่านทุกข้อ')
