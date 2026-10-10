import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadPortfolio, normalizePortfolio, normalizeSite } from './portfolio.js'

const PortfolioContext = createContext(null)

const initialState = {
  status: 'loading',
  site: normalizeSite(null),
  projects: [],
  error: null,
}

/**
 * 读取构建期预渲染时写进 HTML 的数据（见 scripts/prerender.mjs）。
 *
 * 有它才能让客户端首帧与预渲染 HTML 完全一致：否则客户端从「loading + 空列表」开始渲染，
 * 而 HTML 里是「ready + 5 个作品」，React 会判定 hydration mismatch 并重建整棵树。
 *
 * 开发模式（vite dev）下没有这个节点，返回 null，走正常的 fetch 流程。
 */
const SEED_SCRIPT_ID = 'portfolio-seed-data'

function readPrerenderedSeed() {
  if (typeof document === 'undefined') return null
  const node = document.getElementById(SEED_SCRIPT_ID)
  if (!node) return null
  try {
    const raw = JSON.parse(node.textContent || 'null')
    if (!raw || typeof raw !== 'object') return null
    return normalizePortfolio(raw)
  } catch {
    return null
  }
}

/**
 * 全站只请求一次 JSON，通过 Context 分发给 Header / 页面 / Footer。
 * status: 'loading' | 'ready' | 'error'
 *
 * 数据来源（按优先级）：
 *  1. initialData —— 显式传入的已解析对象（预渲染 / 测试用）
 *  2. HTML 里的预渲染种子 <script id="portfolio-seed-data">
 *  3. fetch public/data/projects.json
 *
 * 注意：命中 1 或 2 时不会再 fetch。也就是说，若在不重新构建的前提下
 * 单独替换线上 projects.json，HTML 里的种子仍是旧数据 —— 改内容后请照常跑 npm run build。
 */
export function PortfolioProvider({ children, initialData = null }) {
  const seeded = useMemo(() => {
    const source = initialData ?? readPrerenderedSeed()
    if (!source) return null
    const { site, projects } = initialData ? normalizePortfolio(source) : source
    return { status: 'ready', site, projects, error: null }
  }, [initialData])

  const [state, setState] = useState(() => seeded || initialState)

  useEffect(() => {
    // 已有预渲染数据：直接采用，不重复请求
    if (seeded) {
      setState(seeded)
      return undefined
    }
    let alive = true
    loadPortfolio()
      .then((data) => {
        if (alive) setState({ status: 'ready', site: data.site, projects: data.projects, error: null })
      })
      .catch((error) => {
        if (alive) setState((prev) => ({ ...prev, status: 'error', error }))
      })
    return () => {
      alive = false
    }
  }, [seeded])

  const retry = () => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    loadPortfolio({ force: true })
      .then((data) => setState({ status: 'ready', site: data.site, projects: data.projects, error: null }))
      .catch((error) => setState((prev) => ({ ...prev, status: 'error', error })))
  }

  const value = useMemo(() => ({ ...state, retry }), [state])
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolioData() {
  const context = useContext(PortfolioContext)
  if (!context) throw new Error('usePortfolioData 必须在 <PortfolioProvider> 内使用')
  return context
}

export function useProject(slug) {
  const { projects } = usePortfolioData()
  return useMemo(() => {
    const index = projects.findIndex((item) => item.slug === slug)
    if (index < 0) return { project: null, index: -1, prev: null, next: null }
    return {
      project: projects[index],
      index,
      prev: index > 0 ? projects[index - 1] : null,
      next: index < projects.length - 1 ? projects[index + 1] : null,
    }
  }, [projects, slug])
}
