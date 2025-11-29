from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5174/diary/")
            page.goto("http://localhost:5174/diary/")
            page.wait_for_timeout(2000)
            print("Title:", page.title())
            page.screenshot(path="/home/jules/verification/landing_page_5174.png")
            print("Screenshot taken.")

            # Check for specific elements of Landing Page to confirm it loaded
            # Use a broader check
            content = page.content()
            if "Secure Diary" in content:
                 print("Landing page loaded successfully (text found).")
            else:
                 print("Landing page text 'Secure Diary' not found.")
                 # Print snippet of content
                 print("Content snippet:", content[:500])

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
