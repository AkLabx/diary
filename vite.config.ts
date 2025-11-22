import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path set to '/diary/' for GitHub Pages deployment at https://aklabx.github.io/diary/
  base: '/diary/',
  build: {
    rollupOptions: {
      // Mark these as external so Vite doesn't try to bundle them.
      // They are provided via <script type="importmap"> in index.html
      external: ['@zip.js/zip.js', 'compromise']
    }
  }
})