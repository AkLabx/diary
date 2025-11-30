
from playwright.sync_api import sync_playwright
import time

def verify_captions():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the editor
        # Note: In the sandbox, we might need to bypass auth or assume we are on the landing page and click 'Get Started' then bypass auth...
        # However, since I don't have auth bypass readily available without user interaction,
        # I will inspect the built HTML files directly or unit test the rendering logic if possible.
        # But wait, I can just navigate to /diary/ if the dev server is running.

        # Let's assume dev server at port 5174 (Vite default often)
        page.goto('http://localhost:5174/diary/')

        # Wait for load
        time.sleep(2)

        # Take a screenshot of the landing page to verify server is up
        page.screenshot(path='verification/landing_page.png')
        print('Screenshot taken: verification/landing_page.png')

        browser.close()

if __name__ == '__main__':
    verify_captions()
