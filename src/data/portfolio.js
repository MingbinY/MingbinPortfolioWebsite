/**
 * 作品数据加载层 —— 纯前端、无后端。
 *
 * 数据源：public/data/projects.json
 *  · 开发时：Vite 把 public/ 目录挂在根路径，fetch('data/projects.json') 直接命中文件
 *  · 构建后：public/ 里的文件被原样拷贝到 dist/，所以线上同样是静态文件
 *  · 改内容 = 改这个 json（不用改任何 .jsx 代码）；只改 json 时，线上重新上传该 json 即可，无需重新打包
 */

export const DATA_FILE = 'data/projects.json'

/** 把相对资源路径（图片等）解析成当前站点下的绝对 URL，兼容部署到子目录 / 任意静态托管 */
export function resolveAsset(path) {
  if (!path) return ''
  const value = String(path).trim()
  if (!value) return ''
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) return value
  const relative = value.replace(/^\.?\//, '')
  // 没有 document（SSR / 单元测试环境）时保留相对路径
  const base = typeof document !== 'undefined' ? document.baseURI : ''
  return base ? new URL(relative, base).href : relative
}

/** 数据文件地址（跟随 index.html 所在目录） */
export function dataUrl() {
  return resolveAsset(DATA_FILE)
}

function toArray(value) {
  if (value == null || value === '') return []
  return Array.isArray(value) ? value.filter((item) => item != null) : [value]
}

function normalizeDemo(demo) {
  if (!demo) return null
  if (typeof demo === 'string') return { label: '查看 Demo', url: demo }
  if (!demo.url) return null
  return { label: demo.label || '查看 Demo', url: demo.url }
}

function normalizeLinks(links) {
  return toArray(links)
    .map((link) => (typeof link === 'string' ? { label: '链接', url: link } : link))
    .filter((link) => link && link.url)
    .map((link) => ({ label: link.label || '链接', url: link.url }))
}

function normalizeGallery(gallery) {
  return toArray(gallery)
    .map((item) =>
      typeof item === 'string' ? { src: item, caption: '' } : { src: item?.src, caption: item?.caption || '' },
    )
    .filter((item) => item.src)
    .map((item) => ({ src: resolveAsset(item.src), caption: item.caption }))
}

const DEFAULT_SITE = {
  title: 'MINGBIN YANG',
  tagline: '游戏作品集 · Game Portfolio',
  intro: '',
  nav: [
    { label: '首页', to: '/' },
    { label: '作品', to: '/', scrollTo: 'projects' },
  ],
  contact: { email: '', links: [] },
  footer: '',
  about: null,
}

export function normalizeSite(raw) {
  const site = { ...DEFAULT_SITE, ...(raw || {}) }
  const nav = toArray(site.nav)
    .filter((item) => item && item.label)
    .map((item) => ({ label: item.label, to: item.to || '/', scrollTo: item.scrollTo || null }))
  return {
    ...site,
    nav: nav.length ? nav : DEFAULT_SITE.nav,
    contact: { ...DEFAULT_SITE.contact, ...(site.contact || {}) },
    // 首页「关于我」区块（可选）：没有 about 字段就不渲染
    about: site.about
      ? {
          title: site.about.title || '关于我',
          portrait: resolveAsset(site.about.portrait),
          summary: site.about.summary || '',
          education: toArray(site.about.education).map(String),
          skills: toArray(site.about.skills)
            .filter((item) => item && (item.label || item.value))
            .map((item) => ({ label: item.label || '', value: item.value || '' })),
          nextWork: site.about.nextWork || '',
        }
      : null,
  }
}

export function normalizeProject(raw, index) {
  const slug = String(raw?.slug || '').trim() || `project-${index + 1}`
  return {
    slug,
    title: raw?.title || '未命名作品',
    subtitle: raw?.subtitle || '',
    year: raw?.year != null ? String(raw.year) : '',
    role: raw?.role || '',
    platforms: toArray(raw?.platforms ?? raw?.platform).map(String),
    category: raw?.category ? String(raw.category) : '',
    tags: toArray(raw?.tags).map(String),
    tools: toArray(raw?.tools).map(String),
    accent: raw?.accent || '',
    cover: resolveAsset(raw?.cover),
    summary: raw?.summary || '',
    description: raw?.description || '',
    highlights: toArray(raw?.highlights).map(String),
    gallery: normalizeGallery(raw?.gallery),
    demo: normalizeDemo(raw?.demo),
    links: normalizeLinks(raw?.links),
    featured: Boolean(raw?.featured),
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : index + 1,
    raw,
  }
}

export function normalizePortfolio(json) {
  const list = Array.isArray(json) ? json : toArray(json?.projects)
  const projects = list
    .map((item, index) => normalizeProject(item, index))
    .sort((a, b) => a.order - b.order)
  return { site: normalizeSite(Array.isArray(json) ? null : json?.site), projects }
}

async function fetchPortfolio() {
  const url = dataUrl()
  let response
  try {
    response = await fetch(url, { cache: 'no-cache' })
  } catch (cause) {
    throw new Error(
      `无法读取作品数据文件：${url}\n` +
        '请确认 public/data/projects.json 存在，并且是通过 http(s) 打开页面（直接双击 dist/index.html 用 file:// 打开时，浏览器会禁止 fetch 本地文件）。',
      { cause },
    )
  }
  if (!response.ok) {
    throw new Error(`读取作品数据失败：HTTP ${response.status}（${url}）`)
  }
  let json
  try {
    json = await response.json()
  } catch (cause) {
    throw new Error(`作品数据 JSON 解析失败，请检查 public/data/projects.json 的语法（多余逗号 / 引号未闭合等）。`, {
      cause,
    })
  }
  return normalizePortfolio(json)
}

let pending = null

/** 全局只加载一次；失败后可重试 */
export function loadPortfolio({ force = false } = {}) {
  if (force) pending = null
  if (!pending) {
    pending = fetchPortfolio().catch((error) => {
      pending = null
      throw error
    })
  }
  return pending
}

export function splitParagraphs(text) {
  return String(text || '')
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
