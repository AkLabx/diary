from playwright.sync_api import sync_playwright

def verify_pwa():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a mobile viewport to trigger potential mobile-specific behaviors
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
        page = context.new_page()

        try:
            # Navigate to the app
            page.goto("http://localhost:5174/diary/")
            page.wait_for_load_state("networkidle")

            # Check for install button (it might take a moment to appear if logic is async)
            # Based on the user's description, it appears when installable.
            # We can't easily simulate "beforeinstallprompt" event in headless easily without specific flags,
            # but we can check if the app loads and the manifest is requested (which we did with curl).
            # The previous python script 'verify_install_button.py' seemed to find it.

            # Let's take a screenshot of the landing page
            page.screenshot(path="verification/pwa_screenshot.png")
            print("Screenshot taken.")

            # Verify manifest link in head
            manifest_link = page.locator('link[rel="manifest"]')
            print(f"Manifest link found: {manifest_link.get_attribute('href')}")

            # Verify service worker registration (execute JS)
            sw_registrations = page.evaluate("navigator.serviceWorker.getRegistrations().then(regs => regs.length)")
            print(f"Service Worker registrations found: {sw_registrations}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_pwa()
