import { useMemo, useState } from 'react'
import ProjectCard from './ProjectCard.jsx'

const ALL = '全部'

/**
 * 首页「作品列表」：按分类（category）筛选 + 卡片网格。
 * 分类来自 projects.json 里每个作品的 category 字段，按作品顺序去重生成，
 * 顺序可用 site.categoryOrder 指定（没列到的分类排在后面），因此增删筛选项只改 JSON。
 */
export default function ProjectList({ projects, categoryOrder = [] }) {
  const [active, setActive] = useState(ALL)

  const categories = useMemo(() => {
    const used = new Set()
    projects.forEach((project) => {
      if (project.category) used.add(project.category)
    })
    const ordered = categoryOrder.filter((category) => used.has(category))
    const rest = [...used].filter((category) => !ordered.includes(category))
    return [ALL, ...ordered, ...rest]
  }, [projects, categoryOrder])

  // 当前分类如果被删掉了（改了 JSON），自动回落到「全部」
  const activeCategory = categories.includes(active) ? active : ALL

  const visible = useMemo(
    () => (activeCategory === ALL ? projects : projects.filter((project) => project.category === activeCategory)),
    [projects, activeCategory],
  )

  return (
    <div className="project-list">
      {categories.length > 2 ? (
        <div className="filter-row" role="group" aria-label="按分类筛选作品">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip${category === activeCategory ? ' is-active' : ''}`}
              onClick={() => setActive(category)}
            >
              {category}
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

      {visible.length === 0 ? <p className="filter-row__empty">该分类下暂时没有作品。</p> : null}
    </div>
  )
}
