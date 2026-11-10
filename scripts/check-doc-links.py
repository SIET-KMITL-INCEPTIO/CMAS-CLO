# -*- coding: utf-8 -*-
"""Check that every relative link in the tracked Markdown files points at a file that exists.

   Scope: README.md, .claude/CLAUDE.md and every *.md under docs/ and app/ that git tracks
   (docs/html/ is generated and gitignored, so it is never read).
   Links to http(s), mailto and in-page anchors are skipped, and so are links inside code
   fences and inline code. Anchors after '#' are not checked, only the file.

     python scripts/check-doc-links.py      exit 1 if any link is broken
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINK = re.compile(r'\]\(\s*<?([^)\s>#]+)(?:#[^)]*)?>?(?:\s+"[^"]*")?\s*\)')
INLINE_CODE = re.compile(r'`[^`\n]*`')


def tracked_markdown():
    out = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8')
    for f in out.split('\0'):
        if f.endswith('.md') and (f in ('README.md', '.claude/CLAUDE.md') or f.startswith(('docs/', 'app/'))):
            yield f


def broken_links(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):  # tracked but deleted in the working tree
        return
    in_fence = False
    with open(path, encoding='utf-8') as fh:
        for no, line in enumerate(fh, 1):
            if line.lstrip().startswith(('```', '~~~')):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            for m in LINK.finditer(INLINE_CODE.sub('', line)):
                target = m.group(1)
                if re.match(r'^[a-z][a-z0-9+.-]*:', target, re.I):
                    continue
                if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(path), target))):
                    yield no, target


def main():
    bad = [(f, n, t) for f in tracked_markdown() for n, t in broken_links(f)]
    for f, n, t in bad:
        print('%s:%d  broken link -> %s' % (f, n, t))
    print('%d broken link(s)' % len(bad))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
