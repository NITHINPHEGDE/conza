import { useState } from 'react'
import { Save, FileText } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialTerms = {
  Customers: `CUSTOMER TERMS AND CONDITIONS

1. Acceptance of Terms
By booking a service on Conza, you agree to these Customer Terms.

2. Booking Services
Customers must provide accurate details and fulfill payment upon completion.

3. Cancellations
Free cancellations are valid within 15 minutes of scheduling.

4. Dispute Resolution
Any disputes shall be resolved through arbitration as per Indian law.`,
  Workers: `WORKER TERMS AND CONDITIONS

1. Service Standards
Workers must maintain professional behavior and perform verified services.

2. Platform Commissions
Conza deducts a base platform commission fee from all successfully completed jobs.

3. Payout Cycles
Worker earnings are dispatched weekly after deducting taxes and fees.

4. Term Termination
Violation of safety guidelines or customer terms results in immediate account suspension.`,
  Vendors: `VENDOR TERMS AND CONDITIONS

1. Product Listings
Vendors must supply genuine products matching catalog descriptions.

2. Order Fulfillment
All material orders must be dispatched within the agreed SLA.

3. Return Policy
Faulty or incorrect items must be refunded or replaced immediately.

4. Pricing Rules
Vendors agree to maintain fair market value prices without unfair markups.`,
  'Business Partners': `BUSINESS PARTNER TERMS AND CONDITIONS

1. Territory Rights
Partners are granted exclusive rights within approved geographical boundaries.

2. Referral Commission
Commissions are calculated monthly based on verified platform growth.

3. Term Termination
Violation of partner codes of conduct results in revocation of partner status.

4. Brand Representation
Partners must follow strict Conza brand guidelines when operating.`
}

const categories = ['Customers', 'Workers', 'Vendors', 'Business Partners']

export default function Terms() {
  const [activeTab, setActiveTab] = useState('Customers')
  const [terms, setTerms] = useState(initialTerms)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  const handleContentChange = (val) => {
    setTerms(prev => ({
      ...prev,
      [activeTab]: val
    }))
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'Terms' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Terms & Conditions</h1>
        <Button onClick={handleSave} loading={saving}><Save size={16} /> Save</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors ${
              activeTab === cat
                ? 'bg-accentYellow text-accentAmber border-accentAmber font-medium'
                : 'bg-surface text-textSecondary border-border hover:bg-surfaceElevated'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={20} className="text-accentAmber" />
          <h3 className="font-semibold text-textPrimary">Edit Terms & Conditions ({activeTab})</h3>
        </div>
        <textarea
          value={terms[activeTab]}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[500px] font-mono leading-relaxed"
        />
      </div>
    </div>
  )
}
