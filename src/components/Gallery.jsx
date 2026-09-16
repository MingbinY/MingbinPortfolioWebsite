import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 模块一：图片区 —— 横向滚动多图
 * 支持：左右按钮、鼠标拖拽、触屏滑动、滚轮横滚、点击放大（灯箱，Esc/←/→ 可操作）
 */
export default function Gallery({ images, title }) {
  const scrollerRef = useRef(null)
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 })
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
      if (event.key === 'Escape') setLightbox(-1)
      if (event.key === 'ArrowRight') setLightbox((index) => Math.min(images.length - 1, index + 1))
      if (event.key === 'ArrowLeft') setLightbox((index) => Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, images.length])

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
    setLightbox(index)
  }

  if (!hasImages) {
    return (
      <div className="gallery gallery--empty">
        <p>这个作品还没有上传展示图。把图片放进 public/images/ 后在 projects.json 的 gallery 里填上路径即可。</p>
      </div>
    )
  }

  return (
    <section className="gallery" aria-label={`${title} 展示图`}>
      <div className="gallery__bar">
        <span className="gallery__hint">横向滚动 / 拖拽查看 · 点击放大 · 共 {images.length} 张</span>
        <div className="gallery__actions">
          <button type="button" onClick={() => scrollByCard(-1)} disabled={!edges.prev} aria-label="上一张">
            ←
          </button>
          <button type="button" onClick={() => scrollByCard(1)} disabled={!edges.next} aria-label="下一张">
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
              <img src={image.src} alt={image.caption || `${title} 展示图 ${index + 1}`} loading="lazy" draggable={false} />
            </button>
            <figcaption>
              <span className="gallery__num">{String(index + 1).padStart(2, '0')}</span>
              {image.caption || ' '}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="gallery__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.max(0.06, edges.progress)})` }} />
      </div>

      {lightbox >= 0 ? (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(-1)}>
          <button type="button" className="lightbox__close" onClick={() => setLightbox(-1)} aria-label="关闭">
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
            aria-label="上一张"
          >
            ←
          </button>
          <img
            src={images[lightbox].src}
            alt={images[lightbox].caption || `${title} 展示图 ${lightbox + 1}`}
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
            aria-label="下一张"
          >
            →
          </button>
          <p className="lightbox__caption">
            {images[lightbox].caption || ' '}
            <span>
              {lightbox + 1} / {images.length}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  )
}
