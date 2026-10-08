import { usePortfolioData } from '../data/PortfolioContext.jsx'

export default function Footer() {
  const { site } = usePortfolioData()
  const links = site.contact?.links || []

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>{site.nameZh ? `${site.title} · ${site.nameZh}` : site.title}</strong>
          <p>{site.footer || site.tagline}</p>
        </div>

        <div className="site-footer__links">
          {site.contact?.email ? <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> : null}
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="site-footer__meta">
        <span>
          © {new Date().getFullYear()} {site.title}
        </span>
      </div>
    </footer>
  )
}
