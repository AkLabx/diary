import sys
import time
import subprocess
import urllib.request
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def wait_for_server(url, timeout=20):
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
    print("Starting Vite server on port 5173...")
    server = subprocess.Popen(
        ["cmd.exe", "/c", "powershell.bat", "npm", "run", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    try:
        if not wait_for_server("http://localhost:5173/", timeout=30):
            print("Failed to start or reach Vite server on port 5173.")
            if server.poll() is not None:
                out, err = server.communicate()
                print("Server exited with code:", server.returncode)
                print("Server STDOUT:", out)
                print("Server STDERR:", err)
            return False

        print("Vite server is running. Launching Playwright Chromium...")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1280, 'height': 800})
            page = context.new_page()

            print("1. Navigating to Diary App login...")
            page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)

            # Check if login required
            email_input = page.locator("input[type='email']")
            if email_input.is_visible():
                print("Entering credentials (testuser@diary.com)...")
                email_input.fill("testuser@diary.com")
                page.locator("input[type='password']").fill("test@4321")
                page.locator("button[type='submit']").click()
                page.wait_for_timeout(3500)

            # Master key password prompt
            key_input = page.locator("input[type='password']")
            if key_input.is_visible():
                print("Unlocking master encryption key (test@4321)...")
                key_input.fill("test@4321")
                page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
                page.wait_for_timeout(4000)

            print("2. Navigating to Intentions Hub (/app/tasks)...")
            intentions_link = page.locator("a:has-text('Intentions')").first
            if intentions_link.is_visible():
                intentions_link.click()
            else:
                page.goto("http://localhost:5173/#/app/tasks", wait_until="domcontentloaded", timeout=15000)

            page.wait_for_timeout(2500)

            # Verify page header
            header = page.locator("h1:has-text('Personal Intentions')")
            print("Personal Intentions header visible:", header.is_visible())

            print("3. Testing Quick Intention Creation...")
            quick_input = page.locator("input[placeholder*='gentle intention']")
            if quick_input.is_visible():
                quick_input.fill("Schedule doctor appointment for health checkup")
                quick_input.press("Enter")
                page.wait_for_timeout(3000)
                print("Created intention via quick input!")

            # Capture active tasks screenshot
            page.screenshot(path="verification/tasks_hub_active.png")
            print("Captured verification/tasks_hub_active.png")

            print("4. Testing Interactive Completion Toggle...")
            task_card = page.locator("p:has-text('Schedule doctor appointment')").first
            if task_card.is_visible():
                print("Task card found! Clicking check toggle...")
                # Click the check button on this card
                card_container = page.locator("div.group:has-text('Schedule doctor appointment')").first
                check_btn = card_container.locator("button[aria-label*='Mark']").first
                check_btn.click()
                page.wait_for_timeout(2500)
                print("Toggled task!")

            # Switch to Accomplished tab
            accomplished_tab = page.locator("button:has-text('Accomplished')").first
            if accomplished_tab.is_visible():
                accomplished_tab.click()
                page.wait_for_timeout(1500)

            page.screenshot(path="verification/tasks_hub_completed.png")
            print("Captured verification/tasks_hub_completed.png")

            print("5. Testing Modal Editor Creation...")
            new_btn = page.locator("button:has-text('New Intention')").first
            if new_btn.is_visible():
                new_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/tasks_editor_modal.png")
                print("Captured verification/tasks_editor_modal.png")

            browser.close()
            print("Playwright test completed successfully!")
            return True

    finally:
        print("Stopping Vite dev server...")
        server.terminate()
        try:
            server.wait(timeout=5)
        except Exception:
            server.kill()

if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
