# -*- coding: utf-8 -*-
"""
TrendPulse 360 - Local Preview Web Server
Runs a local web server at http://localhost:8080 to test the news portal.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

# Ensure stdout handles UTF-8 on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable cache during local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f"  ⚡ TrendPulse 360 Local Dev Server Running!")
        print(f"  👉 Open URL: http://localhost:{PORT}")
        print("  Press Ctrl+C to stop the server.")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    run_server()
