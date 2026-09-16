import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'
import './styles/pages.css'

// 使用 HashRouter（#/project/xxx）的原因：
// 纯静态部署时，BrowserRouter 需要服务器把所有路径 rewrite 到 index.html（这会依赖后端/托管配置）。
// HashRouter 不需要任何服务端配置，扔到任何静态空间都能直接跑。
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
