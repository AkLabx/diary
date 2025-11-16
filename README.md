<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Diary

A simple and elegant web application to write and save your life events. All your data is end-to-end encrypted and stored securely.

View your app in AI Studio: https://ai.studio/apps/drive/1Yn1tJRanxKZPeF1WvrS5gwznXM_2b1-D

## Run Locally

**Prerequisites:**  [Node.js](https://nodejs.org/)

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up Supabase:**
    This project uses Supabase for the backend. You will need to create a project on [supabase.com](https://supabase.com) and follow the SQL setup instructions in `lib/supabaseClient.ts` to configure your database tables and security policies. Once your project is created, update the `supabaseUrl` and `supabaseKey` in the same file.
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open the local URL shown in your terminal (e.g., `http://localhost:5173`) to view it in the browser.

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. Any push to the `main` branch will trigger the deployment workflow.
