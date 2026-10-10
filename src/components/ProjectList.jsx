import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/i18n.jsx'
import ProjectCard from './ProjectCard.jsx'

const ALL = '__all__'

/**
 * 首页「作品列表」：按分类（category）筛选 + 卡片网格。
 *
 * 分类来自 projects.json 里每个作品的 category 字段，按作品顺序去重生成，
 * 顺序可用 site.categoryOrder 指定（没列到的分类排在后面），因此增删筛选项只改 JSON。
 *
 * 双语注意：筛选用的是与语言无关的 categoryKey（取中文值），
 * 显示用的才是当前语言的 category.label —— 否则切到英文后筛选会立刻失效。
 * 另外因为它是 useState 里的驻留值，切换语言不会重置当前选中项。
 */
export default function ProjectList({ projects, categoryOrder = [] }) {
  const { t, tf } = useI18n()
  const [active, setActive] = useState(ALL)

  const categories = useMemo(() => {
    const labels = new Map()
    for (const project of projects) {
      if (project.categoryKey) labels.set(project.categoryKey, project.category)
    }
    const ordered = categoryOrder.filter((item) => labels.has(item.key)).map((item) => item.key)
    const rest = [...labels.keys()].filter((key) => !ordered.includes(key))
    return [{ key: ALL, label: null }, ...[...ordered, ...rest].map((key) => ({ key, label: labels.get(key) }))]
  }, [projects, categoryOrder])

  // 当前分类如果被删掉了（改了 JSON），自动回落到「全部」
  const activeKey = categories.some((item) => item.key === active) ? active : ALL

  const visible = useMemo(
    () => (activeKey === ALL ? projects : projects.filter((project) => project.categoryKey === activeKey)),
    [projects, activeKey],
  )

  return (
    <div className="project-list">
      {categories.length > 2 ? (
        <div className="filter-row" role="group" aria-label={t('projects.filterLabel')}>
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`chip${item.key === activeKey ? ' is-active' : ''}`}
              onClick={() => setActive(item.key)}
            >
              {item.key === ALL ? t('projects.categoryAll') : tf(item.label)}
            </button>
          ))}
          <span className="filter-row__count">{t('projects.count', { count: visible.length })}</span>
        </div>
      ) : null}

      <div className="project-grid">
        {visible.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>

      {visible.length === 0 ? <p className="filter-row__empty">{t('projects.emptyCategory')}</p> : null}
    </div>
  )
}
