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
    watch: {
      // 编辑器/工具保存 JSON 时常用「原子写入」（同目录下先建临时文件再改名）。
      // 在 Windows 上 Vite 的文件监听器有时会撞上这些临时文件的 EBUSY 而整个进程崩溃，
      // 这里把它们排除在监听之外（内容改动依然会被监听、热更新照常工作）。
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/*.tmpdir/**', '**/.DS_Store', '**/Thumbs.db'],
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
