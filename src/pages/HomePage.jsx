import { useMemo } from 'react'
import { usePortfolioData } from '../data/PortfolioContext.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import ProjectList from '../components/ProjectList.jsx'
import { EmptyPanel, ErrorPanel, SkeletonCard } from '../components/Feedback.jsx'

function Hero({ site, projects, ready }) {
  const { t, tf } = useI18n()

  const stats = useMemo(() => {
    const years = projects.map((project) => Number(project.year)).filter((year) => Number.isFinite(year) && year > 1900)
    const span =
      years.length === 0
        ? '—'
        : Math.min(...years) === Math.max(...years)
          ? String(Math.min(...years))
          : `${Math.min(...years)} – ${Math.max(...years)}`
    return [
      { label: t('hero.statCount'), value: String(projects.length).padStart(2, '0') },
      { label: t('hero.statYears'), value: span },
    ]
  }, [projects, t])

  const scrollToProjects = () =>
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const nameZh = tf(site.nameZh)

  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__eyebrow">{t('hero.eyebrow')}</p>
        <h1 className="hero__title">
          {(site.title || 'PORTFOLIO').split(' ').map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </h1>
        {nameZh ? <p className="hero__name-zh">{nameZh}</p> : null}
        <p className="hero__tagline">{tf(site.tagline)}</p>
        {tf(site.intro) ? <p className="hero__intro">{tf(site.intro)}</p> : null}

        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={scrollToProjects}>
            {t('hero.viewWorks')}
          </button>
          {site.contact?.email ? (
            <a className="btn btn--ghost" href={`mailto:${site.contact.email}`}>
              {t('hero.talkToMe')}
            </a>
          ) : null}
          {(site.contact?.links || []).map((link) => (
            <a
              key={link.url}
              className="btn btn--ghost"
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              {tf(link.label)} ↗
            </a>
          ))}
        </div>

        {/* 数据到达前不渲染统计：否则会先显示「00 个作品 / 年份跨度 —」这种确定但错误的数字 */}
        {ready ? (
          <dl className="hero__stats">
            {stats.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  )
}

function AboutSection({ about, contact, siteTitle }) {
  const { t, tf } = useI18n()
  if (!about) return null
  const links = contact?.links || []
  const aboutTitle = tf(about.title)

  return (
    <section className="section about" id="about">
      <div className="section__head">
        <div>
          <p className="section__eyebrow">{t('about.eyebrow')}</p>
          <h2 className="section__title">{aboutTitle}</h2>
        </div>
        {tf(about.nextWork) ? <p className="section__desc">{tf(about.nextWork)}</p> : null}
      </div>

      <div className="about__grid">
        {about.portrait ? (
          <figure className="about__portrait">
            <img
              src={about.portrait}
              alt={t('about.portraitAlt', { title: aboutTitle, name: siteTitle })}
              loading="lazy"
            />
          </figure>
        ) : null}

        <div className="about__body">
          {tf(about.summary) ? <p className="about__summary">{tf(about.summary)}</p> : null}

          {about.education.length ? (
            <div className="about__block">
              <h3>{t('about.education')}</h3>
              <ul className="about__list">
                {about.education.map((item) => (
                  <li key={item.id}>{tf(item.label)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {about.skills.length ? (
            <div className="about__block">
              <h3>{t('about.skills')}</h3>
              <dl className="about__skills">
                {about.skills.map((item) => (
                  <div key={item.id}>
                    <dt>{tf(item.label)}</dt>
                    <dd>{tf(item.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="about__contact">
            <h3>{t('about.contact')}</h3>
            <p className="about__contact-text">{t('about.contactText')}</p>
            <div className="about__contact-links">
              {contact?.email ? (
                <a className="btn btn--primary" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              ) : null}
              {links.map((link) => (
                <a
                  key={link.url}
                  className="btn btn--ghost"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {tf(link.label)} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { status, error, retry, projects, site } = usePortfolioData()
  const { t } = useI18n()

  return (
    <>
      <Hero site={site} projects={projects} ready={status === 'ready'} />

      <section className="section" id="projects">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">{t('projects.eyebrow')}</p>
            <h2 className="section__title">{t('projects.title')}</h2>
          </div>
          <p className="section__desc">{t('projects.desc')}</p>
        </div>

        {status === 'loading' ? (
          <div role="status" aria-busy="true">
            <span className="sr-only">{t('feedback.loadingProjects')}</span>
            <div className="project-grid">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <SkeletonCard key={key} />
              ))}
            </div>
          </div>
        ) : null}

        {status === 'error' ? <ErrorPanel error={error} onRetry={retry} /> : null}

        {status === 'ready' && projects.length === 0 ? (
          <EmptyPanel title={t('projects.emptyTitle')} hint={t('projects.emptyHint')} />
        ) : null}

        {status === 'ready' && projects.length > 0 ? (
          <ProjectList projects={projects} categoryOrder={site.categoryOrder} />
        ) : null}
      </section>

      <AboutSection about={site.about} contact={site.contact} siteTitle={site.title} />
    </>
  )
}
