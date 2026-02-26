from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        print("Navigating to http://localhost:5173/diary/...")
        try:
            page.goto("http://localhost:5173/diary/", wait_until="domcontentloaded", timeout=60000)
        except Exception as e:
            print(f"Navigation error (continuing anyway to check content): {e}")

        # Initial wait for React hydration
        page.wait_for_timeout(5000)

        # Look for "Loading..."
        loading_text = page.locator("text=Loading...")
        if loading_text.is_visible():
            print("Loading screen visible. Waiting for it to disappear...")
            try:
                loading_text.wait_for(state="detached", timeout=20000)
                print("Loading screen disappeared successfully.")
            except Exception as e:
                print(f"FAILED: Loading screen did not disappear within 20 seconds. Error: {e}")
        else:
            print("Loading screen was not initially visible (fast load or failure).")

        # Take screenshot of the result
        page.screenshot(path="verification/app_loaded.png")
        print("Screenshot saved to verification/app_loaded.png")
        browser.close()

if __name__ == "__main__":
    run()
