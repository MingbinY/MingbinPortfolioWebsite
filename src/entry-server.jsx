/**
 * 构建期预渲染入口（SSG）。
 *
 * 只做一件事：把首页渲染成静态 HTML 字符串，交给 scripts/prerender.mjs 注入
 * docs/index.html 的 #root。这样发布产物里就有真实内容，而不是一个空的 <div id="root">。
 *
 * 用 StaticRouter 而不是 HashRouter：Node 里没有 window/history，HashRouter 无法工作。
 * 预渲染的是首页（`/`），深链接（#/project/xxx）没有静态对应路由，由客户端接管。
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { Main } from './App.jsx'
import { normalizePortfolio } from './data/portfolio.js'

export function render({ data, url = '/' }) {
  const initialData = normalizePortfolio(data)
  return renderToString(
    <Main
      Router={StaticRouter}
      routerProps={{ location: url }}
      initialData={initialData}
    />,
  )
}
