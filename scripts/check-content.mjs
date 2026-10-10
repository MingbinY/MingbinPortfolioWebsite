#!/usr/bin/env node
/**
 * 内容自检脚本（零依赖，改完 JSON 跑一下更放心）
 *
 *   npm run check
 *
 * 检查项目：
 *  · projects.json 语法是否合法（不合法会指出大致位置）
 *  · 双语字段是否写成 { zh, en } 且两种语言都填了（只填一种会导致切语言后空白/回退）
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

/** 双语文本对象（{ zh, en }） */
function isTextObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && ('zh' in value || 'en' in value)
}

/** 取一个可读的显示值，用于拼出错提示（双语字段取中文优先） */
function display(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (isTextObject(value)) return value.zh || value.en || ''
  return JSON.stringify(value)
}

/** 语言无关的稳定 key（分类筛选、去重都用它） */
function canonical(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (isTextObject(value)) return String(value.zh ?? value.en ?? '')
  return String(value)
}

function toArray(value) {
  if (value == null || value === '') return []
  return Array.isArray(value) ? value : [value]
}

/**
 * 校验一个应当双语的字段：两种语言都要有内容。
 * 这里报 error 而不是 warning —— 缺一种语言在线上就是明确的显示缺陷。
 */
function checkBilingual(label, field, { required = false } = {}) {
  if (field == null || field === '') {
    if (required) errors.push(`${label}：缺少必填的双语文本`)
    return false
  }
  if (!isTextObject(field)) {
    errors.push(`${label}：应为双语对象 { "zh": "…", "en": "…" }，当前是 ${typeof field}`)
    return false
  }
  const zh = typeof field.zh === 'string' ? field.zh.trim() : ''
  const en = typeof field.en === 'string' ? field.en.trim() : ''
  if (!zh && !en) {
    errors.push(`${label}：中英文都是空的`)
    return false
  }
  if (zh && !en) warnings.push(`${label}：缺少英文（en），英文页面会回退显示中文`)
  if (!zh && en) warnings.push(`${label}：缺少中文（zh），中文页面会回退显示英文`)
  return true
}

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

/**
 * 收集 index.html 里引用的本地图片（og:image / twitter:image）。
 *
 * 返回相对 public/ 的路径。站外 URL 与带域名的地址会被忽略 —— 那些不占 public/ 目录，
 * 也不需要在这里校验存在性。
 */
async function collectHtmlImageRefs() {
  let html
  try {
    html = await readFile(path.join(ROOT, 'index.html'), 'utf8')
  } catch {
    return []
  }
  const refs = new Set()
  // 只匹配 <meta property|name="og:image|twitter:image" content="...">
  const pattern = /<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)"[^>]*content="([^"]+)"/gi
  const siteHost = await readSiteHost()
  for (const match of html.matchAll(pattern)) {
    const value = match[1].trim()
    if (!value) continue
    if (isRemote(value)) {
      // 只有指向本站域名（public/CNAME）的绝对地址才对应 public/ 下的本地文件
      const match2 = /^https?:\/\/([^/]+)(\/.*)?$/i.exec(value)
      if (!match2) continue
      const host = match2[1].toLowerCase()
      const pathname = (match2[2] || '').replace(/^\/+/, '')
      if (!pathname) continue
      if (siteHost && host === siteHost) refs.add(pathname)
      continue
    }
    refs.add(value.replace(/^\.?\//, ''))
  }
  return [...refs]
}

/** 站点 canonical 域名（public/CNAME），用于判断 og:image 是否指向本站 */
async function readSiteHost() {
  try {
    const cname = (await readFile(path.join(PUBLIC_DIR, 'CNAME'), 'utf8')).trim().split(/\s+/)[0]
    return cname ? cname.toLowerCase() : null
  } catch {
    return null
  }
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

  // ── site 层的双语字段 ──
  checkBilingual('site.tagline', site?.tagline, { required: true })
  checkBilingual('site.intro', site?.intro)
  checkBilingual('site.footer', site?.footer)
  if (site?.about) {
    checkBilingual('site.about.title', site.about.title, { required: true })
    checkBilingual('site.about.summary', site.about.summary, { required: true })
    for (const [i, item] of toArray(site.about.education).entries()) {
      checkBilingual(`site.about.education[${i}]`, item, { required: true })
    }
    for (const [i, item] of toArray(site.about.skills).entries()) {
      checkBilingual(`site.about.skills[${i}].label`, item?.label, { required: true })
      checkBilingual(`site.about.skills[${i}].value`, item?.value, { required: true })
    }
  }
  for (const [i, item] of toArray(site?.nav).entries()) {
    checkBilingual(`site.nav[${i}].label`, item?.label, { required: true })
  }
  for (const [i, item] of toArray(site?.categoryOrder).entries()) {
    checkBilingual(`site.categoryOrder[${i}]`, item, { required: true })
  }
  for (const [i, item] of toArray(site?.contact?.links).entries()) {
    checkBilingual(`site.contact.links[${i}].label`, item?.label, { required: true })
  }

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

    // ── 作品的双语字段 ──
    checkBilingual(`${label}.title`, project.title, { required: true })
    checkBilingual(`${label}.subtitle`, project.subtitle)
    checkBilingual(`${label}.role`, project.role)
    checkBilingual(`${label}.summary`, project.summary)
    checkBilingual(`${label}.description`, project.description)
    checkBilingual(`${label}.category`, project.category, { required: true })
    for (const [i, item] of toArray(project.tags).entries()) {
      checkBilingual(`${label}.tags[${i}]`, item, { required: true })
    }
    for (const [i, item] of toArray(project.highlights).entries()) {
      checkBilingual(`${label}.highlights[${i}]`, item, { required: true })
    }
    for (const [i, item] of toArray(project.platforms ?? project.platform).entries()) {
      // platforms 多为 "PC" / "WebGL" 这类语言无关的专名，允许纯字符串
      if (isTextObject(item)) checkBilingual(`${label}.platforms[${i}]`, item, { required: true })
      else if (!display(item).trim()) errors.push(`${label}.platforms[${i}]：为空`)
    }
    if (project.demo && typeof project.demo === 'object' && project.demo.label) {
      checkBilingual(`${label}.demo.label`, project.demo.label)
    }
    if (project.demo && typeof project.demo === 'object' && project.demo.label && typeof project.demo.label === 'string') {
      warnings.push(`${label}.demo.label：建议写成 { "zh": "…", "en": "…" }，否则两种语言显示同一段文字`)
    }
    for (const [i, item] of toArray(project.links).entries()) {
      checkBilingual(`${label}.links[${i}].label`, item?.label, { required: true })
    }
    for (const [i, item] of toArray(project.gallery).entries()) {
      // 图注是可选字段：留空表示「只显示序号」，因此空值不算问题
      const caption = item && typeof item === 'object' ? item.caption : null
      const captionHasContent = isTextObject(caption) ? Boolean(display(caption).trim()) : Boolean(caption)
      if (captionHasContent) checkBilingual(`${label}.gallery[${i}].caption`, caption)
    }

    if (project.order != null) {
      const order = Number(project.order)
      if (seenOrders.has(order)) warnings.push(`order 重复：${order}（${label} 与第 ${seenOrders.get(order) + 1} 条）`)
      else seenOrders.set(order, index)
    } else {
      warnings.push(`${label}：没有 order，将按数组顺序排在最后`)
    }
    if (!project.description) warnings.push(`${label}：没有 description，详情页介绍区会是空的`)
    if (project.highlights != null && !Array.isArray(project.highlights)) warnings.push(`${label}：highlights 应该是数组`)
    if (project.tags != null && !Array.isArray(project.tags)) warnings.push(`${label}：tags 应该是数组`)
    if (!project.category) {
      infos.push(`${label}：没有 category，首页分类筛选里只会出现在「全部」下`)
    }
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

  // 首页筛选分类的顺序（可选）：site.categoryOrder
  const categoryOrder = toArray(site?.categoryOrder).map(canonical)
  if (categoryOrder.length) {
    const usedCategories = new Set(projects.map((project) => canonical(project?.category)).filter(Boolean))
    for (const category of usedCategories) {
      if (!categoryOrder.includes(category)) infos.push(`分类「${category}」没写进 site.categoryOrder，会排在筛选栏最后`)
    }
    for (const category of categoryOrder) {
      if (!usedCategories.has(category)) infos.push(`site.categoryOrder 里的「${category}」目前没有作品使用，筛选栏不会显示它`)
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

  // 社交分享图（index.html 里的 og:image / twitter:image）不算「未被引用」。
  // 这些图由 HTML 引用而非 projects.json，所以要从 index.html 里单独收集。
  const htmlImageRefs = await collectHtmlImageRefs()
  for (const relative of htmlImageRefs) {
    referenced.add(relative)
    if (!(await fileExists(path.join(PUBLIC_DIR, relative)))) {
      errors.push(`index.html 的分享图不存在 → public/${relative}`)
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
