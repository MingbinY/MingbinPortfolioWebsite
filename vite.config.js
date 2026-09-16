import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯静态站点：base 用相对路径，方便部署到任意目录 / 任意静态托管（GitHub Pages、Netlify、Vercel、
// 对象存储、甚至本地双击 dist/index.html 的简单静态服务器）。
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
