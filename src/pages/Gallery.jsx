import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getAllPhotos, updatePhotoOrder } from '../services/db';
import ImagePreview from '../components/ImagePreview';
import 'react-lazy-load-image-component/src/effects/blur.css';
import '../App.css';

function Gallery() {
  const [allPhotos, setAllPhotos] = useState([]);
  const [displayedPhotos, setDisplayedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [layout, setLayout] = useState('masonry');
  const [hoverPhoto, setHoverPhoto] = useState(null);
  const [selectedSize, setSelectedSize] = useState('mixed');
  const [previewIndex, setPreviewIndex] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const pageSize = 12;
  const loadMoreRef = useRef(null);
  const navigate = useNavigate();

  // 从IndexedDB加载照片
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const photos = await getAllPhotos();
        const sortedPhotos = photos.sort((a, b) => 
          b.uploadDate.localeCompare(a.uploadDate)
        );
        setAllPhotos(sortedPhotos);
        setDisplayedPhotos(sortedPhotos.slice(0, pageSize));
        setHasMore(sortedPhotos.length > pageSize);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  // 处理拖拽结束
  const onDragEnd = async (result) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    const newPhotos = Array.from(displayedPhotos);
    const [removed] = newPhotos.splice(sourceIndex, 1);
    newPhotos.splice(destinationIndex, 0, removed);

    // 更新显示的照片顺序
    setDisplayedPhotos(newPhotos);

    // 更新所有照片的顺序
    const newAllPhotos = Array.from(allPhotos);
    const allSourceIndex = allPhotos.findIndex(p => p.id === removed.id);
    const [allRemoved] = newAllPhotos.splice(allSourceIndex, 1);
    const allDestinationIndex = Math.min(
      destinationIndex + (allSourceIndex < destinationIndex ? 1 : 0),
      newAllPhotos.length
    );
    newAllPhotos.splice(allDestinationIndex, 0, allRemoved);
    setAllPhotos(newAllPhotos);

    // 保存新的顺序到数据库
    try {
      await updatePhotoOrder(newAllPhotos.map((photo, index) => ({
        id: photo.id,
        order: index
      })));
    } catch (error) {
      console.error('Error updating photo order:', error);
    }
  };

  // 处理拖拽开始
  const onDragStart = () => {
    setIsDragging(true);
  };

  // 加载更多照片
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || isDragging) return;
    
    setLoadingMore(true);
    const currentLength = displayedPhotos.length;
    const nextPhotos = allPhotos.slice(currentLength, currentLength + pageSize);
    
    setTimeout(() => {
      setDisplayedPhotos(prev => [...prev, ...nextPhotos]);
      setHasMore(currentLength + pageSize < allPhotos.length);
      setLoadingMore(false);
    }, 500);
  }, [displayedPhotos.length, allPhotos, hasMore, loadingMore, isDragging]);

  // 监听滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore]);

  // 预览控制
  const handlePreviewOpen = (index) => {
    if (isDragging) return;
    setPreviewIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const handlePreviewClose = () => {
    setPreviewIndex(null);
    document.body.style.overflow = 'auto';
  };

  const handlePrevImage = () => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : displayedPhotos.length - 1));
  };

  const handleNextImage = () => {
    setPreviewIndex((prev) => (prev < displayedPhotos.length - 1 ? prev + 1 : 0));
  };

  // 瀑布流的断点设置
  const breakpointColumns = {
    default: selectedSize === 'small' ? 4 : selectedSize === 'large' ? 2 : 3,
    1800: selectedSize === 'small' ? 3 : selectedSize === 'large' ? 2 : 3,
    1400: selectedSize === 'small' ? 3 : selectedSize === 'large' ? 2 : 2,
    1100: selectedSize === 'small' ? 2 : selectedSize === 'large' ? 1 : 2,
    700: selectedSize === 'small' ? 2 : 1,
    500: 1,
  };

  // 获取随机的照片样式
  const getPhotoStyle = (index) => {
    if (selectedSize !== 'mixed') return {};

    const styles = [
      { flex: '2', margin: '0 8px' }, // 大尺寸
      { flex: '1', margin: '0 8px' }, // 正常尺寸
      { flex: '1.5', margin: '0 8px' }, // 中等尺寸
      { flex: '0.8', margin: '0 8px' }, // 小尺寸
    ];
    return styles[index % styles.length];
  };

  // 渲染照片项
  const renderPhotoItem = (photo, index, provided = null, snapshot = null) => {
    const isHovered = hoverPhoto === photo.id;
    const photoStyle = getPhotoStyle(index);
    const isDraggingThis = snapshot?.isDragging;

    return (
      <div
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={`photo-item ${layout}-item ${selectedSize}-size ${isDraggingThis ? 'dragging' : ''}`}
        onMouseEnter={() => setHoverPhoto(photo.id)}
        onMouseLeave={() => setHoverPhoto(null)}
        style={{
          ...photoStyle,
          ...provided?.draggableProps?.style,
        }}
        onClick={() => !isDragging && handlePreviewOpen(index)}
      >
        <div className={`photo-wrapper ${isHovered ? 'hovered' : ''}`}>
          <LazyLoadImage
            alt={photo.name}
            src={photo.url}
            effect="blur"
            className={`photo ${layout}-photo`}
          />
          <div className="photo-info">
            <span className="photo-name">{photo.name}</span>
            <span className="photo-date">
              {new Date(photo.uploadDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const renderPhotoGrid = () => {
    if (layout === 'masonry') {
      return (
        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <Droppable droppableId="photos" type="PHOTO">
            {(provided) => (
              <Masonry
                breakpointCols={breakpointColumns}
                className={`photo-grid masonry-layout ${selectedSize}-size`}
                columnClassName="masonry-column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {displayedPhotos.map((photo, index) => (
                  <Draggable
                    key={photo.id}
                    draggableId={photo.id}
                    index={index}
                  >
                    {(provided, snapshot) =>
                      renderPhotoItem(photo, index, provided, snapshot)
                    }
                  </Draggable>
                ))}
                {provided.placeholder}
              </Masonry>
            )}
          </Droppable>
        </DragDropContext>
      );
    }

    return (
      <div className={`photo-container ${layout}-layout`}>
        {displayedPhotos.map((photo, index) => renderPhotoItem(photo, index))}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>照片库</h1>
        <div className="controls">
          <div className="layout-buttons">
            <button
              className={`layout-button ${
                layout === 'masonry' ? 'active' : ''
              }`}
              onClick={() => setLayout('masonry')}
            >
              瀑布流
            </button>
            <button
              className={`layout-button ${layout === 'grid' ? 'active' : ''}`}
              onClick={() => setLayout('grid')}
            >
              网格
            </button>
            <button
              className={`layout-button ${layout === 'list' ? 'active' : ''}`}
              onClick={() => setLayout('list')}
            >
              列表
            </button>
          </div>
          {layout === 'masonry' && (
            <div className="size-buttons">
              <button
                className={`size-button ${
                  selectedSize === 'mixed' ? 'active' : ''
                }`}
                onClick={() => setSelectedSize('mixed')}
              >
                混合大小
              </button>
              <button
                className={`size-button ${
                  selectedSize === 'large' ? 'active' : ''
                }`}
                onClick={() => setSelectedSize('large')}
              >
                大图
              </button>
              <button
                className={`size-button ${
                  selectedSize === 'small' ? 'active' : ''
                }`}
                onClick={() => setSelectedSize('small')}
              >
                小图
              </button>
            </div>
          )}
          <button className="upload-button" onClick={() => navigate('/')}>
            返回上传
          </button>
        </div>
        <p className="photo-count">{allPhotos.length} 张照片</p>
      </header>

      {allPhotos.length === 0 ? (
        <div className="empty-state">
          <p>还没有上传任何照片</p>
          <button className="upload-button" onClick={() => navigate('/')}>
            去上传照片
          </button>
        </div>
      ) : (
        <>
          {renderPhotoGrid()}
          {hasMore && (
            <div ref={loadMoreRef} className="load-more">
              {loadingMore ? '加载更多...' : ''}
            </div>
          )}
        </>
      )}

      {previewIndex !== null && (
        <ImagePreview
          photos={displayedPhotos}
          currentIndex={previewIndex}
          onClose={handlePreviewClose}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />
      )}
    </div>
  );
}

export default Gallery;
