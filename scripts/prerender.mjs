/**
 * 把首页预渲染结果注入构建产物 docs/index.html。
 *
 * 在 `vite build`（客户端）与 `vite build --ssr`（服务端）之后运行：
 *   1. 读 public/data/projects.json
 *   2. 用 dist/ssr/entry-server.js 的 render() 拿到首页 HTML
 *   3. 用正则把 HTML 注入 docs/index.html 的 <div id="root"></div>
 *
 * 为什么不用 cheerio 等依赖：这里只需要替换一个固定字符串，正则足够且零依赖。
 *
 * 失败即非零退出，避免悄悄发布一个空壳页面。
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')

const templatePath = resolve(projectRoot, 'docs/index.html')
const dataPath = resolve(projectRoot, 'public/data/projects.json')
const ssrEntryPath = resolve(projectRoot, 'dist/ssr/entry-server.js')

const ROOT_MARKUP = '<div id="root"></div>'

/** 构建产物里的根节点可能带属性，这里做一次宽松匹配 */
const ROOT_PATTERN = /<div id="root">\s*<\/div>/

/**
 * 把数据也塞进 HTML。
 *
 * 只预渲染 HTML 是不够的：客户端首帧用的是「loading + 空列表」，与预渲染出来的
 * 「ready + 5 个作品」不一致，React 会报 hydration mismatch 并把内容整段重建。
 * 让客户端开局就拿到同一份数据，首帧才能与 HTML 完全对齐。
 */
const SEED_SCRIPT_ID = 'portfolio-seed-data'

function buildSeedScript(data) {
  // JSON 里若出现 </script 会提前闭合脚本，必须转义
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/json" id="${SEED_SCRIPT_ID}">${json}</script>`
}

async function main() {
  for (const [label, path] of [
    ['构建产物 docs/index.html', templatePath],
    ['数据 public/data/projects.json', dataPath],
    ['SSR 入口 dist/ssr/entry-server.js', ssrEntryPath],
  ]) {
    if (!existsSync(path)) {
      throw new Error(`找不到${label}：${path}\n       请先执行 vite build 与 vite build --ssr。`)
    }
  }

  const template = await readFile(templatePath, 'utf8')
  if (!ROOT_PATTERN.test(template)) {
    throw new Error(
      `docs/index.html 里找不到可注入的 <div id="root"></div>：${templatePath}\n` +
        '       若已预渲染过，请先重新运行 vite build（会清空 docs/）。',
    )
  }

  const data = JSON.parse(await readFile(dataPath, 'utf8'))
  const { render } = await import(`file://${ssrEntryPath.replace(/\\/g, '/')}`)
  const appHtml = render({ data, url: '/' })

  if (!appHtml || appHtml.length < 500) {
    throw new Error(`预渲染结果过短（${appHtml ? appHtml.length : 0} 字节），疑似渲染失败，已中止。`)
  }

  const output = template
    .replace(ROOT_PATTERN, `<div id="root">${appHtml}</div>`)
    .replace('</body>', `  ${buildSeedScript(data)}\n  </body>`)
  await writeFile(templatePath, output, 'utf8')

  const kib = (Buffer.byteLength(output) / 1024).toFixed(1)
  console.log(`[prerender] 首页已注入 docs/index.html（${appHtml.length} 字节内容，整页 ${kib} KB）`)
}

main().catch((error) => {
  console.error(`[prerender] 失败：${error.message}`)
  process.exit(1)
})
