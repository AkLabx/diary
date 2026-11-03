import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            permissions=['geolocation'],
            geolocation={'latitude': 28.6139, 'longitude': 77.2090}
        )
        page = context.new_page()

        print("Navigating to http://localhost:5173/#/login ...")
        page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)

        # Login
        email_input = page.locator("input[type='email']")
        if email_input.is_visible():
            print("Entering login credentials...")
            email_input.fill("testuser@diary.com")
            page.locator("input[type='password']").fill("test@4321")
            page.locator("button[type='submit']").click()
            page.wait_for_timeout(3000)

        # Master encryption key
        key_input = page.locator("input[type='password']")
        if key_input.is_visible():
            print("Unlocking diary encryption...")
            key_input.fill("test@4321")
            page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
            page.wait_for_timeout(4000)

        # Wait for timeline greeting
        print("Waiting for page to load...")
        page.wait_for_selector("text=Quick Mood Check-in", timeout=20000)
        page.wait_for_timeout(2000)

        # 1. Capture timeline with the elevated FAB
        page.screenshot(path="verification/fab_fixed_timeline.png")
        print("Captured timeline: verification/fab_fixed_timeline.png")

        # 2. Click the Profile navigation item in the bottom nav
        profile_nav = page.locator("nav.fixed a[href='#/app/profile']").first
        if profile_nav.is_visible():
            print("Navigating to Profile...")
            profile_nav.click()
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/fab_fixed_profile.png")
            print("Captured profile: verification/fab_fixed_profile.png")

        # 3. Test clicking the FAB itself to verify it triggers navigation to /app/new
        fab_btn = page.locator("button[aria-label='New Entry']").first
        if fab_btn.is_visible():
            print("Clicking FAB (+ button)...")
            fab_btn.click()
            page.wait_for_timeout(2500)
            print("Current URL after clicking FAB:", page.url)
            page.screenshot(path="verification/fab_clicked_new_entry.png")
            print("Captured new entry after clicking FAB: verification/fab_clicked_new_entry.png")

        browser.close()
        print("All verification steps finished successfully!")

if __name__ == "__main__":
    run()
