import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For a repository named `<username>.github.io`, the base path should be '/'.
  // This ensures that assets are loaded correctly from the root of the domain.
  base: '/diary/',
  build: {
    rollupOptions: {
      // Mark these as external so Vite doesn't try to bundle them.
      // They are provided via <script type="importmap"> in index.html
      external: ['@zip.js/zip.js', 'compromise']
    }
  }
})