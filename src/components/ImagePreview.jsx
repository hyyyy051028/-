import { useEffect, useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'

function ImagePreview({ photos, currentIndex, onClose, onPrev, onNext }) {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const currentPhoto = photos[currentIndex]

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onPrev()
          break
        case 'ArrowRight':
          onNext()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext])

  // 触摸事件处理
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      onNext()
    } else if (isRightSwipe) {
      onPrev()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  if (!currentPhoto) return null

  return (
    <div 
      className="image-preview-overlay"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="image-preview-content" onClick={e => e.stopPropagation()}>
        <button className="preview-close-button" onClick={onClose}>×</button>
        <button className="preview-nav-button prev" onClick={onPrev}>‹</button>
        <button className="preview-nav-button next" onClick={onNext}>›</button>
        
        <div className="preview-image-container">
          <LazyLoadImage
            alt={currentPhoto.name}
            src={currentPhoto.url}
            effect="blur"
            className="preview-image"
          />
        </div>
        
        <div className="preview-info">
          <div className="preview-title">{currentPhoto.name}</div>
          <div className="preview-date">
            {new Date(currentPhoto.uploadDate).toLocaleDateString()}
          </div>
          <div className="preview-counter">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImagePreview
