import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to allow any host (for ngrok tunneling)
function allowAllHosts() {
  return {
    name: 'allow-all-hosts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Rewrite host header so Vite's built-in check always passes
        req.headers.host = 'localhost';
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), allowAllHosts()],
  server: {
    host: true, // Expose on local network
    allowedHosts: true, // Allow ngrok and all external hosts
    proxy: {
      // Proxy API routes to Flask backend
      '/bb84': { target: 'http://localhost:5000', changeOrigin: true },
      '/encrypt': { target: 'http://localhost:5000', changeOrigin: true },
      '/decrypt': { target: 'http://localhost:5000', changeOrigin: true },
      '/create-room': { target: 'http://localhost:5000', changeOrigin: true },
      '/room-status': { target: 'http://localhost:5000', changeOrigin: true },
      '/join-room': { target: 'http://localhost:5000', changeOrigin: true },
      '/leave-room': { target: 'http://localhost:5000', changeOrigin: true },
      '/send-message': { target: 'http://localhost:5000', changeOrigin: true },
      '/room-messages': { target: 'http://localhost:5000', changeOrigin: true },
      '/heartbeat': { target: 'http://localhost:5000', changeOrigin: true },
    },
  }
})
