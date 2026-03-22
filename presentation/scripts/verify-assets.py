#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "playwright>=1.55.0",
# ]
# ///

"""
Verify that all assets (images, SVGs, PNGs) load correctly on the built presentation.
This script starts a local server that simulates the GitHub Pages structure and uses
Playwright to verify that all assets return successful HTTP responses.
"""

from __future__ import annotations

import asyncio
import http.server
import os
import socketserver
import threading
from pathlib import Path
from playwright.async_api import async_playwright, Error

ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT / "dist"
PORT = 9999  # Changed to avoid conflicts
# Simulate GitHub Pages URL structure
BASE_PATH = "/opencode-omo-sandbox-docker"
BASE_URL = f"http://127.0.0.1:{PORT}{BASE_PATH}"

# Assets we expect to load on the presentation
EXPECTED_ASSETS = [
    "architecture-diagram.svg",
    "sandbox-architecture-diagram.svg",
    "devcontainer-vscode-1.png",
    "devcontainer-vscode-2.png",
    "docker.svg",
    "vscode.svg",
    "terminal.svg",
    "title-bg.png",
]


class RewriteHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that rewrites paths to simulate GitHub Pages"""

    def translate_path(self, path):
        # Remove the base path prefix to get the actual file
        if path.startswith(BASE_PATH):
            path = path[len(BASE_PATH):]
        if not path or path == "/":
            path = "/index.html"
        # Get the actual file from dist directory
        return str(DIST_DIR / path.lstrip("/"))

    def log_message(self, format, *args):
        # Quiet logging
        pass


def start_server():
    """Start a simple HTTP server that simulates GitHub Pages structure"""
    handler = RewriteHTTPHandler
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving {DIST_DIR} at {BASE_URL}")
        httpd.serve_forever()


async def verify_assets():
    """Use Playwright to verify all assets load correctly"""
    playwright = await async_playwright().start()

    try:
        browser = await playwright.chromium.launch(headless=True)
    except Error as exc:
        await playwright.stop()
        raise RuntimeError(
            "Playwright browser is not installed. Run `python3 -m playwright install chromium` once, then rerun this script."
        ) from exc

    context = await browser.new_context()
    page = await context.new_page()

    # Track all network requests
    responses = {}

    async def handle_response(response):
        responses[response.url] = response.status

    page.on("response", handle_response)

    try:
        # Load the presentation
        print(f"Loading presentation from {BASE_URL}...")
        await page.goto(BASE_URL, wait_until="networkidle")

        # Wait a bit for all assets to load
        await page.wait_for_timeout(2000)

        # Check each expected asset
        print("\nVerifying assets:")
        all_passed = True
        for asset in EXPECTED_ASSETS:
            asset_url = f"{BASE_URL}/{asset}"
            if asset_url in responses:
                status = responses[asset_url]
                if status == 200:
                    print(f"  ✓ {asset} - OK (status {status})")
                else:
                    print(f"  ✗ {asset} - FAILED (status {status})")
                    all_passed = False
            else:
                print(f"  ✗ {asset} - NOT REQUESTED")
                all_passed = False

        # Check for any 404s or errors
        errors = {url: status for url, status in responses.items() if status >= 400}
        if errors:
            print("\nFailed requests:")
            for url, status in errors.items():
                print(f"  {status}: {url}")
            all_passed = False

        if all_passed:
            print("\n✓ All assets loaded successfully!")
            return 0
        else:
            print("\n✗ Some assets failed to load")
            return 1

    finally:
        await context.close()
        await browser.close()
        await playwright.stop()


async def main():
    # Start the HTTP server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    await asyncio.sleep(2)

    # Verify assets
    exit_code = await verify_assets()

    return exit_code


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
