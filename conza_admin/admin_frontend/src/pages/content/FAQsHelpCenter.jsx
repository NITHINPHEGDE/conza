import { useState, useEffect, useCallback } from 'react'
import { Edit, Trash2, Plus, HelpCircle, BookOpen, ChevronDown, ChevronRight, Loader } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import { useToastStore } from '../../store/notifications/useToastStore'
import {
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  getHelpArticles, createHelpArticle, updateHelpArticle, deleteHelpArticle,
} from '../../services/faqHelpService'

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_TARGETS = [
  { value: 'customer', label: 'Customer' },
  { value: 'worker',   label: 'Worker' },
  { value: 'vendor',   label: 'Vendor' },
]

const APP_TARGET_FILTER = [
  { value: 'all',      label: 'All Apps' },
  { value: 'customer', label: 'Customer' },
  { value: 'worker',   label: 'Worker' },
  { value: 'vendor',   label: 'Vendor' },
]

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const ARTICLE_STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft',     label: 'Draft' },
]

const APP_BADGE_CLASSES = {
  customer: 'bg-blue-100 text-blue-700',
  worker:   'bg-purple-100 text-purple-700',
  vendor:   'bg-orange-100 text-orange-700',
}

const FAQ_DEFAULT_FORM = {
  question: '', answer: '', appTarget: 'customer',
  sectionTitle: 'General', sectionIcon: '❓',
  order: 0, status: 'active',
}

const HELP_DEFAULT_FORM = {
  title: '', content: '', appTarget: 'customer',
  status: 'draft', order: 0,
}

// ── Sub Components ────────────────────────────────────────────────────────────

function AppBadge({ appTarget }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${APP_BADGE_CLASSES[appTarget] || 'bg-gray-100 text-gray-600'}`}>
      {appTarget}
    </span>
  )
}

function StatusBadge({ status, activeValue = 'active' }) {
  const isActive = status === activeValue || status === 'published'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ── Tab: FAQs ────────────────────────────────────────────────────────────────

function FAQsTab() {
  const addToast = useToastStore((s) => s.addToast)
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterApp, setFilterApp] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(FAQ_DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadFAQs = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterApp !== 'all' ? { appTarget: filterApp } : {}
      const res = await getFAQs({ ...params, limit: 200 })
      setFaqs(res.data?.data || []) // Using res.data.data since sendPaginated/sendSuccess can differ
    } catch {
      addToast('Failed to load FAQs.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterApp])

  useEffect(() => { loadFAQs() }, [loadFAQs])

  const openAdd = () => {
    setEditing(null)
    setForm(FAQ_DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      question:     row.question,
      answer:       row.answer,
      appTarget:    row.appTarget,
      sectionTitle: row.sectionTitle || 'General',
      sectionIcon:  row.sectionIcon  || '❓',
      order:        row.order        ?? 0,
      status:       row.status,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      addToast('Question and answer are required.', 'error')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await updateFAQ(editing._id, form)
        setFaqs((prev) => prev.map((f) => f._id === editing._id ? res.data?.faq || res.faq : f))
        addToast('FAQ updated successfully.', 'success')
      } else {
        const res = await createFAQ(form)
        setFaqs((prev) => [res.data?.faq || res.faq, ...prev])
        addToast('FAQ created successfully.', 'success')
      }
      setModalOpen(false)
      loadFAQs()
    } catch (err) {
      addToast(err.message || 'Failed to save FAQ.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteFAQ(deleteTarget._id)
      setFaqs((prev) => prev.filter((f) => f._id !== deleteTarget._id))
      addToast('FAQ deleted.', 'success')
    } catch {
      addToast('Failed to delete FAQ.', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'question', title: 'Question',
      render: (row) => (
        <div className="flex items-start gap-2 max-w-sm">
          <HelpCircle size={14} className="text-accentAmber mt-0.5 flex-shrink-0" />
          <span className="text-sm font-medium text-textPrimary line-clamp-2">{row.question}</span>
        </div>
      ),
    },
    {
      key: 'appTarget', title: 'App',
      render: (row) => <AppBadge appTarget={row.appTarget} />,
    },
    {
      key: 'sectionTitle', title: 'Section',
      render: (row) => (
        <span className="text-sm text-textSecondary">
          {row.sectionIcon} {row.sectionTitle}
        </span>
      ),
    },
    {
      key: 'status', title: 'Status',
      render: (row) => <StatusBadge status={row.status} activeValue="active" />,
    },
    {
      key: 'actions', title: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            options={APP_TARGET_FILTER}
            value={filterApp}
            onChange={(e) => setFilterApp(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={openAdd}>
          <Plus size={15} /> Add FAQ
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size={24} className="text-accentAmber animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={faqs} />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit FAQ' : 'Add FAQ'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader size={14} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="App Target"
            options={APP_TARGETS}
            value={form.appTarget}
            onChange={(e) => setForm({ ...form, appTarget: e.target.value })}
          />
          <Input
            label="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="e.g. How do I book a service?"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={5}
              placeholder="Provide a clear and helpful answer…"
              className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Section Title"
              value={form.sectionTitle}
              onChange={(e) => setForm({ ...form, sectionTitle: e.target.value })}
              placeholder="e.g. Booking"
            />
            <Input
              label="Section Icon (emoji)"
              value={form.sectionIcon}
              onChange={(e) => setForm({ ...form, sectionIcon: e.target.value })}
              placeholder="e.g. 📅"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete FAQ"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-textSecondary">
          Are you sure you want to delete the FAQ: <span className="font-semibold text-textPrimary">"{deleteTarget?.question?.substring(0, 80)}"</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

// ── Tab: Help Articles ────────────────────────────────────────────────────────

function HelpArticlesTab() {
  const addToast = useToastStore((s) => s.addToast)
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterApp, setFilterApp] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(HELP_DEFAULT_FORM)
  const [saving, setSaving]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterApp !== 'all' ? { appTarget: filterApp } : {}
      const res = await getHelpArticles({ ...params, limit: 200 })
      setArticles(res.data?.data || [])
    } catch {
      addToast('Failed to load help articles.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterApp])

  useEffect(() => { loadArticles() }, [loadArticles])

  const openAdd = () => {
    setEditing(null)
    setForm(HELP_DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      title:     row.title,
      content:   row.content,
      appTarget: row.appTarget,
      status:    row.status,
      order:     row.order ?? 0,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      addToast('Title and content are required.', 'error')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await updateHelpArticle(editing._id, form)
        setArticles((prev) => prev.map((a) => a._id === editing._id ? res.data?.article || res.article : a))
        addToast('Help article updated successfully.', 'success')
      } else {
        const res = await createHelpArticle(form)
        setArticles((prev) => [res.data?.article || res.article, ...prev])
        addToast('Help article created successfully.', 'success')
      }
      setModalOpen(false)
      loadArticles()
    } catch (err) {
      addToast(err.message || 'Failed to save help article.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteHelpArticle(deleteTarget._id)
      setArticles((prev) => prev.filter((a) => a._id !== deleteTarget._id))
      addToast('Help article deleted.', 'success')
    } catch {
      addToast('Failed to delete help article.', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'title', title: 'Title',
      render: (row) => (
        <div className="flex items-center gap-2 max-w-xs">
          <BookOpen size={14} className="text-accentAmber flex-shrink-0" />
          <span className="text-sm font-medium text-textPrimary line-clamp-2">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'appTarget', title: 'App',
      render: (row) => <AppBadge appTarget={row.appTarget} />,
    },
    {
      key: 'status', title: 'Status',
      render: (row) => <StatusBadge status={row.status} activeValue="published" />,
    },
    {
      key: 'views', title: 'Views',
      render: (row) => <span className="text-sm text-textSecondary">{row.views ?? 0}</span>,
    },
    {
      key: 'actions', title: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Select
          options={APP_TARGET_FILTER}
          value={filterApp}
          onChange={(e) => setFilterApp(e.target.value)}
          className="w-40"
        />
        <Button onClick={openAdd}>
          <Plus size={15} /> Add Article
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size={24} className="text-accentAmber animate-spin" />
        </div>
      ) : (
        <Table columns={columns} data={articles} />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Help Article' : 'Add Help Article'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader size={14} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="App Target"
            options={APP_TARGETS}
            value={form.appTarget}
            onChange={(e) => setForm({ ...form, appTarget: e.target.value })}
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. How to Book a Service"
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              placeholder="Write the full article content here…"
              className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
            />
            <Select
              label="Status"
              options={ARTICLE_STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Help Article"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-textSecondary">
          Are you sure you want to delete: <span className="font-semibold text-textPrimary">"{deleteTarget?.title}"</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FAQsHelpCenter() {
  const [activeTab, setActiveTab] = useState('faqs')

  const tabs = [
    { key: 'faqs',  label: 'FAQs',          icon: <HelpCircle size={16} /> },
    { key: 'help',  label: 'Help Articles',  icon: <BookOpen size={16} /> },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'FAQ & Help Center' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">FAQ & Help Center</h1>
          <p className="text-sm text-textMuted mt-1">
            Manage FAQs and help articles for Customer, Worker, and Vendor apps.
          </p>
        </div>
      </div>

      {/* App target info chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {['Customer', 'Worker', 'Vendor'].map((app) => (
          <span
            key={app}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-accentYellowSoft text-accentAmber border border-accentYellow/30"
          >
            {app} App
          </span>
        ))}
        <span className="text-xs text-textMuted">
          — Content is synced automatically with each app.
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-accentAmber text-accentAmber'
                  : 'border-transparent text-textMuted hover:text-textSecondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'faqs' ? <FAQsTab /> : <HelpArticlesTab />}
      </div>
    </div>
  )
}
