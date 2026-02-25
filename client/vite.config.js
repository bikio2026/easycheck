import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3080,
    proxy: {
      '/api': 'http://localhost:3081',
      '/socket.io': { target: 'http://localhost:3081', ws: true },
    },
  },
})
