export function LoadingPanel({ label = '正在加载作品数据…' }) {
  return (
    <div className="feedback feedback--loading" role="status">
      <span className="feedback__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function ErrorPanel({ error, onRetry }) {
  return (
    <div className="feedback feedback--error" role="alert">
      <h3>数据加载失败</h3>
      <pre>{String(error?.message || error)}</pre>
      <ul>
        <li>
          数据文件位置：<code>public/data/projects.json</code>
        </li>
        <li>
          用 <code>npm run dev</code> 启动本地服务访问（不要用 file:// 直接打开 dist/index.html）
        </li>
        <li>JSON 里不要写注释、不要有结尾多余逗号</li>
      </ul>
      {onRetry ? (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          重新加载
        </button>
      ) : null}
    </div>
  )
}

export function EmptyPanel({ title = '还没有作品', hint }) {
  return (
    <div className="feedback feedback--empty">
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="project-card project-card--skeleton" aria-hidden="true">
      <div className="project-card__media" />
      <div className="project-card__body">
        <span className="skeleton-line" style={{ width: '55%' }} />
        <span className="skeleton-line" style={{ width: '85%' }} />
        <span className="skeleton-line" style={{ width: '70%' }} />
      </div>
    </div>
  )
}
