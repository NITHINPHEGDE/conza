import { useState, useEffect, useCallback } from 'react'
import { UploadCloud, X, ImageOff } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Table from '../components/common/Table'
import StatusBadge from '../components/common/StatusBadge'
import bannerService from '../services/bannerService'

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await bannerService.getAll({ appTarget: 'customer' })
      setBanners(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  const toggleStatus = async (banner) => {
    const nextStatus = banner.status === 'published' ? 'archived' : 'published'
    const prevBanners = banners
    setBanners((prev) => prev.map((b) => (b._id === banner._id ? { ...b, status: nextStatus } : b)))
    try {
      await bannerService.update(banner._id, { status: nextStatus })
    } catch (err) {
      setBanners(prevBanners)
      setError(err.message || 'Failed to update banner')
    }
  }

  const handleDelete = async (id) => {
    const prevBanners = banners
    setBanners((prev) => prev.filter((b) => b._id !== id))
    try {
      await bannerService.remove(id)
    } catch (err) {
      setBanners(prevBanners)
      setError(err.message || 'Failed to delete banner')
    }
  }

  const handleAdded = (created) => {
    setBanners((prev) => [...prev, ...created])
    setIsModalOpen(false)
  }

  const columns = [
    {
      key: 'image',
      title: 'Preview',
      render: (row) => (
        <div className="w-24 h-14 rounded-lg overflow-hidden bg-surfaceElevated border border-border flex items-center justify-center">
          {row.image ? (
            <img src={row.image} alt={row.title || 'Banner'} className="w-full h-full object-cover" />
          ) : (
            <ImageOff size={18} className="text-textMuted" />
          )}
        </div>
      ),
    },
    { key: 'position', title: 'Position', render: (row) => row.position || 'customer_app' },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status === 'published' ? 'active' : 'inactive'} />,
    },
    {
      key: 'createdAt',
      title: 'Added',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => toggleStatus(row)}>
            {row.status === 'published' ? 'Pause' : 'Activate'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper title="Banner Management" subtitle="Manage the promotional banners shown in the Customer app">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Customer App Banners</h2>
          <Button onClick={() => setIsModalOpen(true)}>Add Banner</Button>
        </div>

        {error && <div className="text-sm text-danger">{error}</div>}

        <Table
          columns={columns}
          data={banners}
          rowKey="_id"
          emptyText={loading ? 'Loading banners...' : 'No banners added yet'}
        />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Banner" size="lg">
          <BannerUploadForm onAdded={handleAdded} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </PageWrapper>
  )
}

function BannerUploadForm({ onAdded, onCancel }) {
  const [images, setImages] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const readFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setImages((prev) => [...prev, reader.result])
      reader.readAsDataURL(file)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    readFiles(e.dataTransfer.files)
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddBanner = async () => {
    if (images.length === 0) {
      setError('Drag and drop at least one image.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const created = await Promise.all(
        images.map((image, index) =>
          bannerService
            .create({
              type: 'banner',
              appTarget: 'customer',
              position: 'customer_app',
              status: 'published',
              order: index,
              image,
            })
            .then((res) => res.content)
        )
      )
      onAdded(created)
    } catch (err) {
      setError(err.message || 'Failed to add banner')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-danger">{error}</div>}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('banner-file-input')?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
          isDragging ? 'border-accentAmber bg-accentYellowSoft' : 'border-border bg-surfaceElevated hover:bg-surfaceElevated/70'
        }`}
      >
        <UploadCloud size={28} className="text-accentAmber" />
        <p className="text-sm font-medium text-textPrimary">Drag & drop banner images here</p>
        <p className="text-xs text-textMuted">or click to browse — you can add multiple images</p>
        <input
          id="banner-file-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => readFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative group w-full aspect-video rounded-lg overflow-hidden border border-border bg-surfaceElevated"
            >
              <img src={src} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} variant="secondary" type="button">Cancel</Button>
        <Button onClick={handleAddBanner} variant="primary" disabled={saving || images.length === 0}>
          {saving ? 'Adding...' : `Add Banner${images.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  )
}
