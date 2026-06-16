import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxy Node-RED requests to avoid browser CORS block
      '/nr-api': {
        target: 'http://13.205.43.53:1880',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nr-api/, ''),
      },
    },
  },
})


