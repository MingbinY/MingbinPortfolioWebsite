import { Link } from 'react-router-dom'

/** 作品列表卡片：封面图 + 作品名 + 简介，点击进入作品详情页 */
export default function ProjectCard({ project, index }) {
  return (
    <Link
      to={`/project/${project.slug}`}
      className="project-card"
      style={project.accent ? { '--card-accent': project.accent } : undefined}
    >
      <div className="project-card__media">
        {project.cover ? (
          <img src={project.cover} alt={`${project.title} 封面`} loading="lazy" />
        ) : (
          <div className="project-card__media-fallback" aria-hidden="true">
            {project.title.slice(0, 1)}
          </div>
        )}
        <span className="project-card__index">{String(index + 1).padStart(2, '0')}</span>
        {project.featured ? <span className="project-card__badge">精选</span> : null}
      </div>

      <div className="project-card__body">
        <div className="project-card__head">
          <h3>{project.title}</h3>
          {project.year ? <span className="project-card__year">{project.year}</span> : null}
        </div>

        {project.subtitle ? <p className="project-card__subtitle">{project.subtitle}</p> : null}
        {project.summary ? <p className="project-card__summary">{project.summary}</p> : null}

        {/* 列表里只显示一个分类标签；没有 category 的作品回落到第一个标签 */}
        {project.category || project.tags[0] ? (
          <ul className="tag-list">
            <li>{project.category || project.tags[0]}</li>
          </ul>
        ) : null}

        <span className="project-card__more">查看作品详情 →</span>
      </div>
    </Link>
  )
}
