import sys
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("Navigating to http://localhost:5173/#/login ...")
        page.goto("http://localhost:5173/#/login")
        page.wait_for_timeout(2000)

        # Wait for either login input or nav
        email = page.locator("input[type='email']")
        if email.is_visible():
            print("Entering login credentials...")
            email.fill('testuser@diary.com')
            page.locator("input[type='password']").fill('test@4321')
            page.locator("button[type='submit']").click()
            page.wait_for_timeout(3500)

        key_input = page.locator("input[placeholder*='password' i], input[type='password']")
        if key_input.is_visible():
            print("Entering master encryption password...")
            key_input.fill('test@4321')
            page.locator("button[type='submit'], button:has-text('Unlock')").first.click()
            page.wait_for_timeout(3500)

        page.wait_for_selector("nav", timeout=20000)
        page.wait_for_timeout(1000)

        diya_btn = page.locator("button[aria-label*='Festive Diya' i]")
        print("Clicking Festive Diya to launch Diwali rockets...")
        diya_btn.click()

        # 1. Capture ascending rockets in flight with trailing smoke & sparks
        page.wait_for_timeout(250)
        page.screenshot(path='verification/diwali_rockets_ascending.png')
        print("Saved verification/diwali_rockets_ascending.png")

        # 2. Capture detonation explosion burst & anar fountain
        page.wait_for_timeout(450)
        page.screenshot(path='verification/diwali_rockets_exploding.png')
        print("Saved verification/diwali_rockets_exploding.png")

        # 3. Capture glittering shower fallout & secondary cracklers
        page.wait_for_timeout(800)
        page.screenshot(path='verification/diwali_fireworks_fallout.png')
        print("Saved verification/diwali_fireworks_fallout.png")

if __name__ == '__main__':
    run()
