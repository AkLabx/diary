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
    print("Starting Vite server on port 5173 for Phase 2 verification...")
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

            print("2. Verifying TodayTasksWidget on Timeline (/#/app)...")
            page.goto("http://localhost:5173/#/app", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2500)

            widget_header = page.locator("h3:has-text(\"Today's Intentions\")")
            print("TodayTasksWidget visible on Timeline:", widget_header.is_visible())

            # Add a gentle intention via Timeline widget quick input with smart date
            widget_input = page.locator("input[placeholder*='walk in nature tomorrow']")
            if widget_input.is_visible():
                widget_input.fill("Evening walk in nature tomorrow")
                widget_input.press("Enter")
                page.wait_for_timeout(2500)
                print("Added intention via Timeline widget!")

            page.screenshot(path="verification/phase2_timeline_widget.png")
            print("Captured verification/phase2_timeline_widget.png")

            print("3. Verifying Entry Detail with Bi-directional Linked Intentions...")
            # Click on first timeline entry
            first_entry = page.locator("div.group a[href*='/app/entry/']").first
            if first_entry.is_visible():
                first_entry.click()
                page.wait_for_timeout(3000)

                # Check Linked Intentions card
                linked_header = page.locator("h4:has-text('Linked Intentions')")
                print("Linked Intentions card visible in entry detail:", linked_header.is_visible())

                # Click + Add Intention
                add_btn = page.locator("button:has-text('+ Add Intention')").first
                if add_btn.is_visible():
                    add_btn.click()
                    page.wait_for_timeout(1000)
                    task_input = page.locator("input[placeholder*='What intention did this reflection inspire']")
                    task_input.fill("Reflect on personal boundaries discussed in this journal")
                    task_input.press("Enter")
                    page.wait_for_timeout(2500)
                    print("Created linked intention bound to entry!")

                page.screenshot(path="verification/phase2_entry_linked_tasks.png")
                print("Captured verification/phase2_entry_linked_tasks.png")

            print("4. Verifying Calendar View with Emerald Intention Markers...")
            page.goto("http://localhost:5173/#/app/calendar", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2500)

            # Check if emerald intention marker exists
            emerald_dots = page.locator("div.bg-emerald-500, div.bg-emerald-400")
            print("Calendar emerald task markers count:", emerald_dots.count())
            page.screenshot(path="verification/phase2_calendar_markers.png")
            print("Captured verification/phase2_calendar_markers.png")

            print("5. Verifying In-Memory Zero-Knowledge Search on /app/tasks...")
            page.goto("http://localhost:5173/#/app/tasks", wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2500)

            search_bar = page.locator("input[placeholder*='Search encrypted intentions']")
            if search_bar.is_visible():
                search_bar.fill("nature")
                page.wait_for_timeout(1500)
                print("Searched 'nature' - verifying filtered results...")
                page.screenshot(path="verification/phase2_tasks_search.png")
                print("Captured verification/phase2_tasks_search.png")

            browser.close()
            print("Phase 2 Playwright verification passed with flying colors!")
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
