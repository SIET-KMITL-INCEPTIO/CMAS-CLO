# -*- coding: utf-8 -*-
"""Runs INSIDE MySQL Workbench (its embedded Python), not under system Python.

   Rebuilds the EER model of index-q.html from docs/reference/db/mysql/index-q.sql:
     1. empties the open model's schema and diagram
     2. re-imports the SQL script (the same parser as File > Import > Reverse Engineer
        MySQL Create Script)
     3. places one figure per table by the layout in LAYOUT_JSON (taken from the
        drawio ER diagram, so both pictures group tables the same way) and one
        connection per foreign key
     4. saves the model back to its file. It does NOT export the PDF: Workbench refuses
        to export from a script ("select a diagram first") and leaves a dialog open, so
        the PDF is exported by hand: File > Export > Export as Single Page PDF

   Do not start it by hand. scripts/build-index-q-workbench.py fills in the values
   below, starts Workbench with this file and checks what came out.
"""
import json
import traceback

import grt

# ── filled in by the driver ──────────────────────────────────────────────
SQL_PATH = r'@SQL_PATH@'
LAYOUT_JSON = r'@LAYOUT_JSON@'
LOG_PATH = r'@LOG_PATH@'

log = []


def say(*parts):
    log.append(' '.join(str(p) for p in parts))


def flush():
    with open(LOG_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(log) + '\n')


def clear_list(lst):
    while len(lst):
        lst.remove(lst[0])


def run():
    doc = grt.root.wb.doc
    model = doc.physicalModels[0]
    catalog = model.catalog
    schema = catalog.schemata[0]
    say('model opened · schema', schema.name, '· tables before', len(schema.tables))

    # 1 · empty the old model ------------------------------------------------
    for d in list(model.diagrams):
        clear_list(d.connections)
        clear_list(d.figures)
    clear_list(schema.tables)

    # 2 · import the script ----------------------------------------------------
    opts = {'sql_mode': '', 'case_sensitive_identifiers': 1}
    n = grt.modules.MysqlSqlFacade.parseSqlScriptFileEx(catalog, SQL_PATH, opts)
    say('parseSqlScriptFileEx ->', n, '· tables after', len(schema.tables))

    # 3 · figures and connections ----------------------------------------------
    layout = json.load(open(LAYOUT_JSON, encoding='utf-8'))
    diagram = model.diagrams[0]
    layer = diagram.rootLayer
    fig_of = {}
    for t in schema.tables:
        spot = layout.get(t.name)
        if spot is None:
            say('NO LAYOUT for', t.name)
            continue
        fig = grt.classes.workbench_physical_TableFigure()
        fig.owner = diagram
        fig.layer = layer
        fig.table = t
        fig.name = t.name
        fig.left, fig.top = spot['x'], spot['y']
        fig.width, fig.height = spot['w'], spot['h']
        fig.color = spot.get('color', '#98BFDA')
        fig.columnsExpanded = 1
        diagram.figures.append(fig)
        fig_of[t.name] = fig
    n_fk = 0
    for t in schema.tables:
        for fk in t.foreignKeys:
            ref = fk.referencedTable
            if t.name not in fig_of or ref is None or ref.name not in fig_of:
                say('SKIPPED FK', t.name, fk.name)
                continue
            conn = grt.classes.workbench_physical_Connection()
            conn.owner = diagram
            conn.foreignKey = fk
            conn.startFigure = fig_of[t.name]
            conn.endFigure = fig_of[ref.name]
            conn.caption = fk.name
            diagram.connections.append(conn)
            n_fk += 1
    diagram.width = max(s['x'] + s['w'] for s in layout.values()) + 40
    diagram.height = max(s['y'] + s['h'] for s in layout.values()) + 40
    model.currentDiagram = diagram
    doc.customData['MySQLDbModule:input_filename'] = SQL_PATH
    say('figures', len(fig_of), '· connections', n_fk)

    # 4 · save ---------------------------------------------------------------------
    # saveModel() takes no path: it writes back to the file Workbench opened, which
    # the driver made a private copy of — the driver picks the model up from there
    try:
        say('saveModel ->', grt.modules.Workbench.saveModel())
    except Exception:
        say('saveModel FAILED', traceback.format_exc())


try:
    run()
except Exception:
    say('FAILED', traceback.format_exc())
flush()
