import { useState } from 'react'
import { Send, Mail } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function EmailNotifications() {
  const [form, setForm] = useState({ subject: '', body: '', target: 'all' })
  const [sending, setSending] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => setSending(false), 1500)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Notifications' }, { label: 'Email' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Email Notifications</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Mail size={20} className="text-purple-700" />
          </div>
          <div>
            <h3 className="font-semibold text-textPrimary">Send Email</h3>
            <p className="text-sm text-textMuted">Send emails to users</p>
          </div>
        </div>

        <Select
          label="Target Audience"
          value={form.target}
          onChange={(e) => setForm({ ...form, target: e.target.value })}
          options={[
            { value: 'all', label: 'All Users' },
            { value: 'customers', label: 'Customers' },
            { value: 'workers', label: 'Workers' },
            { value: 'vendors', label: 'Vendors' },
          ]}
        />
        <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1.5">Email Body</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[200px]"
            required
          />
        </div>
        <Button type="submit" loading={sending} className="w-full">
          <Send size={16} /> Send Email
        </Button>
      </form>
    </div>
  )
}
