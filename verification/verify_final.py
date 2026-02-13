from playwright.sync_api import Page, expect, sync_playwright
import re

def test_login_and_calendar(page: Page):
    # 1. Login
    print("Navigating to Login...")
    page.goto("http://localhost:5173/diary/#/login", timeout=60000)

    print("Filling credentials...")
    page.get_by_placeholder("Email").fill("testuser@diary.com")
    page.get_by_placeholder("Password").fill("test1234")

    print("Clicking Sign In...")
    page.get_by_role("button", name="Sign In", exact=True).click()

    print("Waiting for redirection to App...")
    page.wait_for_url("**/app", timeout=20000)

    # 2. Handle Encryption Setup / Unlock
    print("Checking app state...")

    for i in range(30):
        if page.get_by_text("Timeline").first.is_visible():
            print("Dashboard (Timeline) detected. Logged in and unlocked.")
            break

        if page.get_by_role("heading", name="Final Security Step").is_visible():
            print("Initialization Step 1 required. Proceeding...")
            page.get_by_placeholder("Your password").fill("test1234")
            page.locator("input[type='checkbox']").first.check(force=True)
            page.locator("input[type='checkbox']").nth(1).check(force=True)
            page.get_by_role("button", name="Initialize Diary").click()
            page.wait_for_timeout(2000)
            continue

        if page.get_by_role("heading", name="Setup Complete!").is_visible():
             print("Initialization Step 2 required (Download Kit)...")
             try:
                 with page.expect_download(timeout=5000) as download_info:
                     page.get_by_role("button", name="Download Recovery Kit").click()
                 print("Download triggered.")
             except:
                 print("Download verify skipped or failed.")

             continue_btn = page.get_by_role("button", name="Continue to App")
             if continue_btn.is_visible():
                 continue_btn.click()
             page.wait_for_timeout(2000)
             continue

        if page.get_by_role("heading", name="Unlock Your Diary").is_visible():
            print("Unlock required. Proceeding...")
            page.get_by_placeholder("Your password").fill("test1234")
            page.get_by_role("button", name="Unlock with Password").click()
            page.wait_for_timeout(2000)
            continue

        if page.get_by_text("Initializing Secure Session...").is_visible():
            print("Still initializing...")
            page.wait_for_timeout(1000)
            continue

        page.wait_for_timeout(1000)
    else:
        if not page.get_by_text("Timeline").first.is_visible():
            raise Exception("Failed to reach dashboard state")

    # 3. Navigate to Calendar directly (Mobile)
    print("Navigating to Calendar URL directly (Mobile)...")
    page.goto("http://localhost:5173/diary/#/app/calendar")
    page.wait_for_url("**/calendar", timeout=10000)

    # 4. Interact with Calendar
    print("Waiting for calendar cell '10'...")
    try:
        if page.get_by_role("heading", name="Unlock Your Diary").is_visible():
             print("Stuck on unlock again. Unlocking...")
             page.get_by_placeholder("Your password").fill("test1234")
             page.get_by_role("button", name="Unlock with Password").click()

        cell = page.get_by_text("10", exact=True).first
        cell.wait_for(timeout=10000)
    except:
        raise

    print("Clicking date 10...")
    cell.click()

    # 5. Verify menu opens (Mobile Modal)
    print("Waiting for menu (Mobile Modal)...")
    modal_button = page.locator("button").filter(has_text="Write a new diary entry")
    expect(modal_button).to_be_visible()

    print("Menu Visible. Clicking New Entry...")
    modal_button.click()

    # 6. Verify navigation to editor
    print("Verifying navigation to Editor...")
    expect(page).to_have_url(re.compile(r".*/new\?date=.*"), timeout=10000)

    print("Successfully navigated to New Entry page!")
    page.screenshot(path="verification/success_mobile.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox"])
        # Set Mobile Viewport
        page = browser.new_page(viewport={"width": 375, "height": 667}, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1")
        try:
            test_login_and_calendar(page)
        except Exception as e:
            print(f"Test failed: {e}")
            raise e
        finally:
            browser.close()
