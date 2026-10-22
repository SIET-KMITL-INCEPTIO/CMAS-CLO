"""
Mark endpoints as built ("ทำแล้ว") in scripts/build-api-endpoints-workbook.py,
then rebuild the workbook and api-endpoints.json from it.

The workbook is the API design; app/server/src/api-contract.test.ts fails when
the server registers a route the design does not mark done, or the reverse.
So a route lands together with its status change, and this is how.

Run: python scripts/mark-api-done.py "GET /courses" "POST /courses/:courseId/clos" ...
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILDER = ROOT / "scripts" / "build-api-endpoints-workbook.py"


def main(endpoints: list[str]) -> int:
    text = BUILDER.read_text(encoding="utf-8")
    missing = []
    for endpoint in endpoints:
        method, path = endpoint.split(" ", 1)
        row = re.compile(
            r'^(\s*\(G_\w+, "' + re.escape(method) + r'", "' + re.escape(path) + r'",.*?, )(ST_CONTRACT|ST_NEW|ST_DONE)(, .*)$',
            re.M,
        )
        text, n = row.subn(r"\1ST_DONE\3", text)
        if n != 1:
            missing.append(endpoint)
    if missing:
        print("not found in the design: " + ", ".join(missing), file=sys.stderr)
        return 1
    BUILDER.write_text(text, encoding="utf-8")
    return subprocess.call([sys.executable, str(BUILDER)])


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
