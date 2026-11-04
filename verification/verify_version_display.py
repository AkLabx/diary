import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Desktop context
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("1. Testing Landing Page...")
        page.goto("http://localhost:5173/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)

        # Scroll to bottom of landing page to see footer
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1000)
        
        # Check if v1.0.8 or version badge exists
        landing_footer = page.locator("footer:has-text('Diary')")
        print("Landing footer visible:", landing_footer.is_visible())
        page.screenshot(path="verification/version_landing_page.png")
        print("Captured verification/version_landing_page.png")

        print("2. Navigating to login and authenticating...")
        page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        email_input = page.locator("input[type='email']")
        if email_input.is_visible():
            print("Entering credentials...")
            email_input.fill("testuser@diary.com")
            page.locator("input[type='password']").fill("test@4321")
            page.locator("button[type='submit']").click()
            page.wait_for_timeout(3000)

        key_input = page.locator("input[type='password']")
        if key_input.is_visible():
            print("Unlocking encryption...")
            key_input.fill("test@4321")
            page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
            page.wait_for_timeout(4000)

        print("3. Verifying Left Sidebar on Desktop...")
        page.wait_for_selector("aside:has-text('Diary')", timeout=15000)
        page.wait_for_timeout(1000)
        sidebar = page.locator("aside")
        print("Sidebar visible:", sidebar.is_visible())
        version_badge = sidebar.locator("text=/v1\\.\\d+\\.\\d+/")
        print("Sidebar version badge found:", version_badge.count() > 0)
        page.screenshot(path="verification/version_sidebar_desktop.png")
        print("Captured verification/version_sidebar_desktop.png")

        print("4. Navigating to Profile View...")
        page.goto("http://localhost:5173/#/app/profile", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(2000)
        profile_footer = page.locator("text=End-to-End Encrypted (AES-GCM)")
        print("Profile footer found:", profile_footer.is_visible())
        profile_footer.scroll_into_view_if_needed()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/version_profile_page.png")
        print("Captured verification/version_profile_page.png")

        print("5. Testing Mobile Viewport...")
        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844})
        mobile_page = mobile_context.new_page()
        mobile_page.goto("http://localhost:5173/", wait_until="networkidle", timeout=30000)
        mobile_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        mobile_page.wait_for_timeout(1000)
        mobile_page.screenshot(path="verification/version_landing_mobile.png")
        print("Captured verification/version_landing_mobile.png")

        browser.close()
        print("All verification steps completed successfully.")

if __name__ == '__main__':
    run()
