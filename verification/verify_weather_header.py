import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport (iPhone 12/13/14 size) with granted geolocation (Delhi coordinates)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            permissions=['geolocation'],
            geolocation={'latitude': 28.6139, 'longitude': 77.2090}
        )
        page = context.new_page()

        print("Navigating to http://localhost:5173/#/login ...")
        page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)

        # Fill Login Credentials
        email_input = page.locator("input[type='email']")
        if email_input.is_visible():
            print("Login form visible. Entering credentials...")
            email_input.fill("testuser@diary.com")
            password_input = page.locator("input[type='password']")
            password_input.fill("test@4321")
            page.locator("button[type='submit']").click()
            print("Submitted login form. Waiting for authentication...")
            page.wait_for_timeout(4000)

        # Check for Master Encryption Password prompt if presented
        key_input = page.locator("input[placeholder*='password' i], input[type='password']")
        if key_input.is_visible():
            print("Master encryption password prompt detected. Entering key...")
            key_input.fill("test@4321")
            submit_btn = page.locator("button[type='submit'], button:has-text('Unlock'), button:has-text('Submit')").first
            if submit_btn.is_visible():
                submit_btn.click()
            page.wait_for_timeout(4000)

        # Wait for TopBar header in /app
        print("Waiting for application header...")
        page.wait_for_selector("header", timeout=20000)
        page.wait_for_timeout(3000)

        # Take mobile dashboard screenshot
        page.screenshot(path="verification/mobile_weather_header.png")
        print("Captured mobile screenshot: verification/mobile_weather_header.png")

        # Check weather or location button in header
        weather_btn = page.locator("header button:has-text('°C'), header button:has-text('Location')").first
        if weather_btn.is_visible():
            btn_text = weather_btn.inner_text()
            print(f"Weather/Location button is visible! Text: {btn_text}")
            weather_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/weather_modal_open.png")
            print("Captured weather modal screenshot: verification/weather_modal_open.png")

            # Try setting a custom city
            city_input = page.locator("input[placeholder*='e.g. New Delhi']")
            if city_input.is_visible():
                print("Setting custom city to London...")
                city_input.fill("London")
                page.locator("button:has-text('Save')").click()
                page.wait_for_timeout(3000)
                page.screenshot(path="verification/weather_modal_custom_city.png")
                print("Captured custom city screenshot: verification/weather_modal_custom_city.png")

                # Close modal
                page.locator("button:has-text('Done')").click()
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/mobile_weather_custom_city.png")
                print("Captured updated mobile dashboard screenshot: verification/mobile_weather_custom_city.png")

        # Now test desktop view
        desktop_page = browser.new_page(
            viewport={'width': 1280, 'height': 800},
            permissions=['geolocation'],
            geolocation={'latitude': 28.6139, 'longitude': 77.2090}
        )
        desktop_page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=60000)
        desktop_page.wait_for_timeout(2000)
        desktop_email = desktop_page.locator("input[type='email']")
        if desktop_email.is_visible():
            desktop_email.fill("testuser@diary.com")
            desktop_page.locator("input[type='password']").fill("test@4321")
            desktop_page.locator("button[type='submit']").click()
            desktop_page.wait_for_timeout(3000)
        desktop_key = desktop_page.locator("input[type='password']")
        if desktop_key.is_visible():
            desktop_key.fill("test@4321")
            desktop_page.locator("button:has-text('Unlock')").click()
            desktop_page.wait_for_timeout(3000)

        desktop_page.wait_for_selector("header", timeout=20000)
        desktop_page.wait_for_timeout(2000)
        desktop_page.screenshot(path="verification/desktop_weather_header.png")
        print("Captured desktop screenshot: verification/desktop_weather_header.png")

        browser.close()
        print("Verification run completely successfully!")

if __name__ == "__main__":
    run()
