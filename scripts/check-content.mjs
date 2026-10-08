#!/usr/bin/env node
/**
 * 内容自检脚本（零依赖，改完 JSON 跑一下更放心）
 *
 *   npm run check
 *
 * 检查项目：
 *  · projects.json 语法是否合法（不合法会指出大致位置）
 *  · 必填字段是否缺失（slug / title / cover）
 *  · slug 是否重复、是否符合网址规范、order 是否重复
 *  · cover 与 gallery 引用的本地图片文件是否真的存在
 *  · demo / links 的 url 是否像合法链接
 *  · 顺便列出 public/images 里没有被任何作品引用的图片，方便清理
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = path.join(ROOT, 'public', 'data', 'projects.json')
const PUBLIC_DIR = path.join(ROOT, 'public')

const errors = []
const warnings = []
const infos = []

const localPath = (value) => path.join(PUBLIC_DIR, String(value).replace(/^\.?\//, ''))
const isRemote = (value) => /^(https?:)?\/\//i.test(String(value || ''))

async function fileExists(file) {
  try {
    await readFile(file)
    return true
  } catch {
    return false
  }
}

async function collectFiles(dir, base = dir) {
  const files = []
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(full, base)))
    else files.push(path.relative(base, full).split(path.sep).join('/'))
  }
  return files
}

async function main() {
  let json
  try {
    json = JSON.parse(await readFile(DATA_FILE, 'utf8'))
  } catch (error) {
    console.error(`✗ 无法读取/解析 ${path.relative(ROOT, DATA_FILE)}`)
    console.error(`  ${error.message}`)
    process.exitCode = 1
    return
  }

  const site = Array.isArray(json) ? null : json.site
  const projects = Array.isArray(json) ? json : json.projects

  if (!Array.isArray(projects)) {
    console.error('✗ 顶层结构不对：应该是 { site: {...}, projects: [...] }')
    process.exitCode = 1
    return
  }
  if (!site || !site.title) warnings.push('site.title 为空，Header/首页大标题会显示默认值 PORTFOLIO')
  if (!site?.contact?.email) warnings.push('site.contact.email 为空，导航上的「联系我」按钮不会显示')

  const seenSlugs = new Map()
  const seenOrders = new Map()
  const referenced = new Set()

  for (const [index, project] of projects.entries()) {
    const label = project?.slug || `第 ${index + 1} 条`
    if (!project || typeof project !== 'object') {
      errors.push(`${label}：不是一个对象`)
      continue
    }
    if (!project.slug) errors.push(`${label}：缺少必填字段 slug`)
    else {
      if (seenSlugs.has(project.slug)) errors.push(`slug 重复：${project.slug}（与第 ${seenSlugs.get(project.slug) + 1} 条重复）`)
      else seenSlugs.set(project.slug, index)
      if (!/^[a-z0-9][a-z0-9-]*$/.test(project.slug)) {
        warnings.push(`${label}：slug「${project.slug}」含非小写字母/数字/短横线，网址里可能出现转义，建议改成 a-z0-9-`)
      }
    }
    if (!project.title) errors.push(`${label}：缺少必填字段 title`)
    if (project.order != null) {
      const order = Number(project.order)
      if (seenOrders.has(order)) warnings.push(`order 重复：${order}（${label} 与第 ${seenOrders.get(order) + 1} 条）`)
      else seenOrders.set(order, index)
    } else {
      warnings.push(`${label}：没有 order，将按数组顺序排在最后`)
    }
    if (!project.summary) warnings.push(`${label}：没有 summary，首页卡片只显示标题`)
    if (!project.description) warnings.push(`${label}：没有 description，详情页介绍区会是空的`)
    if (project.highlights != null && !Array.isArray(project.highlights)) warnings.push(`${label}：highlights 应该是数组`)
    if (project.tags != null && !Array.isArray(project.tags)) warnings.push(`${label}：tags 应该是数组`)
    if (project.demo && !project.demo.url) warnings.push(`${label}：demo 有值但缺少 url，详情页会显示「Demo 暂未公开」`)
    for (const link of [project.demo, ...(Array.isArray(project.links) ? project.links : [])].filter(Boolean)) {
      if (link.url && !/^(https?:)?\/\//i.test(link.url) && !link.url.startsWith('mailto:')) {
        warnings.push(`${label}：链接「${link.url}」不像完整网址（建议以 https:// 开头）`)
      }
    }

    const images = [project.cover, ...(Array.isArray(project.gallery) ? project.gallery.map((g) => (typeof g === 'string' ? g : g?.src)) : [])].filter(Boolean)
    if (!project.cover) errors.push(`${label}：缺少必填字段 cover（列表页封面图）`)
    if (!Array.isArray(project.gallery) || project.gallery.length === 0) {
      warnings.push(`${label}：gallery 为空，详情页的图片区会显示提示文案`)
    } else if (project.gallery.length < 3) {
      infos.push(`${label}：gallery 只有 ${project.gallery.length} 张图，横向滚动的效果不明显`)
    }

    for (const image of images) {
      if (isRemote(image)) continue
      referenced.add(String(image).replace(/^\.?\//, ''))
      if (!(await fileExists(localPath(image)))) {
        errors.push(`${label}：图片不存在 → public/${String(image).replace(/^\.?\//, '')}（先放图，或运行 npm run gen:art 生成占位图）`)
      }
    }
  }

  // 站点级图片（首页「关于我」头像等）
  for (const image of [site?.about?.portrait].filter(Boolean)) {
    if (isRemote(image)) continue
    const relative = String(image).replace(/^\.?\//, '')
    referenced.add(relative)
    if (!(await fileExists(localPath(image)))) {
      errors.push(`site.about.portrait：图片不存在 → public/${relative}`)
    }
  }

  const allFiles = (await collectFiles(path.join(PUBLIC_DIR, 'images'))).map((file) => `images/${file}`)
  const unused = allFiles.filter((file) => !referenced.has(file))

  console.log(`内容自检：${path.relative(ROOT, DATA_FILE)}`)
  console.log(`  作品数量：${projects.length}`)
  console.log(`  引用图片：${referenced.size} 个（public/images 下共 ${allFiles.length} 个文件）\n`)

  for (const item of infos) console.log(`  · 提示   ${item}`)
  for (const item of warnings) console.log(`  ! 警告   ${item}`)
  for (const item of errors) console.log(`  ✗ 错误   ${item}`)
  if (unused.length) {
    console.log(`\n  · 未被引用的图片（可删除或补进 JSON）：`)
    for (const file of unused) console.log(`      ${file}`)
  }

  console.log(`\n结果：${errors.length} 个错误，${warnings.length} 个警告`)
  process.exitCode = errors.length ? 1 : 0
}

main().catch((error) => {
  console.error('自检脚本异常：', error)
  process.exitCode = 1
})
