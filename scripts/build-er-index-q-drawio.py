# -*- coding: utf-8 -*-
"""ER diagram of index-q.html, drawn from docs/reference/db/mysql/index-q.sql.

   Outputs — two renderings of ONE parsed model and ONE set of coordinates:
     docs/uml/index-q/ER-INDEX-Q.drawio   editable, crow's-foot, open in draw.io
     docs/uml/index-q/ER-INDEX-Q.html     presentation page — opens in any browser,
                                          prints to a single-page PDF at exact size

   WHY THIS EXISTS: the only rendered ER in the repo (cmas_app_v4_er-diagram.pdf)
   is the 13-table v4 schema. index-q.html runs on 15 tables — AuthEvent and
   UploadReject existed nowhere as a picture.

   WHY TWO OUTPUTS: the .drawio cannot be rendered on the build machine (no
   draw.io), so the HTML is what gets inspected. Both are drawn from the same
   layout variables and the same edge waypoints, so the inspected picture and
   the editable file cannot disagree about where a line runs.

   ROUTING: every relationship gets its OWN vertical lane inside the gap it
   crosses. The first version turned every edge at the gap's midpoint, so six
   relationships between the CLO/Activity/Student column and the next merged
   into one bar and nobody could say which parent row fed which child.

   DERIVED, never drawn by hand: tables, columns, types, PK, FK and uniqueness
   are parsed from index-q.sql. A relationship is 1:1 when the FK column is
   itself UNIQUE (StudentGrade → Student), otherwise 1:many. Everything tagged
   [index-q] in the SQL is tinted.

   The build REFUSES to write when: two table boxes overlap, an FK points at a
   column that was not parsed, a table has no place in the layout, a gap has
   more relationships than it has lanes, or the relationship count differs from
   the SQL's FK count.

     python scripts/build-er-index-q-drawio.py
"""
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'index-q.sql'
OUT = ROOT / 'docs' / 'uml' / 'index-q' / 'ER-INDEX-Q.drawio'
OUT_HTML = ROOT / 'docs' / 'uml' / 'index-q' / 'ER-INDEX-Q.html'

KEYWORDS = {'ON', 'COMMENT', 'DEFAULT', 'CHECK', 'REFERENCES', 'GENERATED', 'PRIMARY',
            'UNIQUE', 'KEY', 'INDEX', 'CONSTRAINT', 'FOREIGN', 'AND', 'OR', 'NOT',
            'COLLATE', 'CHARACTER', 'AUTO_INCREMENT'}

# ══ parse ═════════════════════════════════════════════════════════════
src = io.open(SQL, encoding='utf-8').read()
TABLES, ORDER = {}, []
for m in re.finditer(r'^CREATE TABLE\s+`?(\w+)`?\s*\((.*?)^\)(.*?);', src, re.S | re.M):
    name, body, tail = m.group(1), m.group(2), m.group(3)
    t = {'cols': [], 'pk': set(), 'uniq': [], 'fks': [], 'iq': '[index-q]' in tail}
    lines = body.splitlines()
    for i, line in enumerate(lines):
        s = line.strip()
        if not s or s.startswith('--'):
            continue
        c = re.match(r'^`?(\w+)`?\s+([A-Z]+(?:\([^)]*\))?)', s)
        if c and c.group(1).upper() not in KEYWORDS:
            # a COMMENT may wrap onto the next line; read both for the tag
            joined = s + ' ' + (lines[i + 1].strip() if i + 1 < len(lines) else '')
            typ = 'ENUM' if c.group(2).startswith('ENUM') else c.group(2)
            t['cols'].append({'name': c.group(1), 'type': typ,
                              'null': ' NULL' in s and 'NOT NULL' not in s,
                              'iq': '[index-q]' in joined})
            continue
        pk = re.match(r'^PRIMARY KEY\s*\(([^)]*)\)', s)
        if pk:
            t['pk'] = {x.strip(' `') for x in pk.group(1).split(',')}
        uq = re.match(r'^UNIQUE KEY\s+\w+\s*\(([^)]*)\)', s)
        if uq:
            t['uniq'].append({x.strip(' `') for x in uq.group(1).split(',')})
    for fk in re.finditer(r'FOREIGN KEY\s*\(`?(\w+)`?\)\s*REFERENCES\s+`?(\w+)`?\s*\(`?(\w+)`?\)', body):
        t['fks'].append((fk.group(1), fk.group(2), fk.group(3)))
    TABLES[name] = t
    ORDER.append(name)


def is_fk(t, col):
    return any(f[0] == col for f in t['fks'])


def unique_single(t, col):
    return {col} == t['pk'] or any(u == {col} for u in t['uniq'])


# ══ layout — grouped by the SQL's own sections, Course in the middle ══
COLUMNS = [
    ['User', 'AuthEvent', 'EmailVerificationToken'],
    ['CourseInstructor', 'ScoreUploadLog', 'UploadReject'],
    ['Course', 'GradeBand'],
    ['CLO', 'Activity', 'Student'],
    # AssessmentCriteria directly under BehavioralObjective: the objective ->
    # criteria FK loops on the right inside one column, and Activity -> criteria
    # crosses a single gap. One column further right and it would cross two.
    ['BehavioralObjective', 'AssessmentCriteria', 'Score', 'StudentGrade'],
]
W, HEAD, ROW, GAP_X, GAP_Y, X0, Y0 = 290, 30, 24, 130, 60, 40, 130
MARK = 28           # room a crow's-foot glyph needs beside a table edge
TINT, TINT_STROKE, INK, MUTED, HEADFILL = '#FFF2CC', '#B8912B', '#1E233C', '#6B7192', '#E9ECF6'

bad = []
placed = [n for col in COLUMNS for n in col]
if sorted(set(TABLES) - set(placed)):
    bad.append('ตารางใน SQL ที่ไม่มีตำแหน่งบนภาพ: %s' % sorted(set(TABLES) - set(placed)))
if sorted(set(placed) - set(TABLES)):
    bad.append('ตำแหน่งบนภาพที่ไม่มีตารางใน SQL: %s' % sorted(set(placed) - set(TABLES)))

GEO, ROWY, COL_OF = {}, {}, {}
for ci, column in enumerate(COLUMNS):
    x, y = X0 + ci * (W + GAP_X), Y0
    for tname in column:
        if tname not in TABLES:
            continue
        t = TABLES[tname]
        h = HEAD + ROW * len(t['cols'])
        GEO[tname], COL_OF[tname] = (x, y, W, h), ci
        for ri, col in enumerate(t['cols']):
            ROWY[(tname, col['name'])] = y + HEAD + ri * ROW + ROW / 2
        y += h + GAP_Y

# ══ relationships and their lanes ════════════════════════════════════
RELS = []   # dicts: parent, pcol, child, ccol, start, end, ax, ay, bx, by, da, db, gap, lane
for tname in ORDER:
    t = TABLES[tname]
    for col, rt, rc in t['fks']:
        if (tname, col) not in ROWY or (rt, rc) not in ROWY:
            bad.append('FK %s.%s → %s.%s ชี้ไปยังคอลัมน์ที่ไม่ได้ parse' % (tname, col, rt, rc))
            continue
        child_col = next(c for c in t['cols'] if c['name'] == col)
        r = {'parent': rt, 'pcol': rc, 'child': tname, 'ccol': col,
             'start': 'ERzeroToOne' if child_col['null'] else 'ERmandOne',
             'end': 'ERzeroToOne' if unique_single(t, col) else 'ERzeroToMany',
             'ay': ROWY[(rt, rc)], 'by': ROWY[(tname, col)]}
        pc, cc = COL_OF[rt], COL_OF[tname]
        px, _, _, _ = GEO[rt]
        cx, _, _, _ = GEO[tname]
        if pc == cc:                        # same column: leave and return on the right
            r.update(ax=px + W, bx=cx + W, da=1, db=1, gap=pc)
        elif cc > pc:
            r.update(ax=px + W, bx=cx, da=1, db=-1, gap=pc)
        else:
            r.update(ax=px, bx=cx + W, da=-1, db=1, gap=cc)
        if abs(cc - pc) > 1:
            bad.append('%s → %s ข้ามมากกว่าหนึ่งช่องว่าง — เส้นจะพาดผ่านตาราง' % (rt, tname))
        RELS.append(r)

for g in sorted({r['gap'] for r in RELS}):
    # A same-column loop takes the lanes NEAREST its own table: its horizontals
    # then stay left of every cross-column lane instead of cutting through them.
    # Measured on the render — sorting by y alone made the User→AuthEvent loops
    # cross the User→CourseInstructor/ScoreUploadLog lines.
    group = sorted((r for r in RELS if r['gap'] == g),
                   key=lambda r: (0 if COL_OF[r['parent']] == COL_OF[r['child']] else 1,
                                  min(r['ay'], r['by']), max(r['ay'], r['by'])))
    usable = GAP_X - 2 * MARK
    step = usable / (len(group) - 1) if len(group) > 1 else 0
    if len(group) > 1 and step < 8:
        bad.append('ช่องว่างคอลัมน์ %d มี %d เส้น — ห่างกันไม่ถึง 8px จะอ่านไม่ออก' % (g, len(group)))
    left = X0 + g * (W + GAP_X) + W
    for i, r in enumerate(group):
        r['lane'] = left + MARK + (i * step if len(group) > 1 else usable / 2)


def key_tags(t, col):
    tags = []
    if col['name'] in t['pk']:
        tags.append('PK')
    if is_fk(t, col['name']):
        tags.append('FK')
    if unique_single(t, col['name']) and col['name'] not in t['pk']:
        tags.append('UQ')
    return ' '.join(tags)


# ══ page, title, notes — notes go UNDER the tables, not beside them ══
RIGHT = max(g[0] + g[2] for g in GEO.values())
BOTTOM = max(g[1] + g[3] for g in GEO.values())
NY = BOTTOM + 50
# A same-column loop in the LAST column runs in the gap to its right, which
# lies past RIGHT — widen the page for it or the loop is cut off at the edge.
if any(r['gap'] == len(COLUMNS) - 1 for r in RELS):
    RIGHT += GAP_X - MARK
PAGE_W, PAGE_H = RIGHT + X0, NY + 262
TITLE = 'ER Diagram · ข้อมูลของ index-q.html'
SUBTITLE = ('สร้างจาก docs/reference/db/mysql/index-q.sql ด้วย scripts/build-er-index-q-drawio.py — '
            'แก้ที่ไฟล์ SQL แล้วสร้างใหม่ อย่าแก้ที่ภาพ · %d ตาราง · %d ความสัมพันธ์ · '
            "สัญกรณ์ crow's foot" % (len(TABLES), len(RELS)))
NOTE_HOW = ('<b>อ่านภาพนี้อย่างไร</b><br><br>'
            '<b>PK</b> คีย์หลัก (ขีดเส้นใต้) · <b>FK</b> คีย์นอก · <b>UQ</b> ค่าไม่ซ้ำ<br>'
            '<b>เส้น</b> — ขีดคู่ฝั่งตารางแม่ = ต้องมีหนึ่งแถว · '
            'ตีนกาฝั่งตารางลูก = ศูนย์ถึงหลายแถว · วงกลมกับขีด = ศูนย์หรือหนึ่งแถว<br><br>'
            '<b>StudentGrade → Student เป็น 1:1</b> เพราะ studentId เป็น UNIQUE — '
            'หนึ่งการลงทะเบียนมีเกรดเดียว<br>'
            '<b>AuthEvent มีเส้นไป User สองเส้น</b> — userId คือบัญชีที่ถูกกระทำ '
            'actorId คือผู้กระทำ<br>'
            '<b>คะแนน CLO ไปถึงผ่านจุดประสงค์</b> — Activity → AssessmentCriteria → '
            'BehavioralObjective → CLO (migration 0006)<br>'
            '<b>Course คือราก</b> — ไม่มีตารางใดอยู่เหนือรายวิชา (ตัด Curriculum/PLO ตามมติ 2.7)')
# Derived from the parsed SQL, not typed: the first version listed the three
# User columns by hand and would have silently omitted any column added later.
IQ_TABLES = [tn for tn in ORDER if TABLES[tn]['iq']]
IQ_COLS = ['%s.%s' % (tn, c['name']) for tn in ORDER if not TABLES[tn]['iq']
           for c in TABLES[tn]['cols'] if c['iq']]
NOTE_TINT = ('<b>พื้นเหลือง = [index-q]</b> ต้นแบบเสนอเพิ่ม ยังไม่อยู่ใน schema.prisma — '
             'ตาราง %s · คอลัมน์ %s' % (' · '.join(IQ_TABLES), ' · '.join(IQ_COLS)))
NOTE_APP = ('<b>สิ่งที่ SQL บังคับไม่ได้ และอยู่ที่แอป</b><br><br>'
            'สิทธิ์ในรายวิชา — บทบาทเดียว ผู้สอนทุกคนของวิชาทำได้เท่ากัน (D1) จึงไม่มี '
            'CourseInstructor.role · ใครทำอะไรได้ตัดสินที่ rbac middleware '
            '(course-role-permissions.md)<br><br>'
            'น้ำหนักรวม 100% · คะแนนไม่เกินคะแนนเต็ม · กิจกรรมกับจุดประสงค์อยู่วิชาเดียวกัน · '
            'passwordHash หรือ googleSub ต้องมีอย่างน้อยหนึ่ง — '
            'อยู่ใน migrations/0002 0004 0005 0006 ไม่ได้อยู่ในไฟล์ diagram นี้')
NOTES = [(NOTE_HOW, X0, NY, 820, 175),
         (NOTE_TINT, X0 + 900, NY, 640, 60),
         (NOTE_APP, X0 + 862, NY + 72, 720, 160)]  # Thai wraps to 5 lines at 720px; 103 clipped the border
SWATCH = (X0 + 862, NY + 4, 28, 18)

# ══ refuse rather than write something wrong ═════════════════════════
boxes = list(GEO.items())
for i, (a, ga) in enumerate(boxes):
    for b, gb in boxes[i + 1:]:
        if ga[0] < gb[0] + gb[2] and gb[0] < ga[0] + ga[2] and ga[1] < gb[1] + gb[3] and gb[1] < ga[1] + ga[3]:
            bad.append('ตารางทับกัน: %s กับ %s' % (a, b))
sql_fks = sum(len(t['fks']) for t in TABLES.values())
if len(RELS) != sql_fks:
    bad.append('จำนวนเส้น %d ไม่เท่ากับ FK ใน SQL %d' % (len(RELS), sql_fks))
if bad:
    print('ภาพใช้ไม่ได้ — ไม่เขียนไฟล์', file=sys.stderr)
    for b in bad:
        print('  ' + b, file=sys.stderr)
    raise SystemExit(1)

# ══ rendering 1 · draw.io ════════════════════════════════════════════
S_TABLE = ('swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=%d;'
           'horizontalStack=0;resizeParent=1;resizeLast=0;collapsible=0;marginBottom=0;'
           'swimlaneFillColor=#FFFFFF;fillColor=%s;strokeColor=%s;fontColor=%s;'
           'fontSize=13;html=1;rounded=0;' % (HEAD, HEADFILL, INK, INK))
S_TABLE_IQ = S_TABLE.replace('fillColor=' + HEADFILL, 'fillColor=' + TINT).replace(
    'strokeColor=' + INK, 'strokeColor=' + TINT_STROKE)
S_ROW = ('text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;'
         'spacingLeft=8;spacingRight=6;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];'
         'portConstraint=eastwest;fontSize=11;html=1;fontColor=%s;' % INK)
S_ROW_IQ = S_ROW.replace('fillColor=none', 'fillColor=' + TINT)
S_EDGE = 'edgeStyle=none;rounded=0;html=1;endSize=10;startSize=10;strokeColor=%s;' % INK
S_TITLE = 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=20;fontStyle=1;fontColor=%s;' % INK
S_SUB = 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=12;fontColor=%s;' % MUTED
S_NOTE = ('rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=%s;align=left;'
          'verticalAlign=top;spacing=10;fontSize=11;fontColor=%s;' % (MUTED, INK))
S_SWATCH = 'rounded=0;html=1;fillColor=%s;strokeColor=%s;' % (TINT, TINT_STROKE)

cells, row_id, counter = [], {}, [0]


def vertex(value, style, x, y, w, h, parent='1'):
    counter[0] += 1
    cid = 'v%d' % counter[0]
    cells.append('<mxCell id="%s" value="%s" style="%s" vertex="1" parent="%s">'
                 '<mxGeometry x="%g" y="%g" width="%g" height="%g" as="geometry"/></mxCell>'
                 % (cid, escape(value, {'"': '&quot;'}), style, parent, x, y, w, h))
    return cid


def row_html(t, col):
    name = ('<u>%s</u>' % col['name']) if col['name'] in t['pk'] else col['name']
    return ('<span style="display:inline-block;width:42px;color:%s"><b>%s</b></span>%s'
            '<span style="color:%s"> : %s%s</span>'
            % (MUTED, key_tags(t, col), name, MUTED, col['type'], ' NULL' if col['null'] else ''))


for tname, (x, y, w, h) in GEO.items():
    t = TABLES[tname]
    tid = vertex(tname + ('  [index-q]' if t['iq'] else ''), S_TABLE_IQ if t['iq'] else S_TABLE, x, y, w, h)
    for ri, col in enumerate(t['cols']):
        # child geometry is RELATIVE to its table
        row_id[(tname, col['name'])] = vertex(row_html(t, col), S_ROW_IQ if col['iq'] else S_ROW,
                                              0, HEAD + ri * ROW, w, ROW, parent=tid)
for r in RELS:
    counter[0] += 1
    ports = ('exitX=%d;exitY=0.5;exitDx=0;exitDy=0;entryX=%d;entryY=0.5;entryDx=0;entryDy=0;'
             % (1 if r['da'] == 1 else 0, 1 if r['db'] == 1 else 0))
    cells.append('<mxCell id="e%d" style="%s%sstartArrow=%s;endArrow=%s;" edge="1" parent="1" '
                 'source="%s" target="%s"><mxGeometry relative="1" as="geometry"><Array as="points">'
                 '<mxPoint x="%g" y="%g"/><mxPoint x="%g" y="%g"/></Array></mxGeometry></mxCell>'
                 % (counter[0], S_EDGE, ports, r['start'], r['end'],
                    row_id[(r['parent'], r['pcol'])], row_id[(r['child'], r['ccol'])],
                    r['lane'], r['ay'], r['lane'], r['by']))
vertex(TITLE, S_TITLE, X0, 26, 900, 34)
vertex(SUBTITLE, S_SUB, X0, 62, 1600, 40)
for text, x, y, w, h in NOTES:
    vertex(text, S_SUB if text is NOTE_TINT else S_NOTE, x, y, w, h)
vertex('', S_SWATCH, *SWATCH)

OUT.parent.mkdir(parents=True, exist_ok=True)
io.open(OUT, 'w', encoding='utf-8', newline='\n').write(
    '<mxfile host="drawio" agent="CMAS scripts/build-er-index-q-drawio.py" version="24.0.0">'
    '<diagram id="erIndexQ" name="ER · index-q.html"><mxGraphModel dx="2400" dy="1400" grid="1" '
    'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
    'pageWidth="%d" pageHeight="%d" math="0" shadow="0"><root><mxCell id="0"/>'
    '<mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram></mxfile>\n'
    % (PAGE_W, PAGE_H, ''.join(cells)))

# ══ rendering 2 · presentation HTML — same coordinates, same lanes ═══


def marker(x, y, kind, d):
    """Crow's-foot glyph drawn outward from a table edge; d=+1 rightward."""
    stroke = 'stroke="%s" fill="none" stroke-width="1.3"' % INK
    ring = ('<circle cx="%g" cy="%g" r="4" stroke="%s" fill="#fff" stroke-width="1.3"/>'
            % (x + d * 19, y, INK))
    if kind == 'ERmandOne':
        return '<path d="M%g %gV%gM%g %gV%g" %s/>' % (
            x + d * 8, y - 6, y + 6, x + d * 14, y - 6, y + 6, stroke)
    if kind == 'ERzeroToOne':
        return '<path d="M%g %gV%g" %s/>%s' % (x + d * 9, y - 6, y + 6, stroke, ring)
    return ('<path d="M%g %gL%g %gM%g %gL%g %gM%g %gL%g %g" %s/>%s' % (
        x, y - 7, x + d * 12, y, x, y + 7, x + d * 12, y, x, y, x + d * 12, y, stroke, ring))


svg = []
for r in RELS:
    svg.append('<path d="M%g %gH%gV%gH%g" stroke="%s" fill="none" stroke-width="1.3"/>'
               % (r['ax'], r['ay'], r['lane'], r['by'], r['bx'], INK))
    svg.append(marker(r['ax'], r['ay'], r['start'], r['da']))
    svg.append(marker(r['bx'], r['by'], r['end'], r['db']))

html_tables = []
for tname, (x, y, w, h) in GEO.items():
    t = TABLES[tname]
    rows = ''.join('<div class="r%s" style="height:%dpx">%s</div>'
                   % (' iq' if col['iq'] else '', ROW, row_html(t, col)) for col in t['cols'])
    html_tables.append('<div class="t%s" style="left:%gpx;top:%gpx;width:%gpx;height:%gpx">'
                       '<div class="h" style="height:%dpx">%s%s</div>%s</div>'
                       % (' iq' if t['iq'] else '', x, y, w, h, HEAD, escape(tname),
                          ' <span class="tag">[index-q]</span>' if t['iq'] else '', rows))
html_notes = ''.join('<div class="%s" style="left:%gpx;top:%gpx;width:%gpx;min-height:%gpx">%s</div>'
                     % ('lg' if text is NOTE_TINT else 'n', x, y, w, h, text)
                     for text, x, y, w, h in NOTES)

io.open(OUT_HTML, 'w', encoding='utf-8', newline='\n').write('''<!doctype html>
<html lang="th"><head><meta charset="utf-8">
<title>ER · index-q.html</title>
<style>
  /* One page at the diagram's exact size: printing to PDF needs no scaling
     and cannot split a table across two sheets. */
  @page { size: %(pw)dpx %(ph)dpx; margin: 0; }
  html, body { margin: 0; background: #fff; }
  body { font-family: "Segoe UI", Tahoma, "Noto Sans Thai", sans-serif; color: %(ink)s;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: %(pw)dpx; height: %(ph)dpx; overflow: hidden; }
  .ttl { position: absolute; left: %(x0)dpx; top: 26px; font-size: 22px; font-weight: 600; }
  .sub { position: absolute; left: %(x0)dpx; top: 64px; font-size: 12.5px; color: %(muted)s; width: 1700px; }
  svg { position: absolute; left: 0; top: 0; }
  .t { position: absolute; box-sizing: border-box; border: 1.3px solid %(ink)s; background: #fff; }
  .t.iq { border-color: %(ts)s; }
  .h { box-sizing: border-box; background: %(hf)s; border-bottom: 1px solid %(ink)s;
       font-size: 13.5px; font-weight: 600; padding: 6px 8px; }
  .t.iq .h { background: %(tint)s; border-bottom-color: %(ts)s; }
  .tag { font-weight: 400; font-size: 11px; color: %(ts)s; }
  .r { box-sizing: border-box; font-size: 11.5px; padding: 0 8px; display: flex; align-items: center;
       white-space: nowrap; overflow: hidden; }
  .r.iq { background: %(tint)s; }
  .n { position: absolute; box-sizing: border-box; border: 1px solid %(muted)s; padding: 12px;
       font-size: 12px; line-height: 1.6; background: #fff; }
  .lg { position: absolute; font-size: 12px; line-height: 1.5; color: %(muted)s; }
  .sw { position: absolute; background: %(tint)s; border: 1px solid %(ts)s; }
</style></head><body><div class="page">
<div class="ttl">%(title)s</div><div class="sub">%(subtitle)s</div>
<svg width="%(pw)d" height="%(ph)d" viewBox="0 0 %(pw)d %(ph)d">%(svg)s</svg>
%(tables)s%(notes)s
<div class="sw" style="left:%(swx)gpx;top:%(swy)gpx;width:%(sww)gpx;height:%(swh)gpx"></div>
</div></body></html>
''' % {'ink': INK, 'muted': MUTED, 'tint': TINT, 'ts': TINT_STROKE, 'hf': HEADFILL,
       'pw': PAGE_W, 'ph': PAGE_H, 'x0': X0, 'title': escape(TITLE), 'subtitle': escape(SUBTITLE),
       'svg': ''.join(svg), 'tables': ''.join(html_tables), 'notes': html_notes,
       'swx': SWATCH[0], 'swy': SWATCH[1], 'sww': SWATCH[2], 'swh': SWATCH[3]})

print('wrote', OUT.relative_to(ROOT))
print('wrote', OUT_HTML.relative_to(ROOT), '· หน้า %dx%d px' % (PAGE_W, PAGE_H))
print('  %d ตาราง · %d ความสัมพันธ์ (FK ใน SQL %d) · [index-q] %d ตาราง %d คอลัมน์'
      % (len(TABLES), len(RELS), sql_fks, sum(t['iq'] for t in TABLES.values()),
         sum(c['iq'] for t in TABLES.values() for c in t['cols'])))
for g in sorted({r['gap'] for r in RELS}):
    print('  ช่องว่างหลังคอลัมน์ %d: %d เส้น แยกคนละเลน' % (g, sum(1 for r in RELS if r['gap'] == g)))
print('  1:1 → %s' % ', '.join('%s.%s' % (r['child'], r['ccol']) for r in RELS if r['end'] == 'ERzeroToOne'))
