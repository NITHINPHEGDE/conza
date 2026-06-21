import { useState } from 'react'
import { Save, Shield } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialPrivacy = `PRIVACY POLICY

1. Information We Collect
We collect personal information including name, phone number, email, and location data to provide our services.

2. How We Use Information
Your information is used to facilitate bookings, process payments, and improve our services.

3. Data Sharing
We do not sell your personal information. Data is shared only with service providers necessary to fulfill your requests.

4. Security
We implement industry-standard security measures to protect your data.

5. Cookies
We use cookies to enhance user experience and analyze platform usage.

6. Your Rights
You have the right to access, correct, or delete your personal information.

7. Contact
For privacy concerns, contact privacy@conza.in`

export default function Privacy() {
  const [content, setContent] = useState(initialPrivacy)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'Privacy' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Privacy Policy</h1>
        <Button onClick={handleSave} loading={saving}><Save size={16} /> Save</Button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-accentAmber" />
          <h3 className="font-semibold text-textPrimary">Edit Privacy Policy</h3>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[500px] font-mono leading-relaxed"
        />
      </div>
    </div>
  )
}
