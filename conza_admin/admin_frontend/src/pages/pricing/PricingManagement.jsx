import { useState } from 'react'
import { DollarSign, Percent, Save, Truck, Package, HardHat } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialPricing = {
  labour: {
    platformCommission: 12,
    gstRate: 18,
    serviceCharge: 25,
    minBookingFee: 50,
    cancellationFee: 30,
    peakHourMultiplier: 1.5,
  },
  materials: {
    platformCommission: 8,
    gstRate: 18,
    deliveryCharge: 40,
    minOrderValue: 200,
    bulkDiscount: 5,
    vendorCommission: 92,
  },
  rentals: {
    platformCommission: 10,
    gstRate: 18,
    securityDepositPercent: 15,
    damageWaiver: 50,
    lateReturnFee: 100,
    cleaningFee: 30,
  },
}

export default function PricingManagement() {
  const [pricing, setPricing] = useState(initialPricing)
  const [activeCategory, setActiveCategory] = useState('labour')
  const [saved, setSaved] = useState(false)

  const categories = [
    { key: 'labour', label: 'Labour', icon: HardHat },
    { key: 'materials', label: 'Materials', icon: Package },
    { key: 'rentals', label: 'Rentals', icon: Truck },
  ]

  const handleChange = (field, value) => {
    setPricing(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        [field]: value,
      }
    }))
    setSaved(false)
  }

  const handleSave = () => {
    // API call to save pricing
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const current = pricing[activeCategory]

  return (
    <PageWrapper title="Pricing Management" subtitle="Manage commissions and pricing for all categories">
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Pricing Management' }]} />

        {/* Category Tabs */}
        <div className="flex gap-2 bg-surfaceElevated p-1 rounded-lg w-fit">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeCategory === cat.key ? 'bg-accentAmber text-white' : 'text-textSecondary hover:text-textPrimary'}`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            )
          })}
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
              <DollarSign size={20} className="text-accentAmber" />
              {categories.find(c => c.key === activeCategory)?.label} Pricing Settings
            </h2>
            {saved && <span className="text-sm text-success font-medium">Saved successfully!</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Platform Commission */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-textSecondary flex items-center gap-2">
                <Percent size={14} />
                Platform Commission (%)
              </label>
              <Input
                type="number"
                value={current.platformCommission}
                onChange={(e) => handleChange('platformCommission', parseFloat(e.target.value))}
                min={0}
                max={100}
              />
              <p className="text-xs text-textMuted">Percentage taken from each transaction</p>
            </div>

            {/* GST Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-textSecondary flex items-center gap-2">
                <Percent size={14} />
                GST Rate (%)
              </label>
              <Input
                type="number"
                value={current.gstRate}
                onChange={(e) => handleChange('gstRate', parseFloat(e.target.value))}
                min={0}
                max={100}
              />
            </div>

            {/* Category-specific fields */}
            {activeCategory === 'labour' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Service Charge (₹)</label>
                  <Input
                    type="number"
                    value={current.serviceCharge}
                    onChange={(e) => handleChange('serviceCharge', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Min Booking Fee (₹)</label>
                  <Input
                    type="number"
                    value={current.minBookingFee}
                    onChange={(e) => handleChange('minBookingFee', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Cancellation Fee (₹)</label>
                  <Input
                    type="number"
                    value={current.cancellationFee}
                    onChange={(e) => handleChange('cancellationFee', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Peak Hour Multiplier</label>
                  <Input
                    type="number"
                    value={current.peakHourMultiplier}
                    onChange={(e) => handleChange('peakHourMultiplier', parseFloat(e.target.value))}
                    step={0.1}
                  />
                </div>
              </>
            )}

            {activeCategory === 'materials' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Delivery Charge (₹)</label>
                  <Input
                    type="number"
                    value={current.deliveryCharge}
                    onChange={(e) => handleChange('deliveryCharge', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Min Order Value (₹)</label>
                  <Input
                    type="number"
                    value={current.minOrderValue}
                    onChange={(e) => handleChange('minOrderValue', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Bulk Discount (%)</label>
                  <Input
                    type="number"
                    value={current.bulkDiscount}
                    onChange={(e) => handleChange('bulkDiscount', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Vendor Commission (%)</label>
                  <Input
                    type="number"
                    value={current.vendorCommission}
                    onChange={(e) => handleChange('vendorCommission', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-textMuted">Amount vendor receives per sale</p>
                </div>
              </>
            )}

            {activeCategory === 'rentals' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Security Deposit (%)</label>
                  <Input
                    type="number"
                    value={current.securityDepositPercent}
                    onChange={(e) => handleChange('securityDepositPercent', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Damage Waiver (₹)</label>
                  <Input
                    type="number"
                    value={current.damageWaiver}
                    onChange={(e) => handleChange('damageWaiver', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Late Return Fee (₹)</label>
                  <Input
                    type="number"
                    value={current.lateReturnFee}
                    onChange={(e) => handleChange('lateReturnFee', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-textSecondary">Cleaning Fee (₹)</label>
                  <Input
                    type="number"
                    value={current.cleaningFee}
                    onChange={(e) => handleChange('cleaningFee', parseFloat(e.target.value))}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save size={16} />
              Save Pricing Settings
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}