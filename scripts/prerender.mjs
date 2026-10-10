/**
 * 把首页预渲染结果注入构建产物 docs/index.html。
 *
 * 在 `vite build`（客户端）与 `vite build --ssr`（服务端）之后运行：
 *   1. 读 public/data/projects.json
 *   2. 用 dist/ssr/entry-server.js 的 render() 拿到首页 HTML
 *   3. 用正则把 HTML 注入 docs/index.html 的 <div id="root"></div>
 *
 * 为什么不用 cheerio 等依赖：这里只需要替换一个固定字符串，正则足够且零依赖。
 *
 * 失败即非零退出，避免悄悄发布一个空壳页面。
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')

const templatePath = resolve(projectRoot, 'docs/index.html')
const dataPath = resolve(projectRoot, 'public/data/projects.json')
const ssrEntryPath = resolve(projectRoot, 'dist/ssr/entry-server.js')

const ROOT_MARKUP = '<div id="root"></div>'

/** 构建产物里的根节点可能带属性，这里做一次宽松匹配 */
const ROOT_PATTERN = /<div id="root">\s*<\/div>/

/**
 * 把数据也塞进 HTML。
 *
 * 只预渲染 HTML 是不够的：客户端首帧用的是「loading + 空列表」，与预渲染出来的
 * 「ready + 5 个作品」不一致，React 会报 hydration mismatch 并把内容整段重建。
 * 让客户端开局就拿到同一份数据，首帧才能与 HTML 完全对齐。
 */
const SEED_SCRIPT_ID = 'portfolio-seed-data'

function buildSeedScript(data) {
  // JSON 里若出现 </script 会提前闭合脚本，必须转义
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/json" id="${SEED_SCRIPT_ID}">${json}</script>`
}

/**
 * 语言引导脚本：在 React 之前就定下语言，避免英文用户先看到中文再闪一下。
 *
 * 背景：预渲染出来的 HTML 是中文（构建期无浏览器信息）。如果只靠 React 在运行时
 * 选语言，英文用户会看到中文内容闪现后才变英文。这里用一段**同步**内联脚本抢先处理：
 *   · 用户手动选过语言（localStorage）→ 只把 URL 补成 ?lang=xx，不改判定
 *   · 没选过且浏览器不是中文 → 直接认定英文，写 localStorage 并把 URL 补成 ?lang=en
 * 脚本在 <script type="module">（defer 语义）之前同步执行，因此 React 首次渲染即为正确语言，
 * 也避免了「HTML 中文 / 客户端英文」的 hydration 不一致。
 * 用 replaceState 改网址，不产生额外历史记录。
 */
function buildLangBootstrapScript() {
  const code = `(function(){try{
var doc=document.documentElement,base=doc.getAttribute('data-base')||'';
var m=/[?&]lang=(zh|en)(&|$)/.exec(location.search||'');
var stored=null;try{stored=localStorage.getItem('portfolio-lang')}catch(e){}
var lang;
if(m){lang=m[1]}
else if(stored==='zh'||stored==='en'){lang=stored}
else{
  var tags=[navigator.language].concat(navigator.languages||[]),picked=null;
  for(var i=0;i<tags.length;i++){var t=String(tags[i]||'').toLowerCase();
    if(t.indexOf('zh')===0){picked='zh';break}
    if(t.indexOf('en')===0){picked='en';break}}
  lang=picked||'zh';
  if(lang==='en'){try{localStorage.setItem('portfolio-lang','en')}catch(e){}}
}
doc.lang=lang==='en'?'en':'zh-CN';
if(lang==='en'){
  var search=location.search||'';
  var next=search?((/[?&]lang=/.test(search))?search.replace(/([?&])lang=(zh|en)/,'$1lang=en'):search+'&lang=en'):'?lang=en';
  var url=location.pathname+next+location.hash;
  // 部署在子目录时（base 形如 /sub/），replaceState 只接受同源且同 base 的地址
  if(base&&base!=='/'&&url.indexOf(base)!==0){url=base.replace(/\\/$/,'')+url}
  history.replaceState(history.state,'',url);
}
}catch(e){}})();`
  return `<script>${code}</script>`
}

async function main() {
  for (const [label, path] of [
    ['构建产物 docs/index.html', templatePath],
    ['数据 public/data/projects.json', dataPath],
    ['SSR 入口 dist/ssr/entry-server.js', ssrEntryPath],
  ]) {
    if (!existsSync(path)) {
      throw new Error(`找不到${label}：${path}\n       请先执行 vite build 与 vite build --ssr。`)
    }
  }

  const template = await readFile(templatePath, 'utf8')
  if (!ROOT_PATTERN.test(template)) {
    throw new Error(
      `docs/index.html 里找不到可注入的 <div id="root"></div>：${templatePath}\n` +
        '       若已预渲染过，请先重新运行 vite build（会清空 docs/）。',
    )
  }

  const data = JSON.parse(await readFile(dataPath, 'utf8'))
  const { render } = await import(`file://${ssrEntryPath.replace(/\\/g, '/')}`)
  const appHtml = render({ data, url: '/' })

  if (!appHtml || appHtml.length < 500) {
    throw new Error(`预渲染结果过短（${appHtml ? appHtml.length : 0} 字节），疑似渲染失败，已中止。`)
  }

  // 语言引导脚本放 </head> 之前：classic script 同步执行，而 <script type="module">
  // 是 defer 语义，所以它一定先跑，React 首次渲染拿到的就是正确语言。
  const output = template
    .replace(ROOT_PATTERN, `<div id="root">${appHtml}</div>`)
    .replace('</head>', `  ${buildLangBootstrapScript()}\n  </head>`)
    .replace('</body>', `  ${buildSeedScript(data)}\n  </body>`)
  await writeFile(templatePath, output, 'utf8')

  const kib = (Buffer.byteLength(output) / 1024).toFixed(1)
  console.log(`[prerender] 首页已注入 docs/index.html（${appHtml.length} 字节内容，整页 ${kib} KB）`)
}

main().catch((error) => {
  console.error(`[prerender] 失败：${error.message}`)
  process.exit(1)
})
