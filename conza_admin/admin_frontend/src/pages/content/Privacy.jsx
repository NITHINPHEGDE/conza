import { useState } from 'react'
import { Save, Shield } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialPrivacy = {
  Customers: `CUSTOMER PRIVACY POLICY

1. Information We Collect
We collect personal information including name, phone number, email, and location data to provide our services to customers.

2. How We Use Information
Your information is used to facilitate bookings, process payments, and improve customer experience.

3. Data Sharing
We do not sell customer personal information. Data is shared only with service providers necessary to fulfill your requests.

4. Security
We implement industry-standard security measures to protect customer data.

5. Contact
For privacy concerns, contact customer.privacy@conza.in`,
  Workers: `WORKER PRIVACY POLICY

1. Information We Collect
We collect professional profile data, verification details, and real-time tracking data from workers.

2. How We Use Information
Worker data is used to match with bookings, verify eligibility, and calculate earnings.

3. Data Sharing
Worker profiles and ratings are shown to customers during booking.

4. Security
We implement strict background checks and secure handling of verification documents.

5. Contact
For privacy concerns, contact worker.privacy@conza.in`,
  Vendors: `VENDOR PRIVACY POLICY

1. Information We Collect
We collect business registration, catalog lists, and inventory details from vendors.

2. How We Use Information
Vendor data is used to list products, manage catalog orders, and issue payouts.

3. Data Sharing
Products and prices are displayed on the marketplace catalog.

4. Security
Payment accounts and inventory management details are encrypted.

5. Contact
For privacy concerns, contact vendor.privacy@conza.in`,
  'Business Partners': `BUSINESS PARTNER PRIVACY POLICY

1. Information We Collect
We collect partner business credentials, referral records, and financial details.

2. How We Use Information
To track commission points, verify territory claims, and process monthly payouts.

3. Data Sharing
Information is strictly confidential between the partner and Conza.

4. Security
Financial metrics and territory mapping details are kept highly secure.

5. Contact
For privacy concerns, contact bp.privacy@conza.in`
}

const categories = ['Customers', 'Workers', 'Vendors', 'Business Partners']

export default function Privacy() {
  const [activeTab, setActiveTab] = useState('Customers')
  const [policies, setPolicies] = useState(initialPrivacy)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  const handleContentChange = (val) => {
    setPolicies(prev => ({
      ...prev,
      [activeTab]: val
    }))
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Content' }, { label: 'Privacy' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Privacy Policy</h1>
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
          <Shield size={20} className="text-accentAmber" />
          <h3 className="font-semibold text-textPrimary">Edit Privacy Policy ({activeTab})</h3>
        </div>
        <textarea
          value={policies[activeTab]}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all min-h-[500px] font-mono leading-relaxed"
        />
      </div>
    </div>
  )
}
