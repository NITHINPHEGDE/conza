import { useState } from 'react'
import { Save, FileText } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialTerms = `TERMS AND CONDITIONS

1. Acceptance of Terms
By accessing and using the Conza platform, you agree to be bound by these Terms and Conditions.

2. Services
Conza provides a marketplace connecting customers with workers, vendors, and business partners for construction-related services and materials.

3. User Responsibilities
Users must provide accurate information and comply with all applicable laws.

4. Payments
All payments are processed through secure payment gateways. Cash payments are also accepted for certain services.

5. Cancellations
Bookings can be cancelled within 15 minutes without charges. After that, cancellation fees may apply.

6. Dispute Resolution
Any disputes shall be resolved through arbitration as per Indian law.

7. Limitation of Liability
Conza is not liable for any direct, indirect, or consequential damages arising from the use of our platform.`

export default function Terms() {
  const [content, setContent] = useState(initialTerms)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'Terms' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Terms & Conditions</h1>
        <Button onClick={handleSave} loading={saving}><Save size={16} /> Save</Button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={20} className="text-accentAmber" />
          <h3 className="font-semibold text-textPrimary">Edit Terms & Conditions</h3>
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
