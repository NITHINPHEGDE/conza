import { useState, useEffect, useCallback } from 'react'
import { Save, Shield, Loader } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import { useToastStore } from '../../store/notifications/useToastStore'
import { getLegal, saveLegal } from '../../services/legalService'

const categories = [
  { key: 'customer', label: 'Customer App' },
  { key: 'vendor', label: 'Vendor App' },
  { key: 'worker', label: 'Business Partner App' },
]

export default function Privacy() {
  const addToast = useToastStore((s) => s.addToast)
  const [activeTab, setActiveTab] = useState('customer')
  const [titles, setTitles] = useState({})
  const [bodies, setBodies] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (appTarget) => {
    setLoading(true)
    try {
      const res = await getLegal(appTarget)
      const privacy = res.privacy
      setTitles((prev) => ({ ...prev, [appTarget]: privacy?.title || 'Privacy Policy' }))
      setBodies((prev) => ({ ...prev, [appTarget]: privacy?.content || '' }))
    } catch (err) {
      addToast(err.message || 'Failed to load privacy policy.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    if (titles[activeTab] === undefined) load(activeTab)
  }, [activeTab, load, titles])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveLegal('privacy', activeTab, {
        title: titles[activeTab] || 'Privacy Policy',
        content: bodies[activeTab] || '',
      })
      addToast('Privacy Policy saved.', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to save privacy policy.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'Legal' }, { label: 'Privacy' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Privacy Policy</h1>
        <Button onClick={handleSave} loading={saving} disabled={loading}><Save size={16} /> Save</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors ${
              activeTab === cat.key
                ? 'bg-accentYellow text-accentAmber border-accentAmber font-medium'
                : 'bg-surface text-textSecondary border-border hover:bg-surfaceElevated'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-accentAmber" />
          <h3 className="font-semibold text-textPrimary">
            Edit Privacy Policy ({categories.find((c) => c.key === activeTab)?.label})
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-accentAmber" /></div>
        ) : (
          <textarea
            value={bodies[activeTab] || ''}
            onChange={(e) => setBodies((prev) => ({ ...prev, [activeTab]: e.target.value }))}
            className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[500px] font-mono leading-relaxed"
          />
        )}
      </div>
    </div>
  )
}
