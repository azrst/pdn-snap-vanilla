#!/usr/bin/env python3
"""
Local CORS proxy for pdn-snap-vanilla development.

Forwards:
  http://localhost:8082/...  →  https://api.arcane-magus.site/...

Usage:
  python3 proxy.py

Then set SCRIPT_TOKEN_URL to http://localhost:8082 in loader + checkout config
and rebuild: node loader/build.mjs
"""

from __future__ import annotations

import http.client
import http.server
import json
import ssl
import sys
import urllib.error
import urllib.request

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 8082
UPSTREAM = "https://api.arcane-magus.site"


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def _cors(self) -> None:
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        self._proxy()

    def do_POST(self) -> None:
        self._proxy()

    def do_PUT(self) -> None:
        self._proxy()

    def do_PATCH(self) -> None:
        self._proxy()

    def do_DELETE(self) -> None:
        self._proxy()

    def _proxy(self) -> None:
        length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(length) if length else None
        url = UPSTREAM + self.path
        req = urllib.request.Request(url, data=body, method=self.command)
        content_type = self.headers.get("Content-Type")
        if content_type:
            req.add_header("Content-Type", content_type)
        # Cloudflare often blocks bare urllib; mimic a browser.
        req.add_header(
            "User-Agent",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        )
        req.add_header("Accept", "application/json, text/plain, */*")
        req.add_header("Accept-Language", "en-US,en;q=0.9")
        req.add_header("Origin", UPSTREAM)
        req.add_header("Referer", UPSTREAM + "/")

        try:
            with urllib.request.urlopen(req, context=ssl.create_default_context()) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self._cors()
                ctype = resp.headers.get("Content-Type")
                if ctype:
                    self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as err:
            data = err.read()
            self.send_response(err.code)
            self._cors()
            ctype = err.headers.get("Content-Type") if err.headers else None
            if ctype:
                self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:  # noqa: BLE001
            payload = json.dumps({"error": "proxy_error", "message": str(exc)}).encode("utf-8")
            self.send_response(502)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[proxy] %s - %s\n" % (self.address_string(), fmt % args))


def main() -> None:
    server = http.server.ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), ProxyHandler)
    print("CORS proxy  http://%s:%s  →  %s" % (LISTEN_HOST, LISTEN_PORT, UPSTREAM))
    print("Set SCRIPT_TOKEN_URL to http://localhost:%s" % LISTEN_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
