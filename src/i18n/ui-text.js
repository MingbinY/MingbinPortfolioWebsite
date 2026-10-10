/**
 * 界面文案字典（组件里硬编码的文字都放这里）。
 *
 * 内容类文本（作品介绍、关于我等）不在这里，它们在 public/data/projects.json 里
 * 以 { zh, en } 双语字段存放 —— 那样改文案不用动代码。
 *
 * 这里只放「界面」文字：按钮、标题、提示、错误面板、无障碍标签。
 * 用 t('key') 取；带变量的用 {name} 占位，例如 t('gallery.counter', { total: 5 })。
 */
export const UI_TEXT = {
  // ── 站点 / 导航 ────────────────────────────────
  'site.brandHome': { zh: '杨铭彬作品集首页', en: 'Mingbin Yang portfolio home' },
  'site.title': { zh: '杨铭彬 Mingbin Yang · 游戏作品集', en: 'Mingbin Yang · Game Portfolio' },
  'nav.open': { zh: '打开导航', en: 'Open navigation' },
  'nav.close': { zh: '关闭导航', en: 'Close navigation' },
  'nav.toggleLabel': { zh: '切换语言', en: 'Switch language' },
  // 按钮上显示的是「目标语言」，与常见语言切换器一致
  'nav.langSwitchTo': { zh: 'EN', en: '中' },
  'nav.langSwitchAria': { zh: '切换到英文', en: 'Switch to Chinese' },
  'nav.contact': { zh: '联系我', en: 'Contact me' },

  // ── 首页 Hero ─────────────────────────────────
  'hero.eyebrow': { zh: 'Game Portfolio', en: 'Game Portfolio' },
  'hero.viewWorks': { zh: '查看作品 ↓', en: 'View work ↓' },
  'hero.talkToMe': { zh: '和我聊聊', en: 'Get in touch' },
  'hero.statCount': { zh: '作品数量', en: 'Projects' },
  'hero.statYears': { zh: '年份跨度', en: 'Years active' },

  // ── 首页作品列表 ───────────────────────────────
  'projects.eyebrow': { zh: 'Selected Works', en: 'Selected Works' },
  'projects.title': { zh: '作品列表', en: 'Selected Work' },
  'projects.desc': {
    zh: '点击任意作品，进入详情页查看图片展示、作品介绍与 Demo 链接。',
    en: 'Open any project to see its gallery, write-up and demo link.',
  },
  'projects.count': { zh: '{count} 个作品', en: '{count} projects' },
  'projects.filterLabel': { zh: '按分类筛选作品', en: 'Filter projects by category' },
  'projects.emptyCategory': { zh: '该分类下暂时没有作品。', en: 'No projects in this category yet.' },
  'projects.emptyTitle': { zh: '还没有作品数据', en: 'No project data yet' },
  'projects.emptyHint': {
    zh: '打开 public/data/projects.json，往 projects 数组里加一条作品即可，不用改代码。',
    en: 'Add an entry to the projects array in public/data/projects.json — no code changes needed.',
  },
  'projects.categoryAll': { zh: '全部', en: 'All' },

  // ── 作品卡片 ──────────────────────────────────
  'card.coverAlt': { zh: '{title} 封面', en: '{title} cover' },
  'card.featured': { zh: '精选', en: 'Featured' },
  'card.more': { zh: '查看作品详情 →', en: 'View project →' },

  // ── 作品详情页 ─────────────────────────────────
  'project.back': { zh: '← 返回作品列表', en: '← Back to all work' },
  'project.crumb': { zh: '作品 {index} / 共 {total}', en: 'Project {index} of {total}' },
  'project.notFoundTitle': { zh: '找不到这个作品', en: 'Project not found' },
  'project.notFoundText': {
    zh: '链接里的 {slug} 在 projects.json 里没有对应条目（slug 拼写是否一致？）。',
    en: 'No entry in projects.json matches {slug} — check the slug spelling.',
  },
  'project.section.gallery': { zh: '图片展示', en: 'Gallery' },
  'project.section.about': { zh: '作品介绍', en: 'About this project' },
  'project.section.demo': { zh: 'Demo 链接', en: 'Demo' },
  'project.descriptionEmpty': {
    zh: '这个作品还没有填写介绍，去 projects.json 里补上 description 吧。',
    en: 'No description yet — add a description for this project in projects.json.',
  },
  'project.infoTitle': { zh: '作品信息', en: 'Project details' },
  'project.meta.year': { zh: '年份', en: 'Year' },
  'project.meta.role': { zh: '担任角色', en: 'Role' },
  'project.meta.platforms': { zh: '平台', en: 'Platforms' },
  'project.meta.tools': { zh: '工具 / 技术', en: 'Tools / Tech' },
  'project.meta.tags': { zh: '标签', en: 'Tags' },
  'project.meta.links': { zh: '相关链接', en: 'Links' },
  'project.demoHeading': { zh: '上手试玩 / 观看演示', en: 'Play or watch the demo' },
  'project.demoHint': {
    zh: '点击右侧按钮打开 Demo（外部链接，新标签页打开）。',
    en: 'Use the button to open the demo (external link, opens in a new tab).',
  },
  'project.demoMissingTitle': { zh: 'Demo 暂未公开', en: 'No public demo yet' },
  'project.demoMissingText': {
    zh: '想了解这个项目的可玩版本？直接邮件联系我即可。',
    en: 'Want to see a playable build? Just send me an email.',
  },
  'project.prev': { zh: '← 上一个作品', en: '← Previous project' },
  'project.next': { zh: '下一个作品 →', en: 'Next project →' },
  'project.navLabel': { zh: '作品切换', en: 'Project navigation' },

  // ── 图库 / 灯箱 ────────────────────────────────
  'gallery.regionLabel': { zh: '{title} 展示图', en: '{title} gallery' },
  'gallery.hint': {
    zh: '横向滚动 / 拖拽查看 · 点击放大 · 共 {total} 张',
    en: 'Scroll or drag · click to enlarge · {total} images',
  },
  'gallery.prev': { zh: '上一张', en: 'Previous image' },
  'gallery.next': { zh: '下一张', en: 'Next image' },
  'gallery.close': { zh: '关闭', en: 'Close' },
  'gallery.imageAlt': { zh: '{title} 展示图 {index}', en: '{title} image {index}' },
  'gallery.empty': {
    zh: '这个作品还没有上传展示图。把图片放进 public/images/ 后在 projects.json 的 gallery 里填上路径即可。',
    en: 'No gallery images yet. Put files under public/images/ and list their paths in this project’s gallery array.',
  },
  'gallery.dialogLabel': {
    zh: '{title} 图片查看器（第 {index} / {total} 张）',
    en: '{title} image viewer ({index} of {total})',
  },

  // ── 关于我 ────────────────────────────────────
  'about.eyebrow': { zh: 'About & Contact', en: 'About & Contact' },
  'about.portraitAlt': { zh: '{title} 头像', en: 'Portrait of {name}' },
  'about.education': { zh: '教育经历', en: 'Education' },
  'about.skills': { zh: '技能', en: 'Skills' },
  'about.contact': { zh: '联系我', en: 'Get in touch' },
  'about.contactText': {
    zh: '欢迎就合作、实习与全职机会联系我。',
    en: 'Open to collaboration, internships and full-time opportunities.',
  },

  // ── 页脚 ──────────────────────────────────────
  'footer.rights': { zh: '© {year} {title}', en: '© {year} {title}' },

  // ── 加载 / 错误 / 空状态 ────────────────────────
  'feedback.loadingProjects': { zh: '正在加载作品数据…', en: 'Loading project data…' },
  'feedback.loadingProject': { zh: '正在打开作品…', en: 'Opening project…' },
  'feedback.errorTitle': { zh: '数据加载失败', en: 'Could not load project data' },
  'feedback.errorFile': { zh: '数据文件位置：', en: 'Data file location:' },
  'feedback.errorDev': {
    zh: '用 {cmd} 启动本地服务访问（不要用 file:// 直接打开 dist/index.html）',
    en: 'Serve it locally with {cmd} instead of opening dist/index.html via file://',
  },
  'feedback.errorJson': { zh: 'JSON 里不要写注释、不要有结尾多余逗号', en: 'No comments and no trailing commas in the JSON' },
  // 数据层错误（PortfolioError 的 code → 文案）
  'error.fetchFailed': {
    zh: '无法读取作品数据文件：{url}\n请确认 public/data/projects.json 存在，并且通过 http(s) 打开页面（直接双击 dist/index.html 用 file:// 打开时，浏览器会禁止 fetch 本地文件）。',
    en: 'Could not read the project data file: {url}\nMake sure public/data/projects.json exists and the page is served over http(s) — opening dist/index.html directly via file:// makes the browser block fetch.',
  },
  'error.httpError': { zh: '读取作品数据失败：HTTP {status}（{url}）', en: 'Failed to read project data: HTTP {status} ({url})' },
  'error.parseFailed': {
    zh: '作品数据 JSON 解析失败，请检查 public/data/projects.json 的语法（多余逗号 / 引号未闭合等）。',
    en: 'Could not parse the project data JSON — check the syntax of public/data/projects.json (trailing commas, unclosed quotes).',
  },
  'feedback.retry': { zh: '重新加载', en: 'Reload' },
  'feedback.emptyTitle': { zh: '还没有作品', en: 'No projects yet' },

  // ── 404 ───────────────────────────────────────
  'notFound.title': { zh: '这个页面不存在', en: 'This page does not exist' },
  'notFound.text': {
    zh: '地址可能写错了，或者这个作品已经被移除。',
    en: 'The address may be mistyped, or this project has been removed.',
  },
  'notFound.back': { zh: '回到首页', en: 'Back to home' },
}
