import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    define: {
    // จำลองตัวแปร global และ Buffer ของ Node.js ให้ใช้งานบนบราวเซอร์ได้
    global: 'globalThis',
  }
})
