import React, { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PortfolioProvider, usePortfolioData } from './data/PortfolioContext.jsx'
import { LanguageProvider, useI18n } from './i18n/i18n.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import ProjectPage from './pages/ProjectPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

/** 路由切换时回到顶部；带 state.scrollTo 时滚到对应区块（首页「作品」导航用） */
function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    const target = location.state?.scrollTo
    if (target) {
      const node = document.getElementById(target)
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname, location.state])

  return null
}

function SiteTitle() {
  const { site } = usePortfolioData()
  const { t } = useI18n()
  useEffect(() => {
    // 用界面词典里的固定标题，保证切语言时 <title> 立刻跟着变
    document.title = t('site.title') || site.title
  }, [t, site.title])
  return null
}

function Shell() {
  return (
    <div className="app-shell">
      <ScrollManager />
      <SiteTitle />
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:slug" element={<ProjectPage />} />
          {/* 「作品」深链：回到首页并定位到作品列表 */}
          <Route path="/projects" element={<Navigate to="/" replace state={{ scrollTo: 'projects' }} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App({ initialData = null }) {
  return (
    <PortfolioProvider initialData={initialData}>
      <Shell />
    </PortfolioProvider>
  )
}

/**
 * 浏览器客户端入口组合。
 *
 * Router 做成可注入的，是为了让同一套 UI 既能在浏览器跑 HashRouter，
 * 也能在构建期用 StaticRouter 预渲染成静态 HTML（见 src/entry-server.jsx）。
 * 默认 HashRouter，因此 <Main /> 的默认行为与改造前完全一致。
 *
 * initialData 约定为「已 normalize 的 { site, projects }」，由 Main 直接透传。
 */
export function Main({ Router = HashRouter, routerProps = {}, initialData = null }) {
  return (
    <React.StrictMode>
      <Router {...routerProps}>
        <LanguageProvider>
          <App initialData={initialData} />
        </LanguageProvider>
      </Router>
    </React.StrictMode>
  )
}
