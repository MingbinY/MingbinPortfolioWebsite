#!/usr/bin/env node
/**
 * 占位图生成器（纯本地脚本，运行一次即可）
 *
 *   npm run gen:art                  # 为 projects.json 里所有缺失的图片生成占位 SVG
 *   npm run gen:art -- --force       # 覆盖已存在的同名图片（慎用：会盖掉你换上的真实截图）
 *   npm run gen:art -- --only=slug   # 只为某个作品生成
 *
 * 它只生成 projects.json 中 cover / gallery 实际引用到的路径，所以「JSON 写什么就生成什么」。
 * 有了真实截图后，直接把图片放到对应路径（同名覆盖）即可，不需要改 JSON。
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = path.join(ROOT, 'public', 'data', 'projects.json')

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** 由字符串得到稳定的伪随机数，保证同一个作品每次生成的图形一致 */
function hash(text) {
  let value = 0
  for (let i = 0; i < String(text).length; i += 1) {
    value = (value * 31 + String(text).charCodeAt(i)) % 100000
  }
  return value
}

function decorations(seed, accent, width, height) {
  const rand = (index, max) => ((seed * (index + 7) * 9301 + 49297) % 233280) / 233280 * max
  const shapes = []
  for (let i = 0; i < 5; i += 1) {
    const x = rand(i, width * 0.85) + width * 0.08
    const y = rand(i + 20, height * 0.7) + height * 0.08
    const size = 80 + rand(i + 40, 220)
    const opacity = (0.05 + rand(i + 60, 0.12)).toFixed(3)
    const rotate = Math.round(rand(i + 80, 360))
    if (i % 3 === 0) {
      shapes.push(
        `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${size.toFixed(0)}" height="${size.toFixed(
          0,
        )}" rx="18" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2" transform="rotate(${rotate} ${x.toFixed(
          0,
        )} ${y.toFixed(0)})"/>`,
      )
    } else {
      shapes.push(
        `<polygon points="${x.toFixed(0)},${(y + size).toFixed(0)} ${(x + size / 2).toFixed(0)},${y.toFixed(
          0,
        )} ${(x + size).toFixed(0)},${(y + size).toFixed(0)}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2"/>`,
      )
    }
  }
  return shapes.join('\n    ')
}

function baseDefs(accent) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0c11"/>
      <stop offset="0.55" stop-color="#101419"/>
      <stop offset="1" stop-color="#0b0e13"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.12" r="0.95">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.92" cy="0.95" r="0.7">
      <stop offset="0" stop-color="#6f7bff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#6f7bff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>`
}

const FONT = "Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif"

function coverSvg({ title, subtitle, accent, year, slug }) {
  const width = 1600
  const height = 1000
  const seed = hash(slug)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(
    title,
  )} 封面占位图">
  ${baseDefs(accent)}
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect width="${width}" height="${height}" fill="url(#glow2)"/>
  <g>
    ${decorations(seed, accent, width, height)}
  </g>
  <text x="1500" y="880" text-anchor="end" font-family="${FONT}" font-size="420" font-weight="800" fill="#ffffff" fill-opacity="0.05">${esc(
    String(year || '').slice(-2) || '00',
  )}</text>
  <text x="110" y="${height - 232}" font-family="${FONT}" font-size="24" letter-spacing="8" fill="${accent}">GAME PROJECT</text>
  <text x="110" y="${height - 140}" font-family="${FONT}" font-size="92" font-weight="800" fill="#f2f5f9">${esc(title)}</text>
  <text x="110" y="${height - 84}" font-family="${FONT}" font-size="30" fill="#98a3b3">${esc(subtitle || '')}</text>
  <g font-family="${FONT}" font-size="20" fill="#ffffff" fill-opacity="0.5">
    <rect x="110" y="110" width="286" height="44" rx="22" fill="#ffffff" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.5"/>
    <text x="136" y="139">占位封面 · 替换为真实截图</text>
  </g>
</svg>
`
}

function gallerySvg({ title, accent, slug, index, total }) {
  const width = 1600
  const height = 900
  const seed = hash(`${slug}-${index}`)
  const shot = String(index).padStart(2, '0')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(
    title,
  )} 展示图 ${shot} 占位图">
  ${baseDefs(accent)}
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g>
    ${decorations(seed, accent, width, height)}
  </g>
  <rect x="70" y="70" width="${width - 140}" height="${height - 140}" rx="28" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
  <rect x="70" y="70" width="${width - 140}" height="64" rx="28" fill="#ffffff" fill-opacity="0.05"/>
  <circle cx="112" cy="102" r="8" fill="${accent}"/>
  <circle cx="140" cy="102" r="8" fill="#ffffff" fill-opacity="0.24"/>
  <circle cx="168" cy="102" r="8" fill="#ffffff" fill-opacity="0.24"/>
  <text x="${width - 112}" y="109" text-anchor="end" font-family="${FONT}" font-size="22" letter-spacing="4" fill="#ffffff" fill-opacity="0.55">SCREENSHOT ${shot} / ${String(
    total,
  ).padStart(2, '0')}</text>
  <text x="140" y="${height / 2 + 6}" font-family="${FONT}" font-size="26" letter-spacing="6" fill="${accent}">${esc(
    title.toUpperCase(),
  )}</text>
  <text x="140" y="${height / 2 + 66}" font-family="${FONT}" font-size="58" font-weight="700" fill="#f2f5f9">展示图 ${
    shot
  } · 占位</text>
  <text x="140" y="${height / 2 + 122}" font-family="${FONT}" font-size="24" fill="#98a3b3">把真实截图放到 public/images/ 下的同名路径即可自动替换</text>
  <g opacity="0.5" font-family="${FONT}" font-size="18" fill="#98a3b3">
    <rect x="140" y="${height - 220}" width="${width - 560}" height="14" rx="7" fill="#ffffff" fill-opacity="0.08"/>
    <rect x="140" y="${height - 190}" width="${width - 700}" height="14" rx="7" fill="#ffffff" fill-opacity="0.06"/>
    <rect x="140" y="${height - 160}" width="${width - 640}" height="14" rx="7" fill="#ffffff" fill-opacity="0.05"/>
  </g>
</svg>
`
}

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function writeSvg({ publicDir, relativePath, content, force, log }) {
  if (!relativePath || /^(https?:)?\/\//i.test(relativePath)) return { skipped: true, reason: '外链' }
  const target = path.join(publicDir, relativePath.replace(/^\.?\//, ''))
  if (!force && (await exists(target))) {
    log(`  跳过（已存在）  ${relativePath}`)
    return { skipped: true, reason: '已存在' }
  }
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content, 'utf8')
  log(`  生成            ${relativePath}`)
  return { skipped: false }
}

/**
 * 为作品列表生成占位图。
 * @param {{ force?: boolean, only?: string|null, silent?: boolean }} options
 */
export async function generatePlaceholders({ force = false, only = null, silent = false, dataFile = DATA_FILE } = {}) {
  const log = silent ? () => {} : (message) => console.log(message)
  const json = JSON.parse(await readFile(dataFile, 'utf8'))
  const projects = Array.isArray(json) ? json : json.projects || []
  // dataFile = <项目根>/public/data/projects.json → 静态资源目录是 <项目根>/public
  const publicDir = path.resolve(path.dirname(dataFile), '..')
  if (path.basename(publicDir) !== 'public') {
    throw new Error(`静态资源目录识别异常：${publicDir}（期望以 public 结尾）`)
  }
  const created = []

  for (const project of projects) {
    const slug = String(project.slug || '').trim()
    if (!slug) continue
    if (only && only !== slug) continue

    // 双语字段是 { zh, en } 对象；占位图上的文字用英文优先（拉丁字母在 SVG 里更稳妥，
    // 且这些图本来就是临时的）。纯字符串字段原样返回。
    const text = (value, fallback = '') => {
      if (value == null) return fallback
      if (typeof value === 'string') return value || fallback
      if (typeof value === 'object') return value.en || value.zh || fallback
      return String(value)
    }

    const title = text(project.title, slug)
    const subtitle = text(project.subtitle)

    log(`· ${title}`)
    const accent = project.accent || '#ff5c39'

    if (project.cover) {
      const result = await writeSvg({
        publicDir,
        relativePath: project.cover,
        content: coverSvg({
          title,
          subtitle,
          accent,
          year: project.year,
          slug,
        }),
        force,
        log,
      })
      if (!result.skipped) created.push(project.cover)
    }

    const gallery = Array.isArray(project.gallery) ? project.gallery : []
    const total = gallery.length
    for (let index = 0; index < total; index += 1) {
      const item = gallery[index]
      const src = typeof item === 'string' ? item : item?.src
      const result = await writeSvg({
        publicDir,
        relativePath: src,
        content: gallerySvg({ title, accent, slug, index: index + 1, total }),
        force,
        log,
      })
      if (!result.skipped) created.push(src)
    }
  }

  log(`\n完成：新生成 ${created.length} 个占位图${force ? '（--force 已开启，同名文件被覆盖）' : '（已存在的文件未改动，需要覆盖请加 --force）'}`)
  return created
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (invokedDirectly) {
  const force = process.argv.includes('--force')
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='))
  const only = onlyArg ? onlyArg.slice('--only='.length) : null
  generatePlaceholders({ force, only }).catch((error) => {
    console.error('生成占位图失败：', error)
    process.exitCode = 1
  })
}
