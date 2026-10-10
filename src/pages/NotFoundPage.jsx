import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/i18n.jsx'

export default function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="page-narrow page-narrow--center">
      <p className="hero__eyebrow">404</p>
      <h1 className="page-title">{t('notFound.title')}</h1>
      <p className="page-text">{t('notFound.text')}</p>
      <Link className="btn btn--primary" to="/">
        {t('notFound.back')}
      </Link>
    </div>
  )
}
