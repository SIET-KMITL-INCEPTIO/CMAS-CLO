# -*- coding: utf-8 -*-
"""Rebuild the MySQL Workbench model of index-q.html from index-q.sql.

   Output (docs/reference/db/mysql/):
     index-q.mwb                the EER model, openable in MySQL Workbench

   The PDF (index-q_er-diagram.pdf) is exported by hand from that model —
   File > Export > Export as Single Page PDF. Workbench will not do it from a
   script: it answers "select a diagram first" and leaves a dialog open.

   index-q.sql is the source. This script never edits it. It starts MySQL
   Workbench's own importer (the one behind File > Import > Reverse Engineer
   MySQL Create Script) through scripts/workbench-index-q-er.py, so the picture
   is drawn by Workbench from the SQL and cannot drift from it.

   Tables sit in the same columns as docs/diagrams/er/ER-INDEX-Q.drawio (the
   COLUMNS list in build-er-index-q-drawio.py is read, not copied). Tables the
   prototype proposes on top of schema.prisma — tagged [index-q] in the SQL —
   are filled yellow, the rest Workbench blue.

   REFUSES to overwrite the output when Workbench finishes without writing a
   model whose table count equals the SQL's.

     python scripts/build-index-q-workbench.py
   MySQL Workbench is found under Program Files; set WB_EXE to use another copy.
"""
import ast
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'index-q.sql'
SEED = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'cmas_app_v4.mwb'      # an empty-able model to open
OUT_MWB = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'index-q.mwb'
INNER = ROOT / 'scripts' / 'workbench-index-q-er.py'
ER_SCRIPT = ROOT / 'scripts' / 'build-er-index-q-drawio.py'

BLUE, YELLOW = '#98BFDA', '#FFE9A8'
COL_STEP, X0, Y0, ROW_GAP = 330, 40, 40, 60


def find_workbench():
    cands = [os.environ.get('WB_EXE', '')]
    for base in (os.environ.get('ProgramFiles', r'C:\Program Files'),
                 os.environ.get('ProgramFiles(x86)', r'C:\Program Files (x86)')):
        cands += [str(p) for p in Path(base).glob('MySQL/MySQL Workbench*/MySQLWorkbench.exe')]
    for c in cands:
        if c and Path(c).is_file():
            return c
    sys.exit('MySQL Workbench not found — install it or set WB_EXE to MySQLWorkbench.exe')


def parse_sql():
    """{table: {'cols': [(name, type)], 'iq': bool}} in file order."""
    src = io.open(SQL, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^CREATE TABLE\s+`?(\w+)`?\s*\((.*?)^\)(.*?);', src, re.S | re.M):
        cols = []
        for line in m.group(2).splitlines():
            s = line.strip()
            c = re.match(r'^`?(\w+)`?\s+([A-Z]+(?:\([^)]*\))?)', s)
            if c and c.group(1).upper() not in ('PRIMARY', 'UNIQUE', 'KEY', 'CONSTRAINT', 'FOREIGN', 'INDEX'):
                cols.append((c.group(1), c.group(2)))
        out[m.group(1)] = {'cols': cols, 'iq': '[index-q]' in m.group(3)}
    return out


def er_columns():
    """The column grouping of the drawio ER diagram — one source for both pictures."""
    txt = io.open(ER_SCRIPT, encoding='utf-8').read()
    m = re.search(r'^COLUMNS\s*=\s*(\[.*?^\])', txt, re.S | re.M)
    if not m:
        sys.exit('COLUMNS not found in build-er-index-q-drawio.py')
    body = re.sub(r'#[^\n]*', '', m.group(1))
    return ast.literal_eval(body)


def layout(tables):
    out, placed = {}, set()
    for ci, group in enumerate(er_columns()):
        y = Y0
        for name in group:
            t = tables.get(name)
            if t is None:
                sys.exit('ER layout names %s but index-q.sql has no such table' % name)
            n = len(t['cols'])
            w = max(170, int(max(len('%s  %s' % c) for c in t['cols']) * 7.2) + 56)
            h = 30 + 23 * n
            out[name] = {'x': X0 + ci * COL_STEP, 'y': y, 'w': w, 'h': h, 'color': YELLOW if t['iq'] else BLUE}
            y += h + ROW_GAP
            placed.add(name)
    missing = set(tables) - placed
    if missing:
        sys.exit('tables in index-q.sql but not in the ER layout: %s' % sorted(missing))
    return out


def wait_until_closed(limit=120):
    """The Workbench launcher can return while the real process is still saving."""
    import time
    for _ in range(limit):
        out = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq MySQLWorkbench.exe', '/NH'],
                             capture_output=True, text=True).stdout
        if 'MySQLWorkbench.exe' not in out:
            return
        time.sleep(1)
    sys.exit('Workbench is still running after %d s — close it and run again' % limit)


def main():
    exe = find_workbench()
    tables = parse_sql()
    work = Path(tempfile.mkdtemp(prefix='wb-index-q-'))
    try:
        lay = work / 'layout.json'
        lay.write_text(json.dumps(layout(tables), ensure_ascii=False), encoding='utf-8')
        seed = work / 'seed.mwb'
        shutil.copyfile(SEED, seed)
        mwb, log = seed, work / 'run.log'   # Workbench saves back into the seed copy
        code = io.open(INNER, encoding='utf-8').read()
        for key, val in (('@SQL_PATH@', SQL), ('@LAYOUT_JSON@', lay), ('@LOG_PATH@', log)):
            code = code.replace(key, str(val))
        script = work / 'inner.py'
        script.write_text(code, encoding='utf-8')

        print('MySQL Workbench:', exe)
        print('tables in index-q.sql:', len(tables))
        subprocess.run([exe, str(seed), '--run-python', "exec(open(r'%s', encoding='utf-8').read())" % script,
                        '--quit-when-done'], cwd=str(work), timeout=300)
        wait_until_closed()

        if not log.exists():
            sys.exit('Workbench ran but wrote no log — the script did not start')
        text = log.read_text(encoding='utf-8')
        print(text.rstrip())
        if 'FAILED' in text or 'NO LAYOUT' in text or 'SKIPPED FK' in text:
            sys.exit('Workbench reported a problem — output NOT written')
        if not mwb.exists():
            sys.exit('Workbench did not write the model — output NOT written')
        with zipfile.ZipFile(mwb) as z:
            xml = z.read('document.mwb.xml').decode('utf-8')
        n_tab = len(set(re.findall(r'<value[^>]*struct-name="db\.mysql\.Table"[^>]*id="([^"]+)"', xml)))
        if n_tab != len(tables):
            sys.exit('model has %d tables, index-q.sql has %d — output NOT written' % (n_tab, len(tables)))
        shutil.copyfile(mwb, OUT_MWB)
        print('wrote', OUT_MWB.relative_to(ROOT), '· %d tables · export the PDF by hand from Workbench' % n_tab)
    finally:
        if os.environ.get('KEEP_WORK'):
            print('work dir kept:', work)
        else:
            shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    main()
