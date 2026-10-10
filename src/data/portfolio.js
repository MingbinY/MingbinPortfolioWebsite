/**
 * 作品数据加载层 —— 纯前端、无后端。
 *
 * 数据源：public/data/projects.json
 *  · 开发时：Vite 把 public/ 目录挂在根路径，fetch('data/projects.json') 直接命中文件
 *  · 构建后：public/ 里的文件被原样拷贝到 dist/，所以线上同样是静态文件
 *  · 改内容 = 改这个 json（不用改任何 .jsx 代码）；只改 json 时，线上重新上传该 json 即可，无需重新打包
 *
 * 双语说明：所有会展示给人看的文本字段统一写成 { zh: '…', en: '…' } 对象；
 * 为兼容旧写法也接受纯字符串（此时两种语言都显示同一份文本）。
 * 本模块**不**决定最终显示哪个语言 —— 那由渲染期的 i18n.tf() 做，
 * 因为语言可以在运行时切换，而归一化只在数据到达时做一次。
 * 语言无关的字段（slug / 年份 / 图片路径 / URL / 主题色 / 排序）保持纯值。
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

/** 取双语字段的「规范值」：优先中文，用它当分类/筛选的稳定 key */
function canonical(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return String(value.zh ?? value.en ?? '')
  return String(value)
}

function normalizeDemo(demo) {
  if (!demo) return null
  if (typeof demo === 'string') return { label: { zh: '查看 Demo', en: 'View demo' }, url: demo }
  if (!demo.url) return null
  return { label: demo.label || { zh: '查看 Demo', en: 'View demo' }, url: demo.url }
}

function normalizeLinks(links) {
  return toArray(links)
    .map((link) => (typeof link === 'string' ? { label: { zh: '链接', en: 'Link' }, url: link } : link))
    .filter((link) => link && link.url)
    .map((link) => ({ label: link.label || { zh: '链接', en: 'Link' }, url: link.url }))
}

function normalizeGallery(gallery) {
  return toArray(gallery)
    .map((item) =>
      typeof item === 'string'
        ? { src: item, caption: '' }
        : { src: item?.src, caption: item?.caption || '' },
    )
    .filter((item) => item.src)
    .map((item) => ({ src: resolveAsset(item.src), caption: item.caption }))
}

const DEFAULT_SITE = {
  title: 'MINGBIN YANG',
  nameZh: '',
  tagline: '游戏作品集 · Game Portfolio',
  intro: '',
  nav: [
    { label: '首页', to: '/' },
    { label: '作品', to: '/', scrollTo: 'projects' },
  ],
  contact: { email: '', links: [] },
  footer: '',
  about: null,
  categoryOrder: [],
}

export function normalizeSite(raw) {
  const site = { ...DEFAULT_SITE, ...(raw || {}) }
  const nav = toArray(site.nav)
    .filter((item) => item && item.label)
    .map((item) => ({ label: item.label, to: item.to || '/', scrollTo: item.scrollTo || null }))
    // 首页「关于我」区块在没有 about 字段时不渲染；此时必须把指向它的导航项一起去掉，
    // 否则点「关于」会静默失效（ScrollManager 找不到元素 → 回落滚到顶部，看起来像死按钮）。
    .filter((item) => item.scrollTo !== 'about' || Boolean(site.about))
  return {
    ...site,
    nav: nav.length ? nav : DEFAULT_SITE.nav,
    categoryOrder: toArray(site.categoryOrder).map((item) => ({
      key: canonical(item),
      label: item,
    })),
    contact: { ...DEFAULT_SITE.contact, ...(site.contact || {}) },
    // 首页「关于我」区块（可选）：没有 about 字段就不渲染
    about: site.about
      ? {
          title: site.about.title || { zh: '关于我', en: 'About me' },
          portrait: resolveAsset(site.about.portrait),
          summary: site.about.summary || '',
          education: toArray(site.about.education).map((item) => ({ id: canonical(item), label: item })),
          skills: toArray(site.about.skills)
            .filter((item) => item && (item.label || item.value))
            .map((item) => ({
              id: canonical(item.label),
              label: item.label || '',
              value: item.value || '',
            })),
          nextWork: site.about.nextWork || '',
        }
      : null,
  }
}

export function normalizeProject(raw, index) {
  const slug = String(raw?.slug || '').trim() || `project-${index + 1}`
  const category = raw?.category
  return {
    slug,
    title: raw?.title || { zh: '未命名作品', en: 'Untitled project' },
    subtitle: raw?.subtitle || '',
    year: raw?.year != null ? String(raw.year) : '',
    role: raw?.role || '',
    platforms: toArray(raw?.platforms ?? raw?.platform).map((item) => ({ id: canonical(item), label: item })),
    // categoryKey 是语言无关的稳定值（取中文），用于筛选与排序；
    // category 保留原始双语值，展示时按当前语言取值。
    categoryKey: canonical(category),
    category,
    tags: toArray(raw?.tags).map((item) => ({ id: canonical(item), label: item })),
    tools: toArray(raw?.tools).map((item) => ({ id: canonical(item), label: item })),
    accent: raw?.accent || '',
    cover: resolveAsset(raw?.cover),
    summary: raw?.summary || '',
    description: raw?.description || '',
    highlights: toArray(raw?.highlights),
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

/**
 * 数据层错误：带一个语言无关的 code 与变量，真正的文案由界面层翻译。
 *
 * 直接把中文写进 Error 的话，英文页面上的错误面板会冒出中文。
 * code / vars 让 ErrorPanel 能用 t() 输出当前语言的提示，同时保留 message 作为兜底。
 */
export class PortfolioError extends Error {
  constructor(code, vars = {}, message) {
    super(message || code)
    this.name = 'PortfolioError'
    this.code = code
    this.vars = vars
  }
}

async function fetchPortfolio() {
  const url = dataUrl()
  let response
  try {
    response = await fetch(url, { cache: 'no-cache' })
  } catch {
    // message 保留中文原文作为兜底（控制台/调试可见）；界面用 code 输出当前语言
    throw new PortfolioError(
      'fetchFailed',
      { url },
      `无法读取作品数据文件：${url}\n` +
        '请确认 public/data/projects.json 存在，并且是通过 http(s) 打开页面（直接双击 dist/index.html 用 file:// 打开时，浏览器会禁止 fetch 本地文件）。',
    )
  }
  if (!response.ok) {
    throw new PortfolioError('httpError', { status: response.status, url }, `读取作品数据失败：HTTP ${response.status}（${url}）`)
  }
  let json
  try {
    json = await response.json()
  } catch {
    throw new PortfolioError(
      'parseFailed',
      {},
      '作品数据 JSON 解析失败，请检查 public/data/projects.json 的语法（多余逗号 / 引号未闭合等）。',
    )
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
