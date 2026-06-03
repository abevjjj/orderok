import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        // 确保 cookie 透传（session）
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie)
            }
          })
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    // 构建产物可直接由 Flask 托管
    assetsDir: 'assets'
  }
})
