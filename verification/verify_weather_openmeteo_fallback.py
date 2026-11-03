import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def run():
    print("Starting Open-Meteo Fallback Verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            permissions=['geolocation'],
            geolocation={'latitude': 28.6139, 'longitude': 77.2090}
        )
        page = context.new_page()

        openmeteo_called = []
        openweathermap_called = []

        # Intercept OpenWeatherMap calls and simulate 429 Rate Limit Exceeded
        def handle_owm(route):
            print(f"[MOCK 429] Blocking OpenWeatherMap request: {route.request.url}")
            openweathermap_called.append(route.request.url)
            route.fulfill(
                status=429,
                content_type="application/json",
                body='{"cod": 429, "message": "Your account is temporary blocked due to exceeding of requests limitation of your subscription type. Please respect limits."}'
            )

        page.route("**/api.openweathermap.org/**", handle_owm)

        # Monitor Open-Meteo calls
        def handle_openmeteo(route):
            print(f"[FALLBACK DETECTED] Open-Meteo called: {route.request.url}")
            openmeteo_called.append(route.request.url)
            route.continue_()

        page.route("**/api.open-meteo.com/**", handle_openmeteo)
        page.route("**/geocoding-api.open-meteo.com/**", handle_openmeteo)

        # Clear cached weather first to guarantee fresh API fetch
        page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=60000)
        page.evaluate("() => { localStorage.removeItem('diary_cached_weather'); localStorage.removeItem('diary_custom_city'); }")

        page.wait_for_timeout(1000)

        # Login
        email_input = page.locator("input[type='email']")
        if email_input.is_visible():
            print("Entering login credentials...")
            email_input.fill("testuser@diary.com")
            page.locator("input[type='password']").fill("test@4321")
            page.locator("button[type='submit']").click()
            page.wait_for_timeout(3000)

        # Unlock Master Key if prompt appears
        key_input = page.locator("input[placeholder*='password' i], input[type='password']")
        if key_input.is_visible():
            print("Entering master password...")
            key_input.fill("test@4321")
            unlock_btn = page.locator("button[type='submit'], button:has-text('Unlock')").first
            if unlock_btn.is_visible():
                unlock_btn.click()
            page.wait_for_timeout(3000)

        print("Waiting for header...")
        page.wait_for_selector("header", timeout=20000)
        page.wait_for_timeout(3000)

        # Check weather button in header
        weather_btn = page.locator("header button:has-text('°C'), header button:has-text('Location')").first
        assert weather_btn.is_visible(), "Weather button should be visible in header"
        btn_text = weather_btn.inner_text()
        print(f"Weather button text with Open-Meteo fallback: {btn_text}")

        # Verify fallback was invoked
        assert len(openweathermap_called) > 0, "OpenWeatherMap should have been attempted"
        assert len(openmeteo_called) > 0, "Open-Meteo fallback should have been called"
        print("✓ Verified: OpenWeatherMap returned 429 and Open-Meteo fallback was automatically triggered!")

        page.screenshot(path="verification/weather_fallback_badge.png")
        print("Captured screenshot: verification/weather_fallback_badge.png")

        # Open Weather Modal
        weather_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/weather_fallback_modal.png")
        print("Captured screenshot: verification/weather_fallback_modal.png")

        # Test Custom City Search with Open-Meteo Fallback
        city_input = page.locator("input[placeholder*='e.g. New Delhi']")
        if city_input.is_visible():
            print("Testing city search with 'Paris' (OpenWeatherMap blocked)...")
            city_input.fill("Paris")
            page.locator("button:has-text('Save')").click()
            page.wait_for_timeout(3500)
            page.screenshot(path="verification/weather_fallback_custom_city.png")
            print("Captured screenshot: verification/weather_fallback_custom_city.png")

            # Check that city name 'Paris' or updated weather is visible
            modal_text = page.locator("[role='dialog']").inner_text()
            print(f"Modal content after city update:\n{modal_text}")
            assert "Paris" in modal_text, "Modal should show Paris"

        browser.close()
        print("All Open-Meteo fallback tests completed successfully!")

if __name__ == "__main__":
    run()
