#!/usr/bin/env node
/**
 * 新增作品向导（纯本地脚本，不需要后端 CMS）
 *
 *   npm run new:project
 *
 * 逐项回答几个问题，脚本会：
 *   1) 把新作品追加进 public/data/projects.json（原文件先备份为 projects.json.bak）
 *   2) 为它生成一套占位图（封面 + N 张展示图），之后你把同名图片换成真实截图即可
 */
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { generatePlaceholders } from './gen-placeholders.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = path.join(ROOT, 'public', 'data', 'projects.json')

/* 输入层：交互式终端用 readline；如果标准输入被重定向/管道（非 TTY），
   先把整段输入读进来再逐行消费，这样 `printf '...' | npm run new:project` 也能用。 */
const INTERACTIVE = Boolean(process.stdin.isTTY)
const rl = INTERACTIVE ? createInterface({ input: process.stdin, output: process.stdout }) : null
const pipedLines = INTERACTIVE ? null : readFileSync(0, 'utf8').split(/\r?\n/)
let pipedIndex = 0

async function readLine(promptText) {
  if (rl) return (await rl.question(promptText)).trim()
  process.stdout.write(promptText)
  if (pipedIndex >= pipedLines.length) {
    throw new Error(
      '标准输入已经结束：向导需要交互式终端（在终端里直接运行 npm run new:project），或者直接手工编辑 public/data/projects.json。',
    )
  }
  const line = (pipedLines[pipedIndex++] || '').trim()
  process.stdout.write(`${line}\n`)
  return line
}

const currentYear = String(new Date().getFullYear())

function slugify(text) {
  const base = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/[\u4e00-\u9fa5]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
  return base || `project-${Date.now().toString(36)}`
}

function toList(value) {
  return String(value || '')
    .split(/[,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

async function ask(label, { fallback = '', required = false } = {}) {
  for (;;) {
    const hint = fallback ? `（回车使用：${fallback}）` : required ? '（必填）' : '（可留空）'
    const answer = await readLine(`${label} ${hint}: `)
    if (answer) return answer
    if (fallback) return fallback
    if (!required) return ''
    console.log('  ↑ 这一项必填，请再输入一次。')
  }
}

async function askDescription() {
  console.log('作品介绍（详情页正文）：可以写多行，用空行分段；单独输入一个英文句点 . 结束')
  const lines = []
  for (;;) {
    const line = await readLine('  > ')
    if (line.trim() === '.') break
    lines.push(line)
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * 询问一个双语字段，返回 { zh, en }。
 *
 * 内容字段现在都是双语的：只填一种语言时，另一种语言会回退显示同一段文字
 * （不会空白，但等于没翻译），所以这里明确要求两次输入。
 */
async function askBilingual(label, { fallback = '', required = false } = {}) {
  const zh = await ask(`${label} · 中文`, { fallback, required })
  const en = await ask(`${label} · English`, { required })
  return { zh, en: en || zh }
}

async function askBilingualList(label, { required = false } = {}) {
  const zh = toList(await ask(`${label} · 中文（逗号分隔）`, { required }))
  const enRaw = toList(await ask(`${label} · English (comma separated)`, { required }))
  // 英文按位置与中文对齐；缺的项回退用中文，避免数组长度不一致导致对应错乱
  return zh.map((item, i) => ({ zh: item, en: enRaw[i] || item }))
}

async function askBilingualDescription() {
  console.log('作品介绍 · 中文（详情页正文）：可多行，用空行分段；单独输入 . 结束')
  const zh = await askDescription()
  console.log('作品介绍 · English: same format; a single . to finish')
  const en = await askDescription()
  return { zh, en: en || zh }
}

async function main() {
  console.log('=== 新增作品向导（写入 public/data/projects.json） ===\n')

  const json = JSON.parse(await readFile(DATA_FILE, 'utf8'))
  const projects = Array.isArray(json) ? json : json.projects
  if (!Array.isArray(projects)) {
    throw new Error('projects.json 结构异常：缺少 projects 数组')
  }

  const title = await askBilingual('作品名（列表/详情页显示的标题）', { required: true })
  const defaultSlug = slugify(title.en || title.zh)
  let slug = await ask('slug（网址标识，英文小写+短横线）', { fallback: defaultSlug })
  if (projects.some((item) => item.slug === slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    console.log(`  ↑ slug 重复，已自动改为：${slug}`)
  }
  const subtitle = await askBilingual('副标题（类型 / 技术栈，例如「第三人称生存恐怖 · UE5」）')
  const year = await ask('年份', { fallback: currentYear })
  const role = await askBilingual('担任角色')
  const category = await askBilingual('分类（首页筛选用，例如 第一人称 / 第三人称 / 2D / 桌游）')
  const platforms = toList(await ask('平台（逗号分隔，例如 PC, PS5；语言无关的专名，只填一次）'))
  const tools = toList(await ask('工具 / 技术（逗号分隔，例如 Unity, C#；语言无关，只填一次）'))
  const tags = await askBilingualList('标签（详情页展示）')
  const accent = await ask('主题色（十六进制，例如 #ff5c39）', { fallback: '#ff5c39' })
  const summary = await askBilingual('一句话简介（列表页显示）')
  const description = await askBilingualDescription()
  const demoUrl = await ask('Demo 链接（可留空，留空则详情页显示「Demo 暂未公开」）')
  const demoLabel = demoUrl ? await askBilingual('Demo 按钮文案', { fallback: '试玩 Demo' }) : ''
  const galleryCountRaw = await ask('展示图数量（详情页横向滚动的图片张数）', { fallback: '4' })

  const galleryCount = Math.max(1, Math.min(20, Number.parseInt(galleryCountRaw, 10) || 4))
  const cover = await ask('封面图路径', { fallback: `images/covers/${slug}.svg` })

  const project = {
    slug,
    title,
    subtitle,
    year,
    role,
    platforms,
    tools,
    category,
    tags,
    accent,
    featured: false,
    order: projects.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0) + 1,
    cover,
    summary,
    description,
    highlights: [],
    demo: demoUrl ? { label: demoLabel, url: demoUrl } : null,
    links: [],
    gallery: Array.from({ length: galleryCount }, (_, index) => ({
      src: `images/projects/${slug}/${String(index + 1).padStart(2, '0')}.svg`,
      caption: { zh: '', en: '' },
    })),
  }

  projects.push(project)
  await copyFile(DATA_FILE, `${DATA_FILE}.bak`)
  await writeFile(DATA_FILE, `${JSON.stringify(json, null, 2)}\n`, 'utf8')

  console.log(`\n已写入 projects.json（备份：public/data/projects.json.bak）`)
  console.log('正在生成占位图…')
  await generatePlaceholders({ only: slug })
  console.log(`\n完成！运行 npm run dev 打开首页即可看到《${title.zh || title.en}》。`)
  console.log('提示：把 public/images/ 下的占位图换成真实截图（保持同名）就能直接上线；补充 highlights / links 字段可让详情页更完整。')
  console.log('      记得跑一次 npm run check，它会检查每个双语字段的中英文是否都填了。')
}

try {
  await main()
} catch (error) {
  console.error('\n出错了：', error?.message || error)
  process.exitCode = 1
} finally {
  rl?.close()
}
