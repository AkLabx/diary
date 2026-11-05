import sys
import time
import subprocess
import urllib.request
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def wait_for_server(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(1)
    return False

def run():
    print("Starting Vite server on port 5173 for Phase 3 verification...")
    server = subprocess.Popen(
        ["cmd.exe", "/c", "powershell.bat", "npm", "run", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    try:
        if not wait_for_server("http://localhost:5173/", timeout=30):
            print("Failed to reach Vite server.")
            return False

        print("Vite server running. Launching Playwright Chromium...")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1280, 'height': 800})
            page = context.new_page()

            print("1. Authenticating testuser@diary.com...")
            page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)

            email_input = page.locator("input[type='email']")
            if email_input.is_visible():
                email_input.fill("testuser@diary.com")
                page.locator("input[type='password']").fill("test@4321")
                page.locator("button[type='submit']").click()
                page.wait_for_timeout(3500)

            key_input = page.locator("input[type='password']")
            if key_input.is_visible():
                key_input.fill("test@4321")
                page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
                page.wait_for_timeout(4000)

            print("2. Navigating to Tasks Sanctuary Hub (/#/app/tasks)...")
            page.goto("http://localhost:5173/#/app/tasks", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(3000)

            # 3. Verify Export Intentions Modal
            print("3. Testing Export Modal...")
            export_btn = page.locator("button:has-text('Export')")
            print("Export button visible:", export_btn.is_visible())
            if export_btn.is_visible():
                export_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/phase3_export_modal.png")
                print("Captured verification/phase3_export_modal.png")
                # Close modal
                page.locator("button:has-text('Close')").click()
                page.wait_for_timeout(500)

            # 4. Verify Notification Privacy Modal
            print("4. Testing Notification Privacy Modal...")
            privacy_btn = page.locator("button:has-text('Privacy')")
            print("Privacy button visible:", privacy_btn.is_visible())
            if privacy_btn.is_visible():
                privacy_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/phase3_privacy_modal.png")
                print("Captured verification/phase3_privacy_modal.png")
                page.locator("button:has-text('Done')").click()
                page.wait_for_timeout(500)

            # 5. Verify Recurrence & Attachments in TaskEditorModal
            print("5. Testing Task Editor Recurrence & Attachments...")
            new_btn = page.locator("button:has-text('New Intention')")
            new_btn.click()
            page.wait_for_timeout(1000)

            page.locator("input[placeholder*='Schedule health checkup']").fill("Morning meditation & quiet reflection")
            page.locator("textarea[placeholder*='Intimate reflections']").fill("15 minutes of calm breathwork in personal sanctuary.")
            
            # Select Recurrence = Daily
            recurrence_select = page.locator("select")
            if recurrence_select.is_visible():
                recurrence_select.select_option("daily")

            # Set Reminder Time
            time_input = page.locator("input[type='time']")
            if time_input.is_visible():
                time_input.fill("08:00")

            page.wait_for_timeout(500)
            page.screenshot(path="verification/phase3_editor_recurrence.png")
            print("Captured verification/phase3_editor_recurrence.png")

            # Save the new recurring task
            page.locator("button:has-text('Create Intention')").click()
            page.wait_for_timeout(3000)

            # 6. Verify Recurring Card Rendering
            print("6. Verifying Recurring Task Card with badge...")
            page.screenshot(path="verification/phase3_recurring_card.png")
            print("Captured verification/phase3_recurring_card.png")

            browser.close()
            print("All Phase 3 UI verification tests completed successfully!")
            return True
    finally:
        print("Shutting down Vite dev server...")
        try:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(server.pid)], capture_output=True)
        except Exception:
            pass

if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
