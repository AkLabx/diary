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
        print("Waiting for interactive greeting to render...")
        page.wait_for_selector("text=Quick Mood Check-in", timeout=20000)
        page.wait_for_timeout(2000)

        # Capture mobile greeting view
        page.screenshot(path="verification/interactive_greeting_mobile.png")
        print("Captured mobile greeting: verification/interactive_greeting_mobile.png")

        # Test mood check-in click (😊 Joyful)
        joyful_btn = page.locator("button:has-text('😊')").first
        if joyful_btn.is_visible():
            print("Clicking Joyful mood button...")
            joyful_btn.click()
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/editor_with_mood.png")
            print("Captured editor with mood: verification/editor_with_mood.png")

            # Go back to timeline
            page.goto("http://localhost:5173/#/app", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

        # Test reflection prompt click
        write_btn = page.locator("button:has-text('Write about this')").first
        if write_btn.is_visible():
            print("Clicking 'Write about this' reflection prompt button...")
            write_btn.click()
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/editor_with_prompt.png")
            print("Captured editor with prompt: verification/editor_with_prompt.png")

        # Test desktop view by resizing the existing authenticated page
        page.set_viewport_size({'width': 1280, 'height': 800})
        page.goto("http://localhost:5173/#/app", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        page.screenshot(path="verification/interactive_greeting_desktop.png")
        print("Captured desktop view: verification/interactive_greeting_desktop.png")

        browser.close()
        print("All interactive greeting verifications finished successfully!")

if __name__ == "__main__":
    run()
