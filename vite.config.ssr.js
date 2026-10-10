import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 预渲染（SSG）专用的 Vite 配置 —— 只被 `vite build --config vite.config.ssr.js` 使用。
//
// 为什么不复用 vite.config.js：`publicDir` 会被复制进 outDir，若共用一个配置，
// public/ 下所有图片和数据会被复制到 dist/ssr（纯属浪费）；而且 build.ssr 字段
// 是全局的，写在主配置里会让普通 `vite build` 也走 SSR 分支。
//
// 产物 dist/ssr/ 已在 .gitignore 中，不会进仓库、也不会被部署脚本上传。
export default defineConfig({
  base: './',
  plugins: [react()],
  // 服务端构建不需要复制静态资源
  publicDir: false,
  build: {
    ssr: fileURLToPath(new URL('./src/entry-server.jsx', import.meta.url)),
    outDir: 'dist/ssr',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  // 注意：不要把 react / react-dom 放进 ssr.noExternal。
  // 那样会把 react 的副本打进 bundle，而 prerender.mjs 里的 react-dom/server 从
  // node_modules 解析到另一份 react，造成「Invalid hook call / 读取 useContext 为 null」。
  // 保持 external，让 react、react-dom/server、react-router-dom 共享同一份实例。
})
