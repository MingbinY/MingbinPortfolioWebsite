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
| 数据 | `public/data/projects.json` 静态 JSON，无接口、无数据库、无后端。构建时预渲染进 HTML，客户端首帧用它、随后仍是同一个文件 |
| 样式 | 原生 CSS（`src/styles/global.css`、`src/styles/pages.css`），深色主题 + CSS 变量 |
| 图片 | `public/images/**` 下的静态文件（含自动生成的占位 SVG） |
| 渲染 | 构建期预渲染（SSG）：首页渲染成静态 HTML 写进 `docs/index.html`，客户端再 hydration |
| 语言 | 中英双语，右上角按钮切换（`src/i18n/`）。默认中文，跟随浏览器语言，可用 `?lang=en` 分享英文链接 |

### 双语（i18n）怎么工作的

- **界面文案**在 `src/i18n/ui-text.js`，按 key 写 `{ zh, en }`，组件用 `t('key')` 取。
- **内容文案**（作品介绍、关于我等）在 `public/data/projects.json`，每个文本字段本身就是 `{ zh, en }`，组件用 `tf(field)` 取 —— 改文案不用动代码。
- **语言怎么定**（优先级从高到低）：
  1. URL 里的 `?lang=en` / `?lang=zh`（可分享、可前进后退）
  2. `localStorage` 里上次的手动选择（因为 HashRouter 站内跳转会丢 query，只靠 URL 会导致「切英文→点进作品→变回中文」）
  3. 浏览器语言：`zh*` 用中文，其余用英文；都识别不出则中文
- **网址写法**：HashRouter 下参数要写在 `#` **之后** —— `https://mingbinportfolio.com/#/?lang=en`。
  写成 `/?lang=en`（在 `#` 之前）是文档级 query，HashRouter 看不到。
- **为什么不会闪一下中文**：构建期预渲染出来的 HTML 是中文，所以在 `</head>` 前注入了一段极小的**同步**脚本
  （见 `scripts/prerender.mjs`），它在 React 之前就跑完判定：中文浏览器什么都不做，英文浏览器写 localStorage
  并把网址补成 `?lang=en`。这样 React 首次渲染就是正确语言，也就不存在「HTML 中文 / 客户端英文」的 hydration 不一致。
- **改语言什么时候生效**：切换是运行时的，不用重新构建；但**内容**改动（`projects.json`）仍然需要重新构建才能上线。

### 为什么用 HashRouter / 相对路径

`base: './'` + HashRouter 意味着构建产物 `docs/` 可以直接丢到任意静态托管（Cloudflare Pages、Netlify、Vercel、对象存储、Nginx、内网共享目录），**不需要任何服务端 rewrite 规则**。

---

## 2. 快速开始

```bash
cd MingbinPortfolio
npm install          # 首次安装依赖
npm run dev          # 开发预览 http://localhost:5173
npm run build        # 构建到 docs/（= 客户端打包 + SSR 预渲染 + 注入，见第 7 节）
npm run preview      # 本地预览构建结果
npm run check        # 内容自检：JSON 语法 / 必填字段 / 图片是否存在 / slug 是否重复
```

> 注意：本机若遇到 `npm` 脚本被禁用，可改用 `npm.cmd install`（PowerShell 执行策略限制）。
> 开发时若 npm 缓存目录没有写权限，可加 `--cache <工作区内的目录>`。

---

## 3. 「不用后端也能改内容」是怎么做到的

可以，**完全不需要后端**。这个需求本质上只是「内容与代码分离」，纯静态站点有三种常规做法，本项目用的是最省事的一种：

| 做法 | 改内容的操作 | 是否需要重新打包 | 是否需要后端 |
| --- | --- | --- | --- |
| ✅ **本项目**：JSON 放 `public/data/` | 改 `public/data/projects.json` 后提交（平台自动构建） | **需要**（原因见下方提示） | 不需要 |
| 把 JSON `import` 进源码打包 | 改 JSON 后重新 `npm run build` | 需要 | 不需要 |
| 接 Headless CMS / 数据库 | 在后台界面点点点 | 不需要 | **需要**（或第三方服务） |

所以：

- **想让内容更好维护** → 当前方案已满足，改 JSON 就行（不用改任何代码）；
- **想要「浏览器里可视化编辑 + 保存立即生效」**（像 Wix 那样拖拽、上传图片） → 那才需要后端或第三方服务（例如 Strapi / Directus 自建后端，或 Supabase / Contentful / GitHub-CMS 这类托管服务）。除此之外没有必须依赖后端的地方。

> ⚠️ **为什么改 JSON 也要重新构建**：本项目做了**构建期预渲染**——构建时把 `projects.json`
> 渲染进 `docs/index.html`，并把同一份数据以 `<script type="application/json" id="portfolio-seed-data">`
> 内联进去，客户端首帧直接用（这样首屏就有内容，且不会出现 hydration 不一致）。
> 因此**单独替换线上 `data/projects.json` 不会生效**。好在部署在 Cloudflare Pages（连 Git），
> push 后平台会自动构建，本地不用跑构建。

两个纯前端方案的小限制（都很好绕开）：

1. 页面必须通过 `http(s)` 打开。直接双击 `docs/index.html` 用 `file://` 打开时，浏览器会禁止 `fetch` 本地文件（会显示错误面板并给出提示）。用 `npm run dev`、`npm run preview` 或任意静态服务器打开即可。
2. 图片和 JSON 都是静态文件，内容更新后访问者需要刷新页面（或在服务器/CDN 上设置较短的缓存时间）。

---

## 4. 目录结构

```
MingbinPortfolio/
├─ index.html
├─ vite.config.js              ← 客户端构建配置（outDir: docs）
├─ vite.config.ssr.js          ← 预渲染(SSG)专用配置（输出 dist/ssr）
├─ package.json
├─ public/
│  ├─ data/projects.json        ← ★ 唯一的内容源（改这里）
│  └─ images/
│     ├─ covers/<slug>.svg      ← 列表页封面图
│     └─ projects/<slug>/01.svg ← 详情页横向滚动图
├─ scripts/
│  ├─ add-project.mjs           ← npm run new:project 新增作品向导（逐项问中英文）
│  ├─ check-content.mjs         ← npm run check 内容自检（含双语字段是否都填了）
│  ├─ prerender.mjs             ← 注入首页 HTML + 数据种子 + 语言引导脚本
│  └─ gen-placeholders.mjs      ← npm run gen:art 生成占位图
└─ src/
   ├─ entry-client.jsx          ← 浏览器入口（HashRouter + hydration）
   ├─ entry-server.jsx          ← 预渲染入口（StaticRouter + renderToString）
   ├─ App.jsx                   ← 路由表 / 滚动管理 / 站点标题 / Main 组合
   ├─ i18n/
   │  ├─ i18n.jsx               ← 语言状态、检测、t()/tf() 取值
   │  └─ ui-text.js             ← 界面文案词典（{ zh, en }）
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

> ⚠️ **所有给人看的文本都是双语的**，要写成 `{ "zh": "…", "en": "…" }`。
> 只填一种语言不会报错，但另一种语言会回退显示同一段文字（等于没翻译）。
> 改完跑一次 `npm run check`，它会逐个双语字段检查中英文是否都填了。

### 方式 B：向导脚本

```bash
npm run new:project
```

按提示逐项填写。文本类字段会**分别问中文和英文两次**（`作品名 · 中文` / `作品名 · English`），
语言无关的字段（slug、年份、平台、工具、主题色）只问一次。脚本会自动：

1. 把新作品追加到 `projects.json`（原文件备份为 `projects.json.bak`）；
2. 生成一套占位图（封面 + N 张展示图）。

### 字段说明

顶层：

```jsonc
{
  "site": {
    "title": "MINGBIN YANG",              // 站点名（Header 左上角 + 首页大标题 + 页脚），两种语言共用
    "nameZh": { "zh": "杨铭彬", "en": "Mingbin Yang" },  // 姓名（大标题下方、导航小字、页脚；留空则不显示）
    "tagline": { "zh": "游戏开发与创新", "en": "Game Development and Innovation" },
    "intro": { "zh": "首页 Hero 自我介绍…", "en": "Hero intro…" },   // 留空则不显示
    "nav": [                              // Header 导航项
      { "label": { "zh": "首页", "en": "Home" }, "to": "/" },
      { "label": { "zh": "作品", "en": "Work" }, "to": "/", "scrollTo": "projects" },  // scrollTo = 跳到首页某区块 id
      { "label": { "zh": "关于", "en": "About" }, "to": "/", "scrollTo": "about" }
    ],
    // 首页筛选栏的顺序。筛选以「中文值」为稳定 key（en 只是显示用的标签）
    "categoryOrder": [
      { "zh": "第一人称", "en": "First-person" },
      { "zh": "第三人称", "en": "Third-person" }
    ],
    "about": {                            // 首页「关于我」区块，整段删掉就不显示（指向它的导航项也会自动移除）
      "title": { "zh": "关于我", "en": "About me" },
      "portrait": "images/about/portrait.webp",   // 头像（可删）
      "summary": { "zh": "自我介绍", "en": "Bio" },
      "education": [{ "zh": "学校 A —— 学位", "en": "School A — Degree" }],
      "skills": [{ "label": { "zh": "游戏开发", "en": "Game development" },
                   "value": { "zh": "Unity 引擎", "en": "Unity" } }],
      "nextWork": { "zh": "下一部作品…", "en": "Next up…" }   // 可留空字符串
    },
    "contact": {
      "email": "you@example.com",
      "links": [{ "label": { "zh": "LinkedIn", "en": "LinkedIn" }, "url": "https://…" }]
    },
    "footer": { "zh": "页脚一句话", "en": "Footer line" }
  },
  "projects": [ /* 见下表 */ ]
}
```

> `email` 留空时，Header 的「联系我」按钮、Hero 的「和我聊聊」按钮都会自动隐藏；`links` 会显示在首页「关于我」区块与页脚。

单个作品：

| 字段 | 必填 | 双语 | 说明 |
| --- | --- | --- | --- |
| `slug` | ✅ | — | 作品唯一标识，网址 `#/project/<slug>` |
| `title` | ✅ | ✅ | 作品名（列表 + 详情页大标题） |
| `subtitle` | | ✅ | 副标题（类型 / 技术栈） |
| `year` | | — | 年份，列表卡片右上角显示 |
| `role` | | ✅ | 担任角色 |
| `platforms` | | — | 平台数组，如 `["PC", "PS5"]`（专名，两种语言共用） |
| `tools` | | — | 工具 / 技术数组 |
| `category` | | 首页筛选分类（如 `第一人称` / `第三人称` / `2D`）。首页筛选栏就是按它自动生成的：改 JSON 就改筛选项；留空则该作品只出现在「全部」里，卡片上回落显示第一个 `tags` |
| `tags` | | 标签数组，详情页展示（列表卡片只显示 `category` 一个标签） |
| `accent` | | 主题色（如 `#ff5c39`），影响卡片悬停、序号、Demo 卡片配色 |
| `cover` | ✅ | 列表页封面图路径 |
| `summary` | | 列表页一句话简介 |
| `description` | | 详情页作品介绍，**用空行分段**（多段落用 `\n\n`） |
| `highlights` | | ✅ | 亮点/成果数组，详情页显示为要点列表 |
| `gallery` | | caption ✅ | 详情页横向滚动的图片数组：`[{ "src": "images/…", "caption": { "zh": "图注", "en": "Caption" } }]`（`caption` 可留空串） |
| `demo` | | label ✅ | `{ "label": { "zh": "试玩 Demo", "en": "Play demo" }, "url": "https://…" }`；留 `null` 则详情页显示「Demo 暂未公开」 |
| `links` | | ✅ | 其他相关链接：`[{ "label": { "zh": "设计拆解", "en": "Design breakdown" }, "url": "https://…" }]` |
| `featured` | | — | `true` 时封面右上角显示「精选」 |
| `order` | | — | 排序，数字越小越靠前 |

图片路径规则：**相对于站点根目录**，例如 `images/covers/xxx.svg`；也可以直接写完整 `https://` 外链。

### 首页文案改哪里（对照表）

**绝大多数文字都在 `public/data/projects.json`**（每个字段都是 `{ zh, en }`）：

| 首页位置 | JSON 字段 |
| --- | --- |
| 顶部导航文字与顺序 | `site.nav[].label` |
| Header 站点名 + 小字副标题 | `site.title`（共用）/ `site.nameZh` / `site.tagline` |
| Hero 大标题 | `site.title`（按空格拆成多行显示） |
| Hero 副标题 | `site.tagline` |
| Hero 自我介绍段落（留空则不显示） | `site.intro` |
| Hero 右侧按钮（itch.io / LinkedIn…） | `site.contact.links[]` |
| 浏览器标签页标题 | `src/i18n/ui-text.js` 的 `site.title`（切换语言时立即更新） |
| 「关于我」标题 / 头像 / 简介 / 教育经历 / 技能 / 下一部作品 | `site.about.title` / `.portrait` / `.summary` / `.education[]` / `.skills[]` / `.nextWork` |
| 作品卡片：作品名 / 副标题 / 年份 / 简介 / 分类标签 | 每个作品的 `title` / `subtitle` / `year` / `summary` / `category` |
| 筛选栏有哪些项、文本是什么 | 各作品的 `category`（顺序由 `site.categoryOrder` 决定） |
| 页脚标语与链接 | `site.footer` / `site.contact.email` / `site.contact.links[]` |

**界面固定字样**（按钮、提示、无障碍标签）全部集中在 `src/i18n/ui-text.js`，按 key 写 `{ zh, en }`：

| 位置 | key 前缀 |
| --- | --- |
| 导航、语言切换按钮、站点标题 | `site.*` / `nav.*` |
| 首页 Hero（小标、按钮、统计项名） | `hero.*` |
| 作品列表区块（标题、说明、筛选、空态） | `projects.*` |
| 作品卡片（精选徽标、查看详情、封面 alt） | `card.*` |
| 作品详情页（返回、面包屑、章节标题、信息卡、Demo） | `project.*` |
| 图库与灯箱（提示、上一张/下一张、关闭、对话框名称） | `gallery.*` |
| 「关于我」区块（小标、教育经历、技能、联系我） | `about.*` |
| 页脚、加载/错误/空状态、404 | `footer.*` / `feedback.*` / `notFound.*` |

> 新增界面文字时**不要**直接在 `.jsx` 里写中文字符串，去 `ui-text.js` 加一条 `{ zh, en }`，
> 然后组件里用 `t('your.key')`。

改 `.jsx` 里的文字在 `npm run dev` 下同样即时生效（热更新）；线上则需要重新 `npm run build` 后再上传。若希望这些界面字样也统一搬进 JSON（例如放到 `site.ui`），说一声即可。

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
npm run gen:art -- --only=xxx
```

- 占位图是按 `projects.json` 里实际引用的路径生成的，所以「JSON 写什么就生成什么」。
- 换真实截图：**把图片放到同名的路径**即可（例如 `public/images/covers/xxx.svg` → 换成 `xxx.webp` 时，把 JSON 里的扩展名一起改掉）。
- 现有图片来自原 Wix 作品集：封面在 `public/images/covers/<slug>.webp`，详情图在 `public/images/projects/<slug>/01.webp`…
- 建议格式：封面 16:10 左右、展示图 16:9，宽度 1600–2000px，单张控制在 300–500KB（WebP 体积更小，浏览器都支持）。

---

## 7. 部署

```bash
npm run build      # 产物输出到 docs/（vite.config.js 里 build.outDir 指定）
```

`docs/` 是**纯静态产物**，可以直接上传到任意静态托管（GitHub Pages / Netlify / Vercel / 对象存储 / Nginx）。
因为用了 HashRouter + 相对路径（`base: './'`），**不需要配置 404 重写，也不受子目录影响**。

### Cloudflare Pages（推荐，填写项最少）

在 Cloudflare 控制台 **Workers & Pages → Create → Pages → Connect to Git** 选中本仓库后，
「Set up your application」一屏这样填：

| 字段 | 填什么 | 说明 |
| --- | --- | --- |
| Project name | 例如 `mingbin-portfolio` | 决定默认域名 `https://<名字>.pages.dev` |
| Production branch | `main` | |
| Framework preset | **React (Vite)**（或 Vite） | 预设会自动填 `npm run build` + `dist`，**下面那栏必须手动改** |
| Build command | `npm run build` | 若日志报找不到 vite，改成 `npm ci && npm run build` |
| **Build output directory** | **`docs`** | ⚠️ 不能留 `dist`：本项目的 `vite.config.js` 里 `outDir: 'docs'`，留 dist 会报「目录不存在」 |
| Root directory（Advanced） | 留空 | 仓库根目录就是项目根目录 |
| Environment variables | `NODE_VERSION` = `22` | Vite 8 需要 Node ≥ 20.19 / ≥ 22.12；仓库里已放 `.nvmrc`（内容 `22`），双保险 |

- **`npm run build` 必须跑完整**，它其实是三步：客户端打包 → SSR 预渲染 → 注入首页 HTML。
  **不要**把 Build command 改成 `exit 0` 之类的跳过构建——没有第 3 步，`docs/index.html`
  只是个空壳（`<div id="root"></div>`），页面内容全靠 JS 渲染，SEO 与无 JS 场景就都没了。
- 用 HashRouter + 相对路径，**不需要** `_redirects`、`_headers` 或任何 404 规则
- 绑定域名：项目 → **Custom domains → Set up a domain**，填 `mingbinportfolio.com`；域名 NS 在 Cloudflare 时一键完成，否则按提示加 CNAME
- 仓库根目录的 `CNAME` 是早年给 GitHub Pages 留的，Cloudflare 不读它，留着无害；但**同一个域名不要同时挂在 GitHub Pages 和 Cloudflare Pages 上**

**产物不进仓库**：`docs/` 与 `dist/` 都已写进 `.gitignore`，由 Cloudflare 每次 push 重新构建。
需要看构建结果时本地跑 `npm run build`，再用 `npm run preview` 预览。

### 曾经用过、现已停用的部署方式（2026-10-10 起不再使用）

| 方式 | 状态 | 备注 |
| --- | --- | --- |
| GitHub Pages（发布仓库里的 `docs/`） | **停用** | 当初产物目录叫 `docs/` 而不是 `dist/`，就是为了 Pages 的「Deploy from a branch」只允许选根目录或 `/docs`。产物现在已不再提交，这条路径随之失效 |
| 腾讯云 COS 静态网站托管 | **停用** | 对应工作流 `.github/workflows/deploy-cos.yml` 已删除（它会在 `docs/**` 变动时触发，现在只会白跑）。`.nojekyll`、`public/CNAME` 是为上面两种旧方式留的，对 Cloudflare 无害，保留 |

> 需要回滚到旧方式的话，从 git 历史里找回 `deploy-cos.yml` 即可（删于 2026-10-10）。
> 注意旧流程的前提是「产物提交进仓库」，而现在已经改成平台侧构建。

### 只改文案 / 换图时

改 `public/data/projects.json`（文案、slug、图片路径）或替换 `public/images/**`，然后 **commit + push**。
Cloudflare Pages 会自动重新构建并发布。

- ⚠️ **不要再指望「只替换线上 `data/projects.json`」**：数据在构建时已被内联进 `docs/index.html`
  与种子脚本，单独换 JSON 不会生效（原因见第 3 节）。必须重新构建。
- 若托管平台对静态资源开了长时间强缓存，把 `data/*.json` 与 `images/*` 的缓存时间调短一点，更新会更及时。
- `docs/` 与 `dist/` 都是生成物，**不要提交**（已在 `.gitignore` 里）。

---

## 8. 常见问题

**页面显示「数据加载失败」？**
① 确认 `public/data/projects.json` 存在且 JSON 合法（不能有注释、结尾不能有多余逗号）；② 确认是通过 `http(s)` 打开而不是 `file://`；③ 点错误面板上的「重新加载」。

**英文页面怎么进？网址是什么？**
点右上角的 `EN` / `中` 按钮，或直接访问 `https://mingbinportfolio.com/#/?lang=en`。
⚠️ 参数必须写在 `#` **之后**：`/?lang=en`（在 `#` 之前）是文档级 query，HashRouter 读不到。

**为什么我打开就是英文 / 就是中文？**
默认跟随浏览器语言（`zh*` → 中文，其余 → 英文），并记住你上次的手动选择。
清除选择：浏览器控制台执行 `localStorage.removeItem('portfolio-lang')` 后刷新。

**加了新作品，英文页面还是空的 / 显示中文？**
该字段没写 `en`。跑 `npm run check`，它会明确指出哪个字段缺英文。

**想再加一种语言（比如日文）？**
① `src/i18n/i18n.jsx` 的 `LANGS` 加上 `'ja'`，`normalizeLangTag` 里加 `ja` 的识别；
② `src/i18n/ui-text.js` 每个词条加一个 `ja`；
③ `projects.json` 每个文本字段加 `ja`（`tf()` 会自动回退，所以可以分批补）；
④ `scripts/prerender.mjs` 的语言引导脚本里加一条 `ja` 判定。
改动面比中英双语大，因为现在是「中文为默认」的二元假设。

**详情页 404（找不到作品）？**
链接里的 slug 与 JSON 中的 `slug` 不一致，检查拼写。

**想改成 BrowserRouter 的干净网址？**
把 `src/entry-client.jsx` 里的 `HashRouter` 换成 `BrowserRouter`，并在托管平台配置「所有路径 rewrite 到 index.html」。这属于托管配置，不是后端。
注意预渲染入口 `src/entry-server.jsx` 用的是 `StaticRouter`，与客户端路由方式无关，改这边不受影响。

**改了 `projects.json`，线上没变化？**
数据在构建时被内联进 `docs/index.html`，所以**必须重新构建**。push 之后 Cloudflare Pages 会自动构建；若没触发，去 Cloudflare 的 Deployments 看那次构建的日志。

**Cloudflare 构建失败 / 页面空白？**
① 确认 Build output directory 是 `docs` 而不是 `dist`；② 确认 Build command 是 `npm run build`（**不要**跳过构建：跳过的话 `docs/index.html` 是空壳，页面会全白）；③ 确认 Node 版本满足 Vite 8 要求（`.nvmrc` 已写 `22`，或设环境变量 `NODE_VERSION=22`）。

**为什么 `docs/` 和 `dist/` 不在仓库里了？**
2026-10-10 起改用 Cloudflare Pages（连 Git、平台侧构建），产物不再提交。本地 `npm run build` 后可以用 `npm run preview` 查看。

**想加「关于我 / 联系方式」独立页面？**
在 `src/pages/` 新建一个页面组件，在 `src/App.jsx` 里加一条 `<Route>`，再去 JSON 的 `site.nav` 里加一个导航项即可，内容依然可以放在 JSON 里。
⚠️ 若新增导航项用的是 `scrollTo` 锚点，请确认首页真的有对应 `id` 的区块——`normalizeSite` 会在 `site.about` 缺失时自动过滤掉指向 `#about` 的导航项，避免出现点了没反应的死按钮。
