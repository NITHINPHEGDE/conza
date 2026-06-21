import { useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function SMSNotifications() {
  const [form, setForm] = useState({ message: '', target: 'all' })
  const [sending, setSending] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => setSending(false), 1500)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Notifications' }, { label: 'SMS' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">SMS Notifications</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <MessageSquare size={20} className="text-green-700" />
          </div>
          <div>
            <h3 className="font-semibold text-textPrimary">Send SMS</h3>
            <p className="text-sm text-textMuted">Send text messages via SMS gateway</p>
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
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1.5">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[120px]"
            maxLength={160}
            required
          />
          <p className="text-xs text-textMuted mt-1">{form.message.length}/160 characters</p>
        </div>
        <Button type="submit" loading={sending} className="w-full">
          <Send size={16} /> Send SMS
        </Button>
      </form>
    </div>
  )
}
