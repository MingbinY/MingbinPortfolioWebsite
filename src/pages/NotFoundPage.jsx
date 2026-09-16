import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page-narrow page-narrow--center">
      <p className="hero__eyebrow">404</p>
      <h1 className="page-title">这个页面不存在</h1>
      <p className="page-text">地址可能写错了，或者这个作品已经被移除。</p>
      <Link className="btn btn--primary" to="/">
        回到首页
      </Link>
    </div>
  )
}
