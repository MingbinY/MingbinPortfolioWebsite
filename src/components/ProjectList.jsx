import { useMemo, useState } from 'react'
import ProjectCard from './ProjectCard.jsx'

/** 首页「作品列表」：标签筛选 + 卡片网格 */
export default function ProjectList({ projects }) {
  const [activeTag, setActiveTag] = useState('全部')

  const tags = useMemo(() => {
    const set = new Set()
    projects.forEach((project) => project.tags.forEach((tag) => set.add(tag)))
    return ['全部', ...Array.from(set)]
  }, [projects])

  const visible = useMemo(
    () => (activeTag === '全部' ? projects : projects.filter((project) => project.tags.includes(activeTag))),
    [projects, activeTag],
  )

  return (
    <div className="project-list">
      {tags.length > 2 ? (
        <div className="filter-row" role="group" aria-label="按标签筛选作品">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip${tag === activeTag ? ' is-active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
          <span className="filter-row__count">{visible.length} 个作品</span>
        </div>
      ) : null}

      <div className="project-grid">
        {visible.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>

      {visible.length === 0 ? <p className="filter-row__empty">该标签下暂时没有作品。</p> : null}
    </div>
  )
}
