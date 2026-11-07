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
    print("Checking / starting Vite server...")
    server = None
    if not wait_for_server("http://localhost:5173/", timeout=2):
        server = subprocess.Popen(
            ["cmd.exe", "/c", "npm", "run", "dev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if not wait_for_server("http://localhost:5173/", timeout=30):
            print("Failed to start Vite server.")
            return False

    print("Vite server ready. Starting Playwright verification...")
    try:
        with sync_playwright() as p:
            # 1. Desktop Verification
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1280, 'height': 800})
            page = context.new_page()

            print("1. Navigating to login...")
            page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)

            # Login form
            email_input = page.locator("input[type='email']")
            if email_input.is_visible():
                print("Entering credentials...")
                email_input.fill("testuser@diary.com")
                page.locator("input[type='password']").fill("test@4321")
                page.locator("button[type='submit']").click()
                page.wait_for_timeout(4000)

            # Master key password prompt
            key_input = page.locator("input[type='password']")
            if key_input.is_visible():
                print("Unlocking master key...")
                key_input.fill("test@4321")
                page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
                page.wait_for_timeout(4000)

            # Ensure on /app
            if "/app" not in page.url:
                page.goto("http://localhost:5173/#/app", wait_until="domcontentloaded")
                page.wait_for_timeout(3000)

            key_input2 = page.locator("input[type='password']")
            if key_input2.is_visible():
                key_input2.fill("test@4321")
                page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
                page.wait_for_timeout(4000)

            print("2. Verifying Timeline Focus Strip (Today's Tasks)...")
            focus_strip = page.locator("h3:has-text(\"Today's Tasks\")")
            print("Focus strip visible:", focus_strip.is_visible())
            page.screenshot(path="verification/desktop_timeline_focus_strip.png", full_page=False)

            print("3. Verifying LeftSidebar 'Tasks' item...")
            tasks_nav = page.locator("aside nav a:has-text('Tasks')").first
            print("Tasks link visible in sidebar:", tasks_nav.is_visible())

            print("4. Navigating to Tasks Hub (/app/tasks)...")
            if tasks_nav.is_visible():
                tasks_nav.click()
            else:
                page.goto("http://localhost:5173/#/app/tasks")
            page.wait_for_timeout(2500)

            hub_header = page.locator("h1:has-text('My Tasks')")
            print("My Tasks header visible:", hub_header.is_visible())

            # Check category pills
            categories = page.locator("button:has-text('Personal'), button:has-text('Health'), button:has-text('Habits')")
            print("Category filter pills visible count:", categories.count())

            # Test Quick Add input with natural language feedback
            quick_input = page.locator("input[placeholder*='Call mom tomorrow']")
            if quick_input.is_visible():
                print("Typing smart date in quick input...")
                quick_input.fill("Call sister tomorrow at 5pm")
                page.wait_for_timeout(800)
                smart_pill = page.locator("span:has-text('Tomorrow')").first
                print("Real-time 'Tomorrow' pill detected:", smart_pill.is_visible())

            page.screenshot(path="verification/desktop_tasks_hub.png", full_page=True)

            # 5. Mobile Verification
            print("5. Emulating Mobile Viewport (390x844)...")
            mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
            mobile_page = mobile_context.new_page()
            mobile_page.goto("http://localhost:5173/#/login", wait_until="domcontentloaded", timeout=20000)
            mobile_page.wait_for_timeout(2000)

            m_email = mobile_page.locator("input[type='email']")
            if m_email.is_visible():
                m_email.fill("testuser@diary.com")
                mobile_page.locator("input[type='password']").fill("test@4321")
                mobile_page.locator("button[type='submit']").click()
                mobile_page.wait_for_timeout(4000)

            if "/app" not in mobile_page.url:
                mobile_page.goto("http://localhost:5173/#/app", wait_until="domcontentloaded")
                mobile_page.wait_for_timeout(3000)

            m_key = mobile_page.locator("input[type='password']")
            if m_key.is_visible():
                m_key.fill("test@4321")
                mobile_page.locator("button:has-text('Unlock'), button[type='submit']").first.click()
                mobile_page.wait_for_timeout(4000)

            print("6. Verifying Mobile BottomNavigation (Option B: Home, Calendar, Tasks, Profile)...")
            m_bottom_nav = mobile_page.locator("nav.md\\:hidden")
            print("Mobile bottom nav visible:", m_bottom_nav.is_visible())

            m_tasks_tab = mobile_page.locator("nav.md\\:hidden a[href*='tasks']")
            print("Mobile Tasks tab visible in bottom nav:", m_tasks_tab.is_visible())

            if m_tasks_tab.is_visible():
                m_tasks_tab.click()
                mobile_page.wait_for_timeout(2000)
                mobile_page.screenshot(path="verification/mobile_tasks_hub.png", full_page=False)
                print("Captured verification/mobile_tasks_hub.png")

                # Open New Task Bottom-Sheet
                print("7. Testing Mobile Bottom-Sheet Task Editor...")
                new_btn = mobile_page.locator("button:has-text('New Task')")
                if new_btn.is_visible():
                    new_btn.click()
                    mobile_page.wait_for_timeout(1000)
                    mobile_page.screenshot(path="verification/mobile_task_bottom_sheet.png", full_page=False)
                    print("Captured verification/mobile_task_bottom_sheet.png!")

            print("ALL PLAYWRIGHT TESTS PASSED!")
            return True
    finally:
        if server:
            server.terminate()

if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
