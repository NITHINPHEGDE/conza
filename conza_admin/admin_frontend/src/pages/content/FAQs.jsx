import { useState } from 'react'
import { Edit, Trash2, Plus, HelpCircle } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import SearchBar from '../../components/common/SearchBar/SearchBar'

const mockFAQs = [
  { id: '1', question: 'How do I book a worker?', answer: 'Open the app, select a category, choose workers, and confirm booking.', category: 'General', status: 'active' },
  { id: '2', question: 'What is the cancellation policy?', answer: 'You can cancel within 15 minutes of booking without charges.', category: 'Booking', status: 'active' },
  { id: '3', question: 'How do I become a vendor?', answer: 'Register as a vendor, submit documents, and wait for verification.', category: 'Vendor', status: 'active' },
]

const categories = ['All', 'General', 'Booking', 'Vendor', 'Customer', 'Worker', 'Business Partner']

export default function FAQs() {
  const [faqs, setFaqs] = useState(mockFAQs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [form, setForm] = useState({ question: '', answer: '', category: 'General' })

  const handleSave = () => {
    if (editing) {
      setFaqs(faqs.map((f) => f.id === editing.id ? { ...f, ...form } : f))
    } else {
      setFaqs([...faqs, { ...form, id: String(faqs.length + 1), status: 'active' }])
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ question: '', answer: '', category: 'General' })
  }

  const handleDelete = (id) => {
    setFaqs(faqs.filter((f) => f.id !== id))
  }

  const filtered = faqs.filter(f => {
    const matchSearch = f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || f.category === activeCategory
    return matchSearch && matchCat
  })

  const columns = [
    { key: 'question', title: 'Question', render: (row) => (
      <div className="flex items-center gap-2">
        <HelpCircle size={14} className="text-accentAmber" />
        <span className="font-medium text-textPrimary">{row.question}</span>
      </div>
    )},
    { key: 'category', title: 'Category' },
    { key: 'status', title: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setEditing(row); setForm({ question: row.question, answer: row.answer, category: row.category }); setModalOpen(true); }}><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'FAQs' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">FAQs</h1>
        <Button onClick={() => { setEditing(null); setForm({ question: '', answer: '', category: 'General' }); setModalOpen(true); }}><Plus size={16} /> Add FAQ</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search FAQs..." />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors ${
              activeCategory === cat
                ? 'bg-accentYellow text-accentAmber border-accentAmber font-medium'
                : 'bg-surface text-textSecondary border-border hover:bg-surfaceElevated'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Table columns={columns} data={filtered} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit FAQ' : 'Add FAQ'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Answer</label>
            <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[100px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all"
            >
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
