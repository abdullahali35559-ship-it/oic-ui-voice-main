import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Force PDFs to open in browser (inline) instead of downloading
      'Content-Disposition': 'inline',
    },
  },
  // Ensure PDF files are served with correct MIME type
  assetsInclude: ['**/*.pdf'],
})

