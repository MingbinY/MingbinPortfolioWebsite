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
 * 全站只请求一次 JSON，通过 Context 分发给 Header / 页面 / Footer。
 * status: 'loading' | 'ready' | 'error'
 *
 * initialData：可选。直接给一份已经解析好的 JSON 对象（用于测试 / 预渲染 / 未来接 SSR），
 * 给到时就不会再去 fetch。
 */
export function PortfolioProvider({ children, initialData = null }) {
  const seeded = useMemo(() => {
    if (!initialData) return null
    const { site, projects } = normalizePortfolio(initialData)
    return { status: 'ready', site, projects, error: null }
  }, [initialData])

  const [state, setState] = useState(() => seeded || initialState)

  useEffect(() => {
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
