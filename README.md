# MingbinPortfolio · 游戏作品集（纯前端 · JSON 驱动）

一个无后端的 React 作品集网站，风格参考 <https://mingbinyang.wixsite.com/portfolio>。

- **首页**：Header 导航 + 作品列表（封面图 / 作品名 / 一句话简介 / 标签，点击进入详情）
- **作品页**：图片（横向滚动多图 + 点击放大）→ 作品名 → 作品介绍 → Demo 链接
- **内容全部放在一个 JSON 文件里**：`public/data/projects.json`。新增作品、改文案、换图都不需要改代码。

---

## 1. 技术栈

| 项 | 说明 |
| --- | --- |
| 框架 | React 19 + Vite |
| 路由 | `react-router-dom`，使用 **HashRouter**（`#/project/xxx`） |
| 数据 | 运行时 `fetch` 静态 JSON，无接口、无数据库、无后端 |
| 样式 | 原生 CSS（`src/styles/global.css`、`src/styles/pages.css`），深色主题 + CSS 变量 |
| 图片 | `public/images/**` 下的静态文件（含自动生成的占位 SVG） |

### 为什么用 HashRouter / 相对路径

`base: './'` + HashRouter 意味着构建产物 `dist/` 可以直接丢到任意静态托管（GitHub Pages 子目录、Netlify、Vercel、对象存储、Nginx、内网共享目录），**不需要任何服务端 rewrite 规则**。

---

## 2. 快速开始

```bash
cd MingbinPortfolio
npm install          # 首次安装依赖
npm run dev          # 开发预览 http://localhost:5173
npm run build        # 打包到 dist/
npm run preview      # 本地预览打包结果
npm run check        # 内容自检：JSON 语法 / 必填字段 / 图片是否存在 / slug 是否重复
```

> 注意：本机若遇到 `npm` 脚本被禁用，可改用 `npm.cmd install`（PowerShell 执行策略限制）。
> 开发时若 npm 缓存目录没有写权限，可加 `--cache <工作区内的目录>`。

---

## 3. 「不用后端也能改内容」是怎么做到的

可以，**完全不需要后端**。这个需求本质上只是「内容与代码分离」，纯静态站点有三种常规做法，本项目用的是最省事的一种：

| 做法 | 改内容的操作 | 是否需要重新打包 | 是否需要后端 |
| --- | --- | --- | --- |
| ✅ **本项目**：JSON 放 `public/data/`，页面 `fetch` 加载 | 直接改 `public/data/projects.json` | 不需要（线上替换该 json 文件 + 刷新即可） | 不需要 |
| 把 JSON `import` 进源码打包 | 改 JSON 后重新 `npm run build` | 需要 | 不需要 |
| 接 Headless CMS / 数据库 | 在后台界面点点点 | 不需要 | **需要**（或第三方服务） |

所以：

- **想让内容更好维护** → 当前方案已满足，改 JSON 就行；
- **想要「浏览器里可视化编辑 + 保存立即生效」**（像 Wix 那样拖拽、上传图片） → 那才需要后端或第三方服务（例如 Strapi / Directus 自建后端，或 Supabase / Contentful / GitHub-CMS 这类托管服务）。除此之外没有必须依赖后端的地方。

两个纯前端方案的小限制（都很好绕开）：

1. 页面必须通过 `http(s)` 打开。直接双击 `dist/index.html` 用 `file://` 打开时，浏览器会禁止 `fetch` 本地文件（会显示错误面板并给出提示）。用 `npm run dev`、`npm run preview` 或任意静态服务器打开即可。
2. 图片和 JSON 都是静态文件，内容更新后访问者需要刷新页面（或在服务器/CDN 上设置较短的缓存时间）。

---

## 4. 目录结构

```
MingbinPortfolio/
├─ index.html
├─ vite.config.js
├─ package.json
├─ public/
│  ├─ data/projects.json        ← ★ 唯一的内容源（改这里）
│  └─ images/
│     ├─ covers/<slug>.svg      ← 列表页封面图
│     └─ projects/<slug>/01.svg ← 详情页横向滚动图
├─ scripts/
│  ├─ add-project.mjs           ← npm run new:project 新增作品向导
│  ├─ check-content.mjs         ← npm run check 内容自检（JSON / 字段 / 图片）
│  └─ gen-placeholders.mjs      ← npm run gen:art 生成占位图
└─ src/
   ├─ main.jsx                  ← 入口（HashRouter）
   ├─ App.jsx                   ← 路由表 / 滚动管理 / 站点标题
   ├─ data/
   │  ├─ portfolio.js           ← 读取 + 校验 + 归一化 JSON（含资源路径解析）
   │  └─ PortfolioContext.jsx   ← 全站只请求一次，Context 分发 + 重试
   ├─ components/
   │  ├─ Header.jsx             ← 顶部导航（滚动毛玻璃 / 移动端菜单）
   │  ├─ Footer.jsx
   │  ├─ ProjectCard.jsx        ← 作品卡片：封面 + 作品名 + 简介
   │  ├─ ProjectList.jsx        ← 作品列表 + 标签筛选
   │  ├─ Gallery.jsx            ← 详情页模块一：横向滚动多图 + 灯箱
   │  └─ Feedback.jsx           ← 加载 / 报错 / 空状态 / 骨架屏
   ├─ pages/
   │  ├─ HomePage.jsx           ← 首页：Hero + 作品列表
   │  ├─ ProjectPage.jsx        ← 作品页：图片 / 作品名 / 介绍 / Demo
   │  └─ NotFoundPage.jsx
   └─ styles/
      ├─ global.css             ← 设计变量、基础样式、卡片、画廊、灯箱
      └─ pages.css              ← 首页与作品页布局
```

---

## 5. 怎么加作品 / 改内容

### 方式 A：直接改 JSON（推荐给「就加一个作品」）

打开 `public/data/projects.json`，复制 `projects` 数组里任意一段，改字段即可。**唯一必须唯一的是 `slug`**（它决定网址 `#/project/<slug>`）。

### 方式 B：向导脚本

```bash
npm run new:project
```

按提示逐项填写（作品名、slug、年份、标签、简介、介绍……），脚本会自动：

1. 把新作品追加到 `projects.json`（原文件备份为 `projects.json.bak`）；
2. 生成一套占位图（封面 + N 张展示图）。

### 字段说明

顶层：

```jsonc
{
  "site": {
    "title": "MINGBIN YANG",              // 站点名（Header / Footer / 首页大标题）
    "tagline": "游戏设计与开发",           // 副标题
    "intro": "首页 Hero 里的自我介绍段落",
    "nav": [                              // Header 导航项
      { "label": "首页", "to": "/" },
      { "label": "作品", "to": "/", "scrollTo": "projects" }  // scrollTo = 跳到首页某个区块 id
    ],
    "contact": { "email": "hello@example.com", "links": [{ "label": "itch.io", "url": "https://…" }] },
    "footer": "页脚一句话"
  },
  "projects": [ /* 见下表 */ ]
}
```

单个作品：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `slug` | ✅ | 作品唯一标识，网址 `#/project/<slug>` |
| `title` | ✅ | 作品名（列表 + 详情页大标题） |
| `subtitle` | | 副标题（类型 / 技术栈） |
| `year` | | 年份，列表卡片右上角显示 |
| `role` | | 担任角色 |
| `platforms` | | 平台数组，如 `["PC", "PS5"]` |
| `tools` | | 工具 / 技术数组 |
| `tags` | | 标签数组，同时用于首页筛选与详情页标签 |
| `accent` | | 主题色（如 `#ff5c39`），影响卡片悬停、序号、Demo 卡片配色 |
| `cover` | ✅ | 列表页封面图路径 |
| `summary` | | 列表页一句话简介 |
| `description` | | 详情页作品介绍，**用空行分段**（多段落用 `\n\n`） |
| `highlights` | | 亮点/成果数组，详情页显示为要点列表 |
| `gallery` | | 详情页横向滚动的图片数组：`[{ "src": "images/…", "caption": "图注" }]`，也可直接写字符串路径 |
| `demo` | | `{ "label": "试玩 Demo", "url": "https://…" }`；留 `null` 则详情页显示「Demo 暂未公开」 |
| `links` | | 其他相关链接：`[{ "label": "设计拆解", "url": "https://…" }]` |
| `featured` | | `true` 时封面右上角显示「精选」 |
| `order` | | 排序，数字越小越靠前 |

图片路径规则：**相对于站点根目录**，例如 `images/covers/xxx.svg`；也可以直接写完整 `https://` 外链。

### 改完先跑一次自检

```bash
npm run check
```

会检查：JSON 语法、必填字段（`slug` / `title` / `cover`）、`slug` 是否重复或含非法字符、`order` 是否重复、`cover` 与 `gallery` 引用的图片是否真的存在、链接是否像完整网址，并列出「没被任何作品引用的图片」方便清理。有错误时退出码为 1，可以直接接进 CI。

---

## 6. 图片与占位图

```bash
npm run gen:art             # 只补齐缺失的图（不覆盖已有文件）
npm run gen:art -- --force  # 覆盖同名文件
npm run gen:art -- --only=neon-ronin
```

- 占位图是按 `projects.json` 里实际引用的路径生成的，所以「JSON 写什么就生成什么」。
- 换真实截图：**把图片放到同名的路径**即可（例如 `public/images/covers/neon-ronin.svg` → 换成 `neon-ronin.png` 时，把 JSON 里的扩展名一起改掉）。
- 建议格式：封面 16:10 左右、展示图 16:9，宽度 1600–2000px，单张控制在 300KB 以内。

---

## 7. 部署

```bash
npm run build      # 产物在 dist/
```

把 `dist/` 整个目录上传到任意静态托管即可（GitHub Pages / Netlify / Vercel / 对象存储 / Nginx）。
因为用了 HashRouter + 相对路径，**不需要配置 404 重写或子目录 base**。

- 只改文案/换图（不动代码）时：直接替换服务器上的 `dist/data/projects.json` 与 `dist/images/**`，访问者刷新即可看到新内容，无需重新打包。
- 若托管平台对静态资源开了长时间强缓存，把 `data/*.json` 与 `images/*` 的缓存时间调短一点，更新会更及时。

---

## 8. 常见问题

**页面显示「数据加载失败」？**
① 确认 `public/data/projects.json` 存在且 JSON 合法（不能有注释、结尾不能有多余逗号）；② 确认是通过 `http(s)` 打开而不是 `file://`；③ 点错误面板上的「重新加载」。

**详情页 404（找不到作品）？**
链接里的 slug 与 JSON 中的 `slug` 不一致，检查拼写。

**想改成 BrowserRouter 的干净网址？**
把 `src/main.jsx` 里的 `HashRouter` 换成 `BrowserRouter`，并在托管平台配置「所有路径 rewrite 到 index.html」。这属于托管配置，不是后端。

**想加「关于我 / 联系方式」独立页面？**
在 `src/pages/` 新建一个页面组件，在 `src/App.jsx` 里加一条 `<Route>`，再去 JSON 的 `site.nav` 里加一个导航项即可，内容依然可以放在 JSON 里。
