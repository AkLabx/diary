from playwright.sync_api import sync_playwright

def verify_install_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a mobile device or just a regular window
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:5174/diary/")
            page.goto("http://localhost:5174/diary/")
            page.wait_for_timeout(2000)

            # Since we can't easily simulate 'beforeinstallprompt' in headless mode without
            # specific browser args or CDP commands, we will verify the code exists in the page source
            # or try to execute the event dispatch manually.

            # Dispatch the event manually to trigger the button visibility
            page.evaluate("""
                const event = new Event('beforeinstallprompt');
                window.dispatchEvent(event);
            """)

            page.wait_for_timeout(1000)

            # Take screenshot
            page.screenshot(path="/home/jules/verification/install_button.png")
            print("Screenshot taken.")

            # Check if button is visible
            install_btn = page.get_by_text("Install App")
            if install_btn.is_visible():
                print("Install button is visible!")
            else:
                print("Install button NOT visible (might need more time or event didn't trigger logic correctly).")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_install_button()
