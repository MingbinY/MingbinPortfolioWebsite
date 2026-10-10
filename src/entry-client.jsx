import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Main } from './App.jsx'
import './styles/global.css'
import './styles/pages.css'

// 使用 HashRouter（#/project/xxx）的原因：
// 纯静态部署时，BrowserRouter 需要服务器把所有路径 rewrite 到 index.html（这会依赖后端/托管配置）。
// HashRouter 不需要任何服务端配置，扔到任何静态空间都能直接跑。
//
// 构建期预渲染用的是 StaticRouter（src/entry-server.jsx），产物写进 docs/index.html；
// 运行到这里后 React 在同一个 #root 上接管，路由行为仍由 HashRouter 决定。
ReactDOM.createRoot(document.getElementById('root')).render(<Main Router={HashRouter} />)
