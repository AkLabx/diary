
from playwright.sync_api import sync_playwright
import time

def verify_captions():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Use the port found in the logs (5179)
        url = 'http://localhost:5179/diary/'
        print(f'Navigating to {url}')

        try:
            page.goto(url, timeout=10000)
            # Wait for load
            time.sleep(2)

            # Take a screenshot
            page.screenshot(path='verification/landing_page_5179.png')
            print('Screenshot taken: verification/landing_page_5179.png')
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_captions()
