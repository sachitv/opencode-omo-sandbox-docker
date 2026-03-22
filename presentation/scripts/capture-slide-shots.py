#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "playwright>=1.55.0",
# ]
# ///

from __future__ import annotations

import asyncio
import json
import os
import tempfile
import subprocess
from pathlib import Path

from playwright.async_api import (
    Browser,
    BrowserContext,
    Error,
    Page,
    Playwright,
    async_playwright,
)


ROOT = Path(__file__).resolve().parent.parent
PRESENTATION_URL = os.environ.get("PRESENTATION_URL", "http://127.0.0.1:3000/#/0")
OUT_DIR = Path(os.environ.get("OUT_DIR", ROOT / "artifacts" / "slide-shots"))
PDF_PATH = Path(os.environ.get("PDF_PATH", ROOT / "artifacts" / "slide-deck.pdf"))
STEP_DELAY_MS = int(os.environ.get("STEP_DELAY_MS", "350"))
MAX_CAPTURES = int(os.environ.get("MAX_CAPTURES", "0"))
EXPORT_PDF = os.environ.get("EXPORT_PDF", "1") != "0"
HEADLESS = os.environ.get("HEADLESS", "1") != "0"
VIEWPORT_WIDTH = int(os.environ.get("VIEWPORT_WIDTH", "1600"))
VIEWPORT_HEIGHT = int(os.environ.get("VIEWPORT_HEIGHT", "1000"))


STATE_SCRIPT = """
() => {
  const present = document.querySelector('.reveal .slides > section.present')
  const title = present?.querySelector('h1,h2,h3')?.textContent?.trim() ?? ''
  const fragments = present
    ? Array.from(present.querySelectorAll('.fragment.visible')).map((el) => {
        const idx = el.getAttribute('data-fragment-index') ?? ''
        return `${idx}:${el.className}`
      }).join('|')
    : ''

  return {
    hash: location.hash,
    title,
    fragments,
  }
}
"""


def clear_output_dir() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for existing in OUT_DIR.glob("slide-*.png"):
        existing.unlink()


def export_pdf() -> None:
    screenshots = sorted(OUT_DIR.glob("slide-*.png"))
    if not screenshots:
        raise RuntimeError("No screenshots were captured")

    subprocess.run(
        ["magick", *[str(path) for path in screenshots], str(PDF_PATH)],
        check=True,
    )


def center_on_canvas(source_path: Path, destination_path: Path) -> None:
    subprocess.run(
        [
            "magick",
            str(source_path),
            "-background",
            "#0d1117",
            "-gravity",
            "center",
            "-extent",
            f"{VIEWPORT_WIDTH}x{VIEWPORT_HEIGHT}",
            str(destination_path),
        ],
        check=True,
    )


async def open_browser() -> tuple[Playwright, Browser, BrowserContext, Page]:
    playwright = await async_playwright().start()

    try:
        browser = await playwright.chromium.launch(headless=HEADLESS)
    except Error as exc:
        await playwright.stop()
        raise RuntimeError(
            "Playwright browser is not installed. Run `uv run playwright install chromium` once, then rerun this script."
        ) from exc

    context = await browser.new_context(
        viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
        screen={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
        device_scale_factor=1,
    )
    page = await context.new_page()
    return playwright, browser, context, page


async def close_browser(
    playwright: Playwright, browser: Browser, context: BrowserContext
) -> None:
    await context.close()
    await browser.close()
    await playwright.stop()


async def get_state(page: Page) -> str:
    state = await page.evaluate(STATE_SCRIPT)
    return json.dumps(state, sort_keys=True)


async def wait_for_deck(page: Page) -> None:
    await page.goto(PRESENTATION_URL, wait_until="networkidle")
    await page.wait_for_selector(".reveal .slides > section.present")
    await page.wait_for_timeout(STEP_DELAY_MS)


async def prepare_capture_layout(page: Page) -> None:
    await page.evaluate(
        """
() => {
  const reveal = window.Reveal
  if (reveal?.configure) {
    reveal.configure({
      width: 1600,
      height: 1000,
      margin: 0,
      minScale: 1,
      maxScale: 1,
    })
    reveal.layout?.()
  }

  document.documentElement.style.width = '1600px'
  document.documentElement.style.height = '1000px'
  document.body.style.width = '1600px'
  document.body.style.height = '1000px'
  document.body.style.margin = '0'
}
"""
    )
    await page.wait_for_timeout(STEP_DELAY_MS)


async def capture_deck(page: Page) -> int:
    slide = page.locator(".reveal .slides > section.present > .slide")

    async def capture_centered(index: int) -> None:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
            temp_path = Path(temp_file.name)

        try:
            await slide.screenshot(path=str(temp_path))
            center_on_canvas(temp_path, OUT_DIR / f"slide-{index:02d}.png")
        finally:
            temp_path.unlink(missing_ok=True)

    capture_count = 1
    await capture_centered(capture_count)
    previous_state = await get_state(page)

    while True:
        if MAX_CAPTURES and capture_count >= MAX_CAPTURES:
            break

        await page.keyboard.press("ArrowRight")
        await page.wait_for_timeout(STEP_DELAY_MS)
        current_state = await get_state(page)

        if current_state == previous_state:
            break

        capture_count += 1
        await capture_centered(capture_count)
        previous_state = current_state

    return capture_count


async def main() -> None:
    clear_output_dir()
    playwright, browser, context, page = await open_browser()

    try:
        await wait_for_deck(page)
        await prepare_capture_layout(page)
        capture_count = await capture_deck(page)
    finally:
        await close_browser(playwright, browser, context)

    if EXPORT_PDF:
        export_pdf()

    print(f"Captured {capture_count} screenshots to {OUT_DIR}")
    if EXPORT_PDF:
        print(f"Exported PDF to {PDF_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
