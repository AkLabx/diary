from playwright.sync_api import sync_playwright

def verify_timeline():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We need to mock some localStorage to bypass the encryption setup and password screen
        page.goto("http://localhost:5173/diary/")

        # Mock auth state if possible or just rely on local state
        # The app might need us to fill out a profile or enter password
        page.evaluate("""() => {
            localStorage.setItem('diary_profile', JSON.stringify({
                id: 'test_user',
                salt: 'test_salt',
                key_check_value: 'test',
                key_check_iv: 'test',
                full_name: 'Test User'
            }));
            localStorage.setItem('diary_encryption_key', 'mock_key');
            localStorage.setItem('diary_entries_metadata', JSON.stringify([
                {
                    id: '1',
                    title: 'Jan Entry',
                    content: 'This is test content',
                    created_at: '2024-01-15T12:00:00.000Z',
                    tags: ['Test', 'Jan']
                },
                {
                    id: '2',
                    title: 'Feb Entry',
                    content: 'This is test content',
                    created_at: '2024-02-15T12:00:00.000Z',
                    tags: ['Test', 'Feb']
                }
            ]));
        }""")

        # Reload to apply mocked state
        page.goto("http://localhost:5173/diary/app")
        page.wait_for_timeout(2000)

        page.screenshot(path="verification/timeline.png")

        browser.close()

if __name__ == "__main__":
    verify_timeline()
