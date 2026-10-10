import { Link, useParams } from 'react-router-dom'
import { usePortfolioData, useProject } from '../data/PortfolioContext.jsx'
import { splitParagraphs } from '../data/portfolio.js'
import { useI18n } from '../i18n/i18n.jsx'
import Gallery from '../components/Gallery.jsx'
import { ErrorPanel, LoadingPanel } from '../components/Feedback.jsx'

function MetaRow({ label, values }) {
  if (!values || values.length === 0) return null
  return (
    <div className="meta-row">
      <span className="meta-row__label">{label}</span>
      <span className="meta-row__value">{values.join(' · ')}</span>
    </div>
  )
}

export default function ProjectPage() {
  const { slug } = useParams()
  const { status, error, retry, projects } = usePortfolioData()
  const { project, index, prev, next } = useProject(slug)
  const { t, tf } = useI18n()

  if (status === 'loading') {
    return (
      <div className="page-narrow">
        <LoadingPanel label={t('feedback.loadingProject')} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="page-narrow">
        <ErrorPanel error={error} onRetry={retry} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="page-narrow">
        <h1 className="page-title">{t('project.notFoundTitle')}</h1>
        <p className="page-text">{t('project.notFoundText', { slug })}</p>
        <Link className="btn btn--primary" to="/" state={{ scrollTo: 'projects' }}>
          {t('project.back')}
        </Link>
      </div>
    )
  }

  const paragraphs = splitParagraphs(tf(project.description))
  const index2 = String(index + 1).padStart(2, '0')

  return (
    <article className="project-page" style={project.accent ? { '--card-accent': project.accent } : undefined}>
      <div className="project-page__topbar">
        <Link className="back-link" to="/" state={{ scrollTo: 'projects' }}>
          {t('project.back')}
        </Link>
        <span className="project-page__crumb">
          {t('project.crumb', { index: index2, total: String(projects.length).padStart(2, '0') })}
        </span>
      </div>

      {/* 模块一：图片 —— 横向滚动多图 */}
      <Gallery images={project.gallery} title={tf(project.title)} index="01" />

      {/* 模块二：作品名 */}
      <header className="project-head" id="project-title">
        <p className="project-head__eyebrow">
          {project.year ? <span>{project.year}</span> : null}
          {tf(project.role) ? <span>{tf(project.role)}</span> : null}
        </p>
        <h1>{tf(project.title)}</h1>
        {tf(project.subtitle) ? <p className="project-head__subtitle">{tf(project.subtitle)}</p> : null}
        {project.tags.length ? (
          <ul className="tag-list tag-list--lg">
            {project.tags.map((tag) => (
              <li key={tag.id}>{tf(tag.label)}</li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="project-body">
        {/* 模块三：作品介绍 */}
        <section className="project-section" id="project-about">
          <h2 className="project-section__title">
            <span>02</span>
            {t('project.section.about')}
          </h2>
          <div className="project-description">
            {paragraphs.length ? (
              paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
            ) : (
              <p className="project-description__empty">{t('project.descriptionEmpty')}</p>
            )}

            {project.highlights.length ? (
              <ul className="highlight-list">
                {project.highlights.map((item, i) => (
                  <li key={`${i}-${tf(item).slice(0, 12)}`}>{tf(item)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <aside className="project-aside">
          <div className="info-card">
            <h3>{t('project.infoTitle')}</h3>
            <MetaRow label={t('project.meta.year')} values={[project.year]} />
            <MetaRow label={t('project.meta.role')} values={[tf(project.role)]} />
            <MetaRow label={t('project.meta.platforms')} values={project.platforms.map((item) => tf(item.label))} />
            <MetaRow label={t('project.meta.tools')} values={project.tools.map((item) => tf(item.label))} />
            <MetaRow label={t('project.meta.tags')} values={project.tags.map((item) => tf(item.label))} />
            {project.links.length ? (
              <div className="meta-row">
                <span className="meta-row__label">{t('project.meta.links')}</span>
                <span className="meta-row__value">
                  {project.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
                      {tf(link.label)}
                    </a>
                  ))}
                </span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {/* 模块四：Demo 链接 */}
      <section className="project-section project-demo" id="project-demo">
        <h2 className="project-section__title">
          <span>03</span>
          {t('project.section.demo')}
        </h2>
        {project.demo ? (
          <div className="demo-card">
            <div>
              <h3>{t('project.demoHeading')}</h3>
              <p>{t('project.demoHint')}</p>
            </div>
            <a className="btn btn--primary btn--lg" href={project.demo.url} target="_blank" rel="noreferrer noopener">
              {tf(project.demo.label)} ↗
            </a>
          </div>
        ) : (
          <div className="demo-card demo-card--empty">
            <div>
              <h3>{t('project.demoMissingTitle')}</h3>
              <p>{t('project.demoMissingText')}</p>
            </div>
          </div>
        )}
      </section>

      {prev || next ? (
        <nav className="project-nav" aria-label={t('project.navLabel')}>
          {prev ? (
            <Link className="project-nav__item" to={`/project/${prev.slug}`}>
              <span>{t('project.prev')}</span>
              <strong>{tf(prev.title)}</strong>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="project-nav__item project-nav__item--next" to={`/project/${next.slug}`}>
              <span>{t('project.next')}</span>
              <strong>{tf(next.title)}</strong>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </article>
  )
}
