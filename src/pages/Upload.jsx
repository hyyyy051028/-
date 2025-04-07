import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { addPhotos } from '../services/db'
import Toast from '../components/Toast'
import '../App.css'

function Upload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  // 处理文件上传
  const handleFiles = async (files) => {
    if (isUploading) return
    setIsUploading(true)

    try {
      const newPhotos = []
      const filePromises = Array.from(files).map(file => {
        if (!file.type.startsWith('image/')) {
          setToast({ message: '只能上传图片文件', type: 'error' })
          return null
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            newPhotos.push({
              id: Date.now() + Math.random(),
              url: e.target.result,
              name: file.name,
              type: file.type,
              size: file.size,
              uploadDate: new Date().toISOString()
            })
            resolve()
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })

      await Promise.all(filePromises.filter(Boolean))
      await addPhotos(newPhotos)
      setToast({ message: '上传成功', type: 'success' })
    } catch (error) {
      console.error('Error uploading files:', error)
      setToast({ message: '上传失败', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  // 处理文件上传事件
  const handleFileUpload = useCallback((event) => {
    handleFiles(event.target.files)
  }, [])

  // 处理拖拽事件
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  return (
    <div 
      className="app"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`drop-zone ${isDragging ? 'dragging' : ''}`}>
        <div className="upload-container">
          <h1>照片上传</h1>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            id="fileInput"
            style={{ display: 'none' }}
            disabled={isUploading}
          />
          <label 
            htmlFor="fileInput" 
            className={`upload-button ${isUploading ? 'disabled' : ''}`}
          >
            {isUploading ? '上传中...' : '选择照片'}
          </label>
          <p className="drag-tip">或将图片拖放到此处</p>
          <button 
            className="view-gallery-button"
            onClick={() => navigate('/gallery')}
          >
            查看图库
          </button>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Upload
