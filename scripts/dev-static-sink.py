# -*- coding: utf-8 -*-
"""Static server for docs/ with a write-back endpoint, for browser-side testing.

   The preview sandbox blocks downloads, so a page that generates a file has no
   way to hand it to a test on disk. This serves docs/ read-only over GET and
   accepts POST /_sink/<name> to drop a body into a sink directory, which is how
   a generated .xlsx gets out of the browser and into openpyxl.

   Development only. It writes whatever it is sent, to one fixed directory, with
   no authentication — never point it at anything but a scratch path, and never
   run it on a routable interface.

     python scripts/dev-static-sink.py <port> <serve-dir> <sink-dir>
"""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

SINK = os.environ.get('SINK_DIR', '.')
SAFE = re.compile(r'^[A-Za-z0-9._-]{1,120}$')


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):                                    # noqa: N802 (stdlib naming)
        if not self.path.startswith('/_sink/'):
            self.send_error(404)
            return
        name = self.path[len('/_sink/'):]
        # One flat directory, one boring name shape. A path separator or a dot
        # segment here would let the caller choose any file on the machine.
        if not SAFE.match(name):
            self.send_error(400, 'bad name')
            return
        length = int(self.headers.get('Content-Length') or 0)
        if length > 32 * 1024 * 1024:
            self.send_error(413)
            return
        body = self.rfile.read(length)
        os.makedirs(SINK, exist_ok=True)
        with open(os.path.join(SINK, name), 'wb') as fh:
            fh.write(body)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', '2')
        self.end_headers()
        self.wfile.write(b'ok')

    def do_OPTIONS(self):                                 # noqa: N802
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def log_message(self, fmt, *args):
        if 'POST' in (args[0] if args else ''):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 10011
    serve = sys.argv[2] if len(sys.argv) > 2 else 'docs'
    global SINK
    SINK = sys.argv[3] if len(sys.argv) > 3 else '.sink'

    os.chdir(serve)
    # Bind to loopback only. This endpoint writes files.
    srv = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print('serving %s on 127.0.0.1:%d · sink -> %s' % (serve, port, SINK), flush=True)
    srv.serve_forever()


if __name__ == '__main__':
    main()
