from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173/")
            page.goto("http://localhost:5173/")
            page.wait_for_timeout(2000)
            print("Title:", page.title())
            page.screenshot(path="/home/jules/verification/landing_page_verified.png")
            print("Screenshot taken.")

            # Check for specific elements of Landing Page to confirm it loaded
            if page.get_by_text("Secure Diary").is_visible():
                print("Landing page loaded successfully.")
            else:
                print("Landing page element not found.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
