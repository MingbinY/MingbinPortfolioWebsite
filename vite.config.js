import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯静态站点：base 用相对路径，方便部署到任意目录 / 任意静态托管（Cloudflare Pages、
// Netlify、Vercel、对象存储、Nginx…）。
//
// 部署现状（2026-10-10 起）：托管在 Cloudflare Pages，连本仓库、由它执行 npm run build，
// Build output directory 填 docs。因此 docs/ 与 dist/ 都已加进 .gitignore，不再提交产物。
//
// 构建分三步（见 package.json 的 build 脚本）：
//   1. vite build                     → 客户端产物写入 docs/
//   2. vite build --config vite.config.ssr.js
//                                     → 预渲染用的服务端 bundle 写入 dist/ssr/
//   3. node scripts/prerender.mjs     → 把首页 HTML 注入 docs/index.html，让产物自带内容
//
// 注意：没有第 3 步的 docs/index.html 只是个空壳（<div id="root"></div>），
// 页面内容全靠 JS 渲染。所以托管平台必须执行完整的 npm run build，不能跳过构建。
//
// SSR 用独立配置的原因：build.ssr / publicDir 这些字段是全局的，写在本文件里会连带影响
// 客户端构建（实测会把客户端构建也变成 SSR 构建，并把 public/ 复制进 dist/ssr）。
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
    rollupOptions: {
      // 显式指定客户端入口，避免把预渲染用的服务端入口当成页面入口
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
    },
  },
})
