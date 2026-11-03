import sys
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        
        print("Navigating to http://localhost:5173/#/login ...")
        page.goto("http://localhost:5173/#/login")
        page.wait_for_timeout(1500)
        
        email = page.locator("input[type='email']")
        if email.is_visible():
            email.fill('testuser@diary.com')
            page.locator("input[type='password']").fill('test@4321')
            page.locator("button[type='submit']").click()
            page.wait_for_timeout(3000)
            
        key_input = page.locator("input[placeholder*='password' i], input[type='password']")
        if key_input.is_visible():
            key_input.fill('test@4321')
            page.locator("button[type='submit'], button:has-text('Unlock')").first.click()
            page.wait_for_timeout(3000)
            
        page.wait_for_selector("nav", timeout=10000)
        page.wait_for_timeout(1000)
        
        # 1. Capture Dashboard with Festive Diya
        page.screenshot(path='verification/dashboard_with_festive_diya.png')
        print("Saved verification/dashboard_with_festive_diya.png")
        
        # 2. Click the Festive Diya to trigger sparklers and blessing
        diya_btn = page.locator("button[aria-label*='Festive Diya' i]")
        if diya_btn.is_visible():
            print("Clicking Festive Diya to ignite sparklers...")
            diya_btn.click()
            page.wait_for_timeout(200) # capture mid-sparkle
            page.screenshot(path='verification/diya_sparklers_active.png')
            print("Saved verification/diya_sparklers_active.png")

if __name__ == '__main__':
    run()
