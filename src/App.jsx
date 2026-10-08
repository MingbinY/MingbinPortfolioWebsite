import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PortfolioProvider, usePortfolioData } from './data/PortfolioContext.jsx'
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
  useEffect(() => {
    const name = [site.nameZh, site.title].filter(Boolean).join(' · ')
    document.title = name ? `${name} · ${site.tagline || 'Portfolio'}` : 'Game Portfolio'
  }, [site.nameZh, site.title, site.tagline])
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
