import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile iPhone-like viewport
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("Testing Mobile Landing Page...")
        page.goto("http://localhost:5173/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        footer = page.locator("footer:has-text('Diary')")
        print("Landing footer visible:", footer.is_visible())
        footer.scroll_into_view_if_needed()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/version_landing_mobile.png")
        print("Captured verification/version_landing_mobile.png")

        browser.close()

if __name__ == '__main__':
    run()
