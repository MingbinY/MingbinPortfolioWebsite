import { useMemo } from 'react'
import { usePortfolioData } from '../data/PortfolioContext.jsx'
import ProjectList from '../components/ProjectList.jsx'
import { EmptyPanel, ErrorPanel, SkeletonCard } from '../components/Feedback.jsx'

function Hero({ site, projects }) {
  const stats = useMemo(() => {
    const tags = new Set()
    projects.forEach((project) => project.tags.forEach((tag) => tags.add(tag)))
    const years = projects.map((project) => Number(project.year)).filter((year) => Number.isFinite(year) && year > 1900)
    const span =
      years.length === 0
        ? '—'
        : Math.min(...years) === Math.max(...years)
          ? String(Math.min(...years))
          : `${Math.min(...years)} – ${Math.max(...years)}`
    return [
      { label: '作品数量', value: String(projects.length).padStart(2, '0') },
      { label: '涉及领域', value: String(tags.size).padStart(2, '0') },
      { label: '年份跨度', value: span },
    ]
  }, [projects])

  const scrollToProjects = () =>
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__eyebrow">Game Portfolio</p>
        <h1 className="hero__title">
          {(site.title || 'PORTFOLIO').split(' ').map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </h1>
        <p className="hero__tagline">{site.tagline}</p>
        {site.intro ? <p className="hero__intro">{site.intro}</p> : null}

        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={scrollToProjects}>
            查看作品 ↓
          </button>
          {site.contact?.email ? (
            <a className="btn btn--ghost" href={`mailto:${site.contact.email}`}>
              和我聊聊
            </a>
          ) : null}
        </div>

        <dl className="hero__stats">
          {stats.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { status, error, retry, projects, site } = usePortfolioData()

  return (
    <>
      <Hero site={site} projects={projects} />

      <section className="section" id="projects">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">Selected Works</p>
            <h2 className="section__title">作品列表</h2>
          </div>
          <p className="section__desc">
            点击任意作品，进入详情页查看图片展示、作品介绍与 Demo 链接。
          </p>
        </div>

        {status === 'loading' ? (
          <div className="project-grid">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <SkeletonCard key={key} />
            ))}
          </div>
        ) : null}

        {status === 'error' ? <ErrorPanel error={error} onRetry={retry} /> : null}

        {status === 'ready' && projects.length === 0 ? (
          <EmptyPanel
            title="还没有作品数据"
            hint="打开 public/data/projects.json，往 projects 数组里加一条作品即可，不用改代码。"
          />
        ) : null}

        {status === 'ready' && projects.length > 0 ? <ProjectList projects={projects} /> : null}
      </section>
    </>
  )
}
