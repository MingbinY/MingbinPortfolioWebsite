import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePortfolioData } from '../data/PortfolioContext.jsx'
import { useI18n } from '../i18n/i18n.jsx'

export default function Header() {
  const { site } = usePortfolioData()
  const { t, tf, lang, setLang } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.state])

  const handleNav = (event, item) => {
    if (!item.scrollTo) return
    event.preventDefault()
    const jump = () => document.getElementById(item.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (location.pathname === item.to) {
      jump()
    } else {
      navigate(item.to, { state: { scrollTo: item.scrollTo } })
    }
    setOpen(false)
  }

  const isActive = (item) => {
    // 「作品」这一项指向首页的 #projects 区块；在作品详情页也应保持高亮
    if (item.to === '/') return item.scrollTo ? location.pathname.startsWith('/project') : location.pathname === '/'
    return location.pathname.startsWith(item.to)
  }

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link className="brand" to="/" aria-label={t('site.brandHome')}>
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__text">
            <strong>{site.title}</strong>
            <small>{[tf(site.nameZh), tf(site.tagline)].filter(Boolean).join(' · ')}</small>
          </span>
        </Link>

        <div className="site-header__actions">
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            aria-label={t('nav.langSwitchAria')}
            title={t('nav.langSwitchAria')}
          >
            {t('nav.langSwitchTo')}
          </button>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? t('nav.close') : t('nav.open')}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
            <span className="sr-only">{open ? t('nav.close') : t('nav.open')}</span>
          </button>
        </div>

        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`}>
          {site.nav.map((item) => (
            <Link
              key={`${tf(item.label)}-${item.to}-${item.scrollTo || ''}`}
              to={item.to}
              className={`site-nav__link${isActive(item) ? ' is-active' : ''}`}
              onClick={(event) => handleNav(event, item)}
            >
              {tf(item.label)}
            </Link>
          ))}
          {site.contact?.email ? (
            <a className="site-nav__cta" href={`mailto:${site.contact.email}`}>
              {t('nav.contact')}
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
