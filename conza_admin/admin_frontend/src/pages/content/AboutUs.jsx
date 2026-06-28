import { useState, useEffect } from 'react'
import { Save, Info, Loader } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import { useToastStore } from '../../store/notifications/useToastStore'
import { getAboutContent, saveAboutContent } from '../../services/legalService'

export default function AboutUs() {
  const addToast = useToastStore((s) => s.addToast)
  const [title, setTitle] = useState('About Conza')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await getAboutContent()
        setTitle(res.about?.title || 'About Conza')
        setContent(res.about?.content || '')
      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Failed to load About Us content.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [addToast])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAboutContent({ title, content })
      addToast({ type: 'success', message: 'About Us content saved.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save About Us content.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'Legal' }, { label: 'About Us' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">About Us</h1>
        <Button onClick={handleSave} loading={saving} disabled={loading}><Save size={16} /> Save</Button>
      </div>
      <p className="text-sm text-textSecondary">
        This content is shared across the Customer, Vendor, and Business Partner apps.
      </p>

      <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Info size={20} className="text-accentAmber" />
          <h3 className="font-semibold text-textPrimary">Edit About Us</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-accentAmber" /></div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-textSecondary mb-1 block">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-textSecondary mb-1 block">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[400px] font-mono leading-relaxed"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
