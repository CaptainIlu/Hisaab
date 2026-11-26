#!/usr/bin/env python3
"""
Hisaab Local Mobile Server
Serves the Hisaab PWA over your local Wi-Fi network so you can test and use it on your phone.
"""

import http.server
import socket
import socketserver
import os
import sys
import urllib.request
import urllib.error
import json

PORT = 8080

def get_local_ip():
    """Finds the local IP address of this machine on the Wi-Fi network."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow service worker and manifest to be loaded smoothly
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith('/api/splitwise/'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
        else:
            self.send_response(200)
            self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/splitwise/'):
            self.handle_splitwise_proxy()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/splitwise/'):
            self.handle_splitwise_proxy()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_splitwise_proxy(self):
        target_path = self.path[len('/api/splitwise/'):]
        target_url = f"https://secure.splitwise.com/api/v3.0/{target_path}"
        headers = {'User-Agent': 'Hisaab-PWA/1.0'}
        auth = self.headers.get('Authorization')
        if auth:
            headers['Authorization'] = auth
        content_type = self.headers.get('Content-Type')
        if content_type:
            headers['Content-Type'] = content_type

        data = None
        if self.command == 'POST':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                data = self.rfile.read(content_length)

        req = urllib.request.Request(target_url, data=data, headers=headers, method=self.command)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                status = resp.status
                body = resp.read()
                resp_content_type = resp.headers.get('Content-Type', 'application/json')
        except urllib.error.HTTPError as e:
            status = e.code
            body = e.read()
            resp_content_type = e.headers.get('Content-Type', 'application/json')
        except Exception as e:
            status = 502
            body = json.dumps({'error': str(e)}).encode('utf-8')
            resp_content_type = 'application/json'

        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', resp_content_type)
        self.end_headers()
        self.wfile.write(body)

    def guess_type(self, path):
        if path.endswith('.webmanifest') or path.endswith('manifest.json'):
            return 'application/manifest+json'
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.svg'):
            return 'image/svg+xml'
        return super().guess_type(path)

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = get_local_ip()
    url = f"http://{local_ip}:{PORT}"
    localhost_url = f"http://localhost:{PORT}"

    print("=" * 60)
    print("  🏠 Hisaab - Flatmate Expense Tracker & Splitwise Sync")
    print("=" * 60)
    print("\n✅ Server running successfully!\n")
    print("  📱 ON YOUR PHONE (Same Wi-Fi network):")
    print(f"     👉 Open:  {url}")
    print("\n  💻 ON THIS MAC:")
    print(f"     👉 Open:  {localhost_url}")
    print("\n  📲 HOW TO INSTALL AS PWA ON YOUR PHONE:")
    print("     • iPhone / Safari: Tap Share (box with arrow) -> 'Add to Home Screen'")
    print("     • Android / Chrome: Tap 3 dots (⋮) -> 'Install App'")
    print("\nPress Ctrl+C to stop the server.\n" + "=" * 60)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), PWAHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server. Goodbye!")

if __name__ == '__main__':
    main()
