# -*- coding: utf-8 -*-
"""ยืนยันว่าโทเคนสีใน index-q.html กับ docs/pages/cmas-pages.css ยังตรงกัน

   index-q.html เป็นต้นแบบไฟล์เดียวที่ต้องส่งทางอีเมลและเปิดจาก file:// ได้
   จึงถือสำเนาโทเคนของตัวเอง แทนที่จะอ้าง CSS ร่วมเหมือนหน้าเอกสารอีกสี่หน้า

   การคัดลอกไม่ใช่ปัญหาในตัวมันเอง — ปัญหาคือมันเลื่อนไถลโดยไม่มีใครรู้
   สคริปต์นี้ทำให้รู้: แก้สีที่เดียวแล้วลืมอีกที่ CI จะล้ม

     python scripts/check-design-tokens.py        ตรวจอย่างเดียว
     exit 0 = ตรงกัน · exit 1 = ไม่ตรง (พิมพ์ว่าต่างตรงไหน)
"""
import io
import re
import sys
from pathlib import Path

# คอนโซล Windows เป็น cp1252 โดยปริยาย ข้อความไทยจะทำให้สคริปต์ตายก่อนรายงานผล
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / 'docs' / 'pages' / 'cmas-pages.css'
APP = ROOT / 'docs' / 'pages' / 'index-q.html'
# สไตล์ของเว็บเอกสาร docs/html (สร้างจาก Markdown) ใช้โทเคนชุดเดียวกัน
GEN = ROOT / 'docs' / '_generator' / 'style.css'
TARGETS = [('index-q.html', APP), ('_generator/style.css', GEN)]

# โทเคนที่ต้องตรงกันทั้งสองที่ · ชื่อทางซ้ายคือชื่อใน cmas-pages.css
# ค่าที่ index-q.html ถือไว้อาจอยู่ใน :root หรือใน tailwind.config ก็ได้
SHARED = ['ink', 'ink2', 'dim', 'faint', 'edge', 'edge2', 'tint', 'card', 'wash',
          'shadow-soft', 'shadow-card', 'shadow-pop']


def read_root_vars(text):
    """ดึง --name:value จากบล็อก :root แรก · คืน dict ที่ normalise ช่องว่างแล้ว"""
    m = re.search(r':root\s*\{(.*?)\}', text, re.S)
    if not m:
        return {}
    out = {}
    body = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S)
    for decl in body.split(';'):
        if ':' not in decl:
            continue
        k, v = decl.split(':', 1)
        k = k.strip()
        if k.startswith('--'):
            out[k[2:]] = ' '.join(v.split()).lower()
    return out


def main():
    for f in [CSS] + [p for _, p in TARGETS]:
        if not f.exists():
            print('ไม่พบไฟล์:', f)
            return 1

    css = read_root_vars(io.open(CSS, encoding='utf-8').read())
    failed = False
    for label, path in TARGETS:
        other = read_root_vars(io.open(path, encoding='utf-8').read())
        missing, differ = [], []
        for name in SHARED:
            a, b = css.get(name), other.get(name)
            if a is None or b is None:
                missing.append((name, a, b))
            elif a != b:
                differ.append((name, a, b))

        if not missing and not differ:
            print('โทเคนตรงกัน %d รายการ · cmas-pages.css ↔ %s' % (len(SHARED), label))
            continue

        failed = True
        print('โทเคนไม่ตรงกันระหว่าง cmas-pages.css กับ %s\n' % label)
        for name, a, b in missing:
            print('  ขาด    --%-14s css=%s  other=%s' % (name, a, b))
        for name, a, b in differ:
            print('  ต่างกัน --%-14s' % name)
            print('          cmas-pages.css : %s' % a)
            print('          %-14s : %s' % (label, b))
        print()

    if failed:
        print('แก้ให้ตรงกันทุกไฟล์ · ถ้าตั้งใจให้ต่าง ให้เอาชื่อออกจาก SHARED ในสคริปต์นี้')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
