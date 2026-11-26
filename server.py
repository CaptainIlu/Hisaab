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
