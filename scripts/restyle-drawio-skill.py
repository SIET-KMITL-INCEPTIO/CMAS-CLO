#!/usr/bin/env python3
"""สร้างสำเนา <ชื่อ>-Skill.drawio ที่ปรับ "สไตล์" ตามกฎ skill drawio-diagrams (ไม่แตะต้นฉบับ)

ทำให้เฉพาะสิ่งที่เครื่องทำได้โดยไม่เปลี่ยนความหมายของแผนภาพ:
  ฟอนต์ IBM Plex Sans Thai ≥16px · เส้น 2px · มุมฉาก · ขาว/ดำ/#EEF0F8 · ไม่มีเงา/gradient
  เส้นประเฉพาะ UML (include/extend/dependency/return) · พิกัดลงตาราง 10px
ไม่ทำ (ต้องออกแบบหน้าใหม่ด้วยคน): แบ่งกรอบให้ ≤9 กล่อง · ใส่กรอบมีชื่อให้ทุกกล่อง · ฝังโลโก้
รัน:  python scripts/restyle-drawio-skill.py <ไฟล์.drawio> [--skip-page ชื่อหน้า ...]
"""
import argparse
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

FONT = 'IBM Plex Sans Thai'
SRC = 'https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DIBM%2BPlex%2BSans%2BThai'
PALETTE = {'#000000', '#ffffff', '#eef0f8'}
COLOR_KEYS = ('fillColor', 'strokeColor', 'fontColor', 'labelBackgroundColor', 'labelBorderColor',
              'gradientColor', 'swimlaneFillColor', 'separatorColor')
DROP = ('shadow', 'glass', 'sketch', 'comic', 'gradientColor', 'gradientDirection', 'arcSize', 'jumpStyle', 'jumpSize')


def parse(style):
    parts, kv = [], {}
    for p in (style or '').split(';'):
        if not p:
            continue
        if '=' in p:
            k, v = p.split('=', 1)
            kv[k] = v
            parts.append(k)
        else:
            parts.append(p)
    return parts, kv


def build(parts, kv):
    return ';'.join((p + '=' + kv[p]) if p in kv else p for p in parts) + ';'


def fix_color(key, v):
    lv = v.strip().lower()
    if lv == 'none' or lv in PALETTE:
        return v.upper() if lv != 'none' else v
    if key in ('fontColor', 'strokeColor', 'labelBorderColor', 'separatorColor'):
        return '#000000'
    return '#FFFFFF'


def restyle_cell(c):
    parts, kv = parse(c.get('style'))
    is_edge = c.get('edge') == '1'
    is_text = 'text' in parts or 'edgeLabel' in parts
    value = c.get('value') or ''
    has_text = bool(re.sub(r'<[^>]+>', '', value).strip()) or is_text
    # แคปซูล (มุมมน arcSize สูง) = ตัวเริ่ม/จบ ISO 5807 → เก็บรูปไว้เป็น terminator
    if kv.get('rounded') == '1' and float(kv.get('arcSize', 0) or 0) >= 40 and 'shape' not in kv and not is_edge:
        kv['shape'] = 'mxgraph.flowchart.terminator'
    # ลบเอฟเฟกต์
    for k in DROP:
        kv.pop(k, None)
        parts = [p for p in parts if p != k]
    if has_text:
        kv['fontFamily'], kv['fontSource'] = FONT, SRC
        try:
            size = float(kv.get('fontSize', 12))
        except ValueError:
            size = 12
        kv['fontSize'] = str(int(max(16, size)))
        kv['fontColor'] = '#000000'
        value = re.sub(r'font-size:\s*[\d.]+px;?', '', value)
        value = re.sub(r'font-family:\s*[^;"\']+;?', '', value)
        value = re.sub(r'(?<![-\w])color:\s*[^;"\']+;?', '', value)
        value = re.sub(r'(<hr[^>]*?)\s+color="[^"]*"', lambda m: m.group(1), value)
        value = re.sub(r'<font[^>]*>', '', value).replace('</font>', '')
        c.set('value', value)
    for k in COLOR_KEYS:
        if k in kv:
            kv[k] = fix_color(k, kv[k])
    if kv.get('strokeColor', '').lower() != 'none' and not is_text:
        kv['strokeColor'] = kv.get('strokeColor', '#000000')
        kv['strokeWidth'] = '2'
        kv['rounded'] = '0'
        if not is_edge and 'fillColor' not in kv:
            kv['fillColor'] = '#FFFFFF'
    for k in ('shadow',):
        kv.pop(k, None)
    uml = '«' in value or kv.get('endArrow') == 'open' or kv.get('shape') == 'umlLifeline'
    if (kv.get('dashed') == '1' or kv.get('dotted') == '1') and not uml:
        kv.pop('dashed', None)
        kv.pop('dotted', None)
        kv.pop('dashPattern', None)
    if is_edge and 'edgeStyle' not in kv and not any(p.startswith('edgeStyle') for p in parts):
        kv['edgeStyle'] = 'orthogonalEdgeStyle'
    for k in kv:
        if k not in parts:
            parts.append(k)
    c.set('style', build(parts, kv))
    # พิกัดลงตาราง 10px (เฉพาะกล่อง ไม่ใช่เส้น)
    if c.get('vertex') == '1':
        g = c.find('mxGeometry')
        if g is not None:
            for a in ('x', 'y', 'width', 'height'):
                if g.get(a) is not None:
                    g.set(a, str(int(round(float(g.get(a)) / 10.0)) * 10))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--skip-page', action='append', default=[])
    a = ap.parse_args()
    src = Path(a.file)
    dst = src.with_name(src.stem + '-Skill' + src.suffix)
    tree = ET.parse(src)
    n = 0
    for d in tree.getroot().iter('diagram'):
        if d.get('name') in a.skip_page:
            continue
        m = d.find('mxGraphModel')
        if m is None:
            sys.exit('หน้า %r บีบอัดอยู่ — เปิดใน draw.io แล้ว Extras ▸ Compressed ปิดก่อน' % d.get('name'))
        for c in m.iter('mxCell'):
            restyle_cell(c)
            n += 1
    tree.write(dst, encoding='utf-8', xml_declaration=False)
    print('wrote', dst, '·', n, 'cells')


if __name__ == '__main__':
    main()
