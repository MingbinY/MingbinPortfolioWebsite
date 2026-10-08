import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯静态站点：base 用相对路径，方便部署到任意目录 / 任意静态托管（GitHub Pages、Netlify、Vercel、
// 对象存储、Nginx…）。
// 构建产物输出到 docs/ 并提交进仓库：GitHub Pages 的「Deploy from a branch」只允许选
// 根目录 / 或 /docs，所以把产物固定放 docs/ 就能「不用 CI、直接发布」。
// 注意：docs/ 是生成物，每次改完内容记得 npm run build 并把它一起提交。
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
    outDir: 'docs',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
})
