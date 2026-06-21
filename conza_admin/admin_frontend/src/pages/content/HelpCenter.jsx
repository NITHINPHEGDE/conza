import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'

const initialArticles = [
  { id: 1, title: 'How to Book a Service', category: 'Customers', status: 'published', views: 1240 },
  { id: 2, title: 'Worker Registration Guide', category: 'Workers', status: 'published', views: 890 },
  { id: 3, title: 'Vendor Onboarding Process', category: 'Vendors', status: 'published', views: 650 },
  { id: 4, title: 'Payment & Refund Policy', category: 'Payments', status: 'published', views: 2100 },
  { id: 5, title: 'BP Commission Structure', category: 'Business Partners', status: 'draft', views: 0 },
  { id: 6, title: 'How to Track Your Order', category: 'Orders', status: 'published', views: 1560 },
  { id: 7, title: 'Understanding Service Charges', category: 'Customers', status: 'published', views: 780 },
  { id: 8, title: 'Worker Safety Guidelines', category: 'Workers', status: 'draft', views: 0 }
]

const categories = ['All', 'Customers', 'Workers', 'Vendors', 'Payments', 'Orders', 'Business Partners']

export default function HelpCenter() {
  const [articles, setArticles] = useState(initialArticles)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editArticle, setEditArticle] = useState(null)

  const filtered = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || a.category === activeCategory
    return matchSearch && matchCat
  })

  const handleSave = (article) => {
    if (article.id) {
      setArticles(articles.map(a => a.id === article.id ? article : a))
    } else {
      setArticles([...articles, { ...article, id: articles.length + 1, views: 0 }])
    }
    setIsModalOpen(false)
    setEditArticle(null)
  }

  const handleDelete = (id) => {
    setArticles(articles.filter(a => a.id !== id))
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'views', label: 'Views' },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { setEditArticle(row); setIsModalOpen(true) }}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}
  ]

  return (
    <PageWrapper title="Help Center" subtitle="Manage help articles and guides">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search articles..." />
          <Button onClick={() => { setEditArticle(null); setIsModalOpen(true) }}>Add Article</Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>

        <Table columns={columns} data={filtered} />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editArticle ? 'Edit Article' : 'Add Article'}>
          <ArticleForm article={editArticle} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </PageWrapper>
  )
}

function ArticleForm({ article, onSave, onCancel }) {
  const [form, setForm] = useState(article || { title: '', category: 'Customers', status: 'draft', content: '' })

  return (
    <div className="space-y-4">
      <Input label="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
          {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Content</label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={6} value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="Article content..." />
      </div>
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button onClick={() => onSave(form)} variant="primary">Save</Button>
      </div>
    </div>
  )
}
