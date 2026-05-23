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
      // ThingsBoard REST API — avoids CORS in the browser
      '/tb-api': {
        target: 'http://13.205.43.53:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tb-api/, ''),
      },
      // TTS (The Things Stack) REST API — for direct downlink push
      '/tts-api': {
        target: 'http://13.205.43.53',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tts-api/, ''),
      },
      // Node-RED HTTP endpoints
      '/nr-api': {
        target: 'http://13.205.43.53:1880',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nr-api/, ''),
      },
    },
  },
})

