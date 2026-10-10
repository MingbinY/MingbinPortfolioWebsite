import { useI18n } from '../i18n/i18n.jsx'

export function LoadingPanel({ label }) {
  const { t } = useI18n()
  return (
    <div className="feedback feedback--loading" role="status">
      <span className="feedback__spinner" aria-hidden="true" />
      <p>{label || t('feedback.loadingProjects')}</p>
    </div>
  )
}

export function ErrorPanel({ error, onRetry }) {
  const { t } = useI18n()
  // 数据层抛的是 PortfolioError（带 code + vars），据此输出当前语言的提示；
  // 其它未知错误才退回原始 message。
  const detail = error?.code
    ? t(`error.${error.code}`, error.vars || {})
    : String(error?.message || error)
  return (
    <div className="feedback feedback--error" role="alert">
      <h3>{t('feedback.errorTitle')}</h3>
      <pre>{detail}</pre>
      <ul>
        <li>
          {t('feedback.errorFile')}
          <code>public/data/projects.json</code>
        </li>
        <li>{t('feedback.errorDev', { cmd: 'npm run dev' })}</li>
        <li>{t('feedback.errorJson')}</li>
      </ul>
      {onRetry ? (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          {t('feedback.retry')}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyPanel({ title, hint }) {
  const { t } = useI18n()
  return (
    <div className="feedback feedback--empty">
      <h3>{title || t('feedback.emptyTitle')}</h3>
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
