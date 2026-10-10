import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/i18n.jsx'

/**
 * 模块一：图片区 —— 横向滚动多图
 * 支持：左右按钮、鼠标拖拽、触屏滑动、滚轮横滚、点击放大（灯箱，Esc/←/→/Tab 可操作）
 */
export default function Gallery({ images, title, index: galleryIndex }) {
  const { t, tf } = useI18n()
  const scrollerRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 })
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const lastIndexRef = useRef(-1)
  const [edges, setEdges] = useState({ prev: false, next: false, progress: 0 })
  const [lightbox, setLightbox] = useState(-1)
  const hasImages = images.length > 0

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({
      prev: el.scrollLeft > 4,
      next: el.scrollLeft < max - 4,
      progress: max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 1,
    })
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    updateEdges()
    el.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null
    observer?.observe(el)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
      observer?.disconnect()
    }
  }, [updateEdges, images.length])

  useEffect(() => {
    if (lightbox < 0) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setLightbox(-1)
        return
      }
      if (event.key === 'ArrowRight') setLightbox((index) => Math.min(images.length - 1, index + 1))
      if (event.key === 'ArrowLeft') setLightbox((index) => Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, images.length])

  /**
   * 模态行为：打开时把焦点移进对话框，并把 Tab 限制在框内。
   *
   * 没有焦点陷阱时，aria-modal="true" 只是「声明」——实际 Tab 会一路跑到背后的
   * 页面链接上（缩略图 → 关闭 → 下一张 → 页面链接…），键盘用户会彻底迷路。
   */
  useEffect(() => {
    if (lightbox < 0) return undefined
    const dialog = dialogRef.current
    if (!dialog) return undefined

    const focusables = () => [...dialog.querySelectorAll('button:not([disabled])')]
    closeButtonRef.current?.focus()

    const onTab = (event) => {
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', onTab)
    return () => dialog.removeEventListener('keydown', onTab)
  }, [lightbox])

  /** 关闭后把焦点归还给触发的缩略图（列表重渲染后元素可能已更换，故重新查找） */
  useEffect(() => {
    if (lightbox >= 0) return undefined
    const index = lastIndexRef.current
    lastIndexRef.current = -1
    if (index < 0) return undefined
    scrollerRef.current?.querySelectorAll('.gallery__thumb')[index]?.focus()
    return undefined
  }, [lightbox])

  /**
   * 锁定背景滚动。
   *
   * 遮罩虽然 position:fixed 且铺满视口，但滚动会链式传给背后的页面：
   * 在打开的大图上滚轮，实测 window.scrollY 会跟着走。关闭后恢复原值。
   */
  useEffect(() => {
    if (lightbox < 0) return undefined
    const body = document.body
    const html = document.documentElement
    const prevBody = body.style.overflow
    const prevHtml = html.style.overflow
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    return () => {
      body.style.overflow = prevBody
      html.style.overflow = prevHtml
    }
  }, [lightbox])

  const scrollByCard = (direction) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.78, 300), behavior: 'smooth' })
  }

  const onPointerDown = (event) => {
    if (event.pointerType === 'touch') return // 触屏交给浏览器原生滚动
    const el = scrollerRef.current
    if (!el) return
    dragRef.current = { active: true, startX: event.clientX, startLeft: el.scrollLeft, moved: 0 }
    el.classList.add('is-dragging')
    el.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    const el = scrollerRef.current
    if (!drag.active || !el) return
    const delta = event.clientX - drag.startX
    drag.moved = Math.max(drag.moved, Math.abs(delta))
    el.scrollLeft = drag.startLeft - delta
  }

  const endDrag = (event) => {
    const el = scrollerRef.current
    if (!dragRef.current.active || !el) return
    dragRef.current.active = false
    el.classList.remove('is-dragging')
    el.releasePointerCapture?.(event.pointerId)
  }

  const openLightbox = (index) => {
    if (dragRef.current.moved > 8) return // 拖拽结束的抬手不算点击
    lastIndexRef.current = index
    setLightbox(index)
  }

  const closeLightbox = () => setLightbox(-1)

  /** 图片替代文本：优先用图注，没有则退回「作品名 展示图 N」 */
  const imageAlt = (image, position) =>
    tf(image.caption) || t('gallery.imageAlt', { title, index: position + 1 })

  if (!hasImages) {
    return (
      <div className="gallery gallery--empty">
        <p>{t('gallery.empty')}</p>
      </div>
    )
  }

  return (
    <section className="gallery" aria-label={t('gallery.regionLabel', { title })}>
      {galleryIndex ? (
        <h2 className="project-section__title gallery__title">
          <span>{galleryIndex}</span>
          {t('project.section.gallery')}
        </h2>
      ) : null}
      <div className="gallery__bar">
        <span className="gallery__hint">{t('gallery.hint', { total: images.length })}</span>
        <div className="gallery__actions">
          <button type="button" onClick={() => scrollByCard(-1)} disabled={!edges.prev} aria-label={t('gallery.prev')}>
            ←
          </button>
          <button type="button" onClick={() => scrollByCard(1)} disabled={!edges.next} aria-label={t('gallery.next')}>
            →
          </button>
        </div>
      </div>

      <div
        className="gallery__scroller"
        ref={scrollerRef}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            scrollByCard(1)
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            scrollByCard(-1)
          }
        }}
      >
        {images.map((image, index) => (
          <figure className="gallery__item" key={`${image.src}-${index}`}>
            <button type="button" className="gallery__thumb" onClick={() => openLightbox(index)}>
              <img src={image.src} alt={imageAlt(image, index)} loading="lazy" draggable={false} />
            </button>
            <figcaption>
              <span className="gallery__num">{String(index + 1).padStart(2, '0')}</span>
              {tf(image.caption) || ' '}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="gallery__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.max(0.06, edges.progress)})` }} />
      </div>

      {lightbox >= 0 ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('gallery.dialogLabel', { title, index: lightbox + 1, total: images.length })}
          ref={dialogRef}
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="lightbox__close"
            ref={closeButtonRef}
            onClick={closeLightbox}
            aria-label={t('gallery.close')}
          >
            ✕
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={(event) => {
              event.stopPropagation()
              setLightbox((index) => Math.max(0, index - 1))
            }}
            disabled={lightbox === 0}
            aria-label={t('gallery.prev')}
          >
            ←
          </button>
          <img
            src={images[lightbox].src}
            alt={imageAlt(images[lightbox], lightbox)}
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={(event) => {
              event.stopPropagation()
              setLightbox((index) => Math.min(images.length - 1, index + 1))
            }}
            disabled={lightbox === images.length - 1}
            aria-label={t('gallery.next')}
          >
            →
          </button>
          <p className="lightbox__caption">
            {tf(images[lightbox].caption) || ' '}
            <span>
              {lightbox + 1} / {images.length}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  )
}
