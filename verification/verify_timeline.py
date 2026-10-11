from playwright.sync_api import sync_playwright
import time

def test_timeline_masonry(page):
    page.goto("http://localhost:5173/")

    # Wait for the login screen to appear and click bypass
    page.wait_for_timeout(5000)

    page.screenshot(path="/home/jules/verification/timeline_masonry.png", full_page=True)
    print("Screenshot saved to /home/jules/verification/timeline_masonry.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            test_timeline_masonry(page)
        finally:
            browser.close()
