import { Link, useParams } from 'react-router-dom'
import { usePortfolioData, useProject } from '../data/PortfolioContext.jsx'
import { splitParagraphs } from '../data/portfolio.js'
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

  if (status === 'loading') {
    return (
      <div className="page-narrow">
        <LoadingPanel label="正在打开作品…" />
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
        <h1 className="page-title">找不到这个作品</h1>
        <p className="page-text">
          链接里的 <code>{slug}</code> 在 projects.json 里没有对应条目（slug 拼写是否一致？）。
        </p>
        <Link className="btn btn--primary" to="/" state={{ scrollTo: 'projects' }}>
          返回作品列表
        </Link>
      </div>
    )
  }

  const paragraphs = splitParagraphs(project.description)
  const index2 = String(index + 1).padStart(2, '0')

  return (
    <article className="project-page" style={project.accent ? { '--card-accent': project.accent } : undefined}>
      <div className="project-page__topbar">
        <Link className="back-link" to="/" state={{ scrollTo: 'projects' }}>
          ← 返回作品列表
        </Link>
        <span className="project-page__crumb">
          作品 {index2} / 共 {String(projects.length).padStart(2, '0')}
        </span>
      </div>

      {/* 模块一：图片 —— 横向滚动多图 */}
      <Gallery images={project.gallery} title={project.title} />

      {/* 模块二：作品名 */}
      <header className="project-head" id="project-title">
        <p className="project-head__eyebrow">
          {project.year ? <span>{project.year}</span> : null}
          {project.role ? <span>{project.role}</span> : null}
        </p>
        <h1>{project.title}</h1>
        {project.subtitle ? <p className="project-head__subtitle">{project.subtitle}</p> : null}
        {project.tags.length ? (
          <ul className="tag-list tag-list--lg">
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="project-body">
        {/* 模块三：作品介绍 */}
        <section className="project-section" id="project-about">
          <h2 className="project-section__title">
            <span>03</span>作品介绍
          </h2>
          <div className="project-description">
            {paragraphs.length ? (
              paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)
            ) : (
              <p className="project-description__empty">这个作品还没有填写介绍，去 projects.json 里补上 description 吧。</p>
            )}

            {project.highlights.length ? (
              <ul className="highlight-list">
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <aside className="project-aside">
          <div className="info-card">
            <h3>作品信息</h3>
            <MetaRow label="年份" values={[project.year]} />
            <MetaRow label="担任角色" values={[project.role]} />
            <MetaRow label="平台" values={project.platforms} />
            <MetaRow label="工具 / 技术" values={project.tools} />
            <MetaRow label="标签" values={project.tags} />
            {project.links.length ? (
              <div className="meta-row">
                <span className="meta-row__label">相关链接</span>
                <span className="meta-row__value">
                  {project.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
                      {link.label}
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
          <span>04</span>Demo 链接
        </h2>
        {project.demo ? (
          <div className="demo-card">
            <div>
              <h3>上手试玩 / 观看演示</h3>
              <p>点击右侧按钮打开 Demo（外部链接，新标签页打开）。</p>
            </div>
            <a className="btn btn--primary btn--lg" href={project.demo.url} target="_blank" rel="noreferrer noopener">
              {project.demo.label} ↗
            </a>
          </div>
        ) : (
          <div className="demo-card demo-card--empty">
            <div>
              <h3>Demo 暂未公开</h3>
              <p>想了解这个项目的可玩版本？直接邮件联系我即可。</p>
            </div>
          </div>
        )}
      </section>

      {prev || next ? (
        <nav className="project-nav" aria-label="作品切换">
          {prev ? (
            <Link className="project-nav__item" to={`/project/${prev.slug}`}>
              <span>← 上一个作品</span>
              <strong>{prev.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="project-nav__item project-nav__item--next" to={`/project/${next.slug}`}>
              <span>下一个作品 →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </article>
  )
}
