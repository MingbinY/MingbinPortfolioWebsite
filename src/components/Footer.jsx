import { usePortfolioData } from '../data/PortfolioContext.jsx'
import { useI18n } from '../i18n/i18n.jsx'

export default function Footer() {
  const { site } = usePortfolioData()
  const { t, tf } = useI18n()
  const links = site.contact?.links || []
  const nameZh = tf(site.nameZh)

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>{nameZh ? `${site.title} · ${nameZh}` : site.title}</strong>
          <p>{tf(site.footer) || tf(site.tagline)}</p>
        </div>

        <div className="site-footer__links">
          {site.contact?.email ? <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> : null}
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
              {tf(link.label)}
            </a>
          ))}
        </div>
      </div>
      <div className="site-footer__meta">
        <span>{t('footer.rights', { year: new Date().getFullYear(), title: site.title })}</span>
      </div>
    </footer>
  )
}
