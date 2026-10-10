import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/i18n.jsx'

/** 作品列表卡片：封面图 + 作品名 + 简介，点击进入作品详情页 */
export default function ProjectCard({ project, index }) {
  const { t, tf } = useI18n()
  const title = tf(project.title)
  const category = tf(project.category) || tf(project.tags[0]?.label)

  return (
    <Link
      to={`/project/${project.slug}`}
      className="project-card"
      style={project.accent ? { '--card-accent': project.accent } : undefined}
    >
      <div className="project-card__media">
        {project.cover ? (
          <img src={project.cover} alt={t('card.coverAlt', { title })} loading="lazy" />
        ) : (
          <div className="project-card__media-fallback" aria-hidden="true">
            {title.slice(0, 1)}
          </div>
        )}
        <span className="project-card__index">{String(index + 1).padStart(2, '0')}</span>
        {project.featured ? <span className="project-card__badge">{t('card.featured')}</span> : null}
      </div>

      <div className="project-card__body">
        <div className="project-card__head">
          <h3>{title}</h3>
          {project.year ? <span className="project-card__year">{project.year}</span> : null}
        </div>

        {tf(project.subtitle) ? <p className="project-card__subtitle">{tf(project.subtitle)}</p> : null}
        {tf(project.summary) ? <p className="project-card__summary">{tf(project.summary)}</p> : null}

        {/* 列表里只显示一个分类标签；没有 category 的作品回落到第一个标签 */}
        {category ? (
          <ul className="tag-list">
            <li>{category}</li>
          </ul>
        ) : null}

        <span className="project-card__more">{t('card.more')}</span>
      </div>
    </Link>
  )
}
