#!/usr/bin/env python3
"""
ui-checker / scripts / build-artifact.py

Injects a target HTML file + static-analysis JSON into
templates/inspector-artifact.html using base64 encoding.

Base64 keeps the artifact valid no matter what's inside the user's HTML
(backticks, ${...}, </script> tags, unbalanced quotes — all safe).

Usage:
  python3 build-artifact.py \
    --html     /tmp/ui-checker/target.html \
    --template /path/to/ui-checker/templates/inspector-artifact.html \
    --analysis /tmp/ui-checker/analysis.json \
    --output   /tmp/ui-checker/ui-inspector.html
"""

import argparse
import base64
import json
from pathlib import Path


def build(html_path: str, template_path: str, output_path: str,
          analysis_path: str = None) -> Path:

    target_html = Path(html_path).read_text(encoding='utf-8', errors='replace')
    template    = Path(template_path).read_text(encoding='utf-8')

    html_b64 = base64.b64encode(target_html.encode('utf-8')).decode('ascii')

    analysis_b64 = ''
    if analysis_path and Path(analysis_path).exists():
        raw = Path(analysis_path).read_text(encoding='utf-8')
        json.loads(raw)   # validate JSON before embedding
        analysis_b64 = base64.b64encode(raw.encode('utf-8')).decode('ascii')

    if '__TARGET_HTML_B64__' not in template:
        raise ValueError(
            f'Template at {template_path} is missing __TARGET_HTML_B64__ — '
            f'wrong file or outdated template version.'
        )

    out = (template
           .replace('__TARGET_HTML_B64__',  html_b64)
           .replace('__ANALYSIS_JSON_B64__', analysis_b64))

    out_path = Path(output_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out, encoding='utf-8')
    return out_path


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Build the UI Inspector artifact')
    parser.add_argument('--html',     required=True, help='Target HTML to inspect')
    parser.add_argument('--template', required=True, help='Path to inspector-artifact.html template')
    parser.add_argument('--analysis', default=None,  help='static-analysis.py JSON output (optional)')
    parser.add_argument('--output',   required=True, help='Output path for built artifact')
    args = parser.parse_args()

    out = build(args.html, args.template, args.output, args.analysis)
    print(f'✅ Artifact built → {out}')
