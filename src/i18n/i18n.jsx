/**
 * 轻量 i18n：语言状态 + 文案字典 + 双语内容取值。
 *
 * 语言怎么定（优先级从高到低）：
 *   1. URL 参数 ?lang=en / ?lang=zh —— 可分享、可回退（HashRouter 下形如 #/project/xxx?lang=en）
 *   2. localStorage 里上次的手动选择 —— 保证在站内跳转（会丢掉 query）后仍是同一语言
 *   3. 浏览器语言 —— zh* 用中文，其余用英文
 *
 * 为什么不只用 URL：本项目用 HashRouter，站内跳转（如从首页进作品页）不保留 query，
 * 只靠 URL 会导致「切到英文→点进作品→变回中文」。所以手动选择会落到 localStorage。
 *
 * 默认语言是中文，所以预渲染的 HTML（无 ?lang=）与「中文浏览器」的首次渲染一致。
 * 英文用户首帧会先看到中文再切到英文，这是客户端切语言的固有代价。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UI_TEXT } from './ui-text.js'

export const LANGS = ['zh', 'en']
export const DEFAULT_LANG = 'zh'

const LANG_PARAM = 'lang'
const STORAGE_KEY = 'portfolio-lang'

function isLang(value) {
  return typeof value === 'string' && LANGS.includes(value)
}

/** 把任意语言标记（zh-CN / en-US / zh-Hant…）归一化成 zh 或 en，识别不了返回 null */
export function normalizeLangTag(tag) {
  if (!tag) return null
  const lower = String(tag).toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  return null
}

function detectFromBrowser() {
  if (typeof navigator === 'undefined') return null
  const tags = [navigator.language, ...(navigator.languages || [])]
  for (const tag of tags) {
    const lang = normalizeLangTag(tag)
    if (lang) return lang
  }
  return null
}

function readStoredLang() {
  if (typeof localStorage === 'undefined') return null
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLang(value) ? value : null
  } catch {
    // 隐私模式 / 禁用存储时忽略
    return null
  }
}

function writeStoredLang(lang) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* 忽略 */
  }
}

/** 浏览器/构建环境下解析初始语言；预渲染（无 window）时返回默认中文 */
export function resolveInitialLang(urlLang) {
  if (isLang(urlLang)) return urlLang
  return readStoredLang() ?? detectFromBrowser() ?? DEFAULT_LANG
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlLang = searchParams.get(LANG_PARAM)

  const [lang, setLangState] = useState(() => resolveInitialLang(urlLang))

  // URL 上带了合法语言参数时以它为准 —— 覆盖「别人分享的 ?lang=en 链接」
  // 以及浏览器前进/后退。手动切换走的也是这条路径。
  useEffect(() => {
    if (isLang(urlLang) && urlLang !== lang) {
      setLangState(urlLang)
      writeStoredLang(urlLang)
    }
  }, [urlLang, lang])

  const setLang = useCallback(
    (next) => {
      const value = isLang(next) ? next : DEFAULT_LANG
      setLangState(value)
      writeStoredLang(value)

      // 把语言写进 URL，便于分享与前进/后退；默认中文时移除参数保持网址干净
      const params = new URLSearchParams(searchParams)
      if (value === DEFAULT_LANG) params.delete(LANG_PARAM)
      else params.set(LANG_PARAM, value)
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  // 让 <html lang> 跟随实际语言（影响读屏发音、断词与 :lang() 样式）
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    }
  }, [lang])

  const value = useMemo(() => {
    const t = (key, vars) => {
      const entry = UI_TEXT[key]
      // 缺词条时直接显示 key，便于开发期发现遗漏，而不是静默显示空白
      const template = entry ? entry[lang] ?? entry[DEFAULT_LANG] : undefined
      if (template == null) return key
      if (!vars) return template
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
      )
    }

    /**
     * 取双语内容字段的值。
     * 内容字段统一写成 { zh: '…', en: '…' }；为兼容旧写法，也接受纯字符串。
     * 当前语言缺失时回退到另一种语言，避免出现空白。
     */
    const tf = (field) => {
      if (field == null) return ''
      if (typeof field === 'string') return field
      if (typeof field !== 'object') return String(field)
      return field[lang] ?? field[DEFAULT_LANG] ?? field.zh ?? field.en ?? ''
    }

    return { lang, setLang, t, tf, isEnglish: lang === 'en' }
  }, [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useI18n 必须在 <LanguageProvider> 内使用')
  return context
}
