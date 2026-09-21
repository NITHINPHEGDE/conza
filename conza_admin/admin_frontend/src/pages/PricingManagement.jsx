import { useState, useEffect } from 'react'
import { DollarSign, Percent, Save, Truck, Package, HardHat, Loader2 } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Breadcrumb from '../components/layout/Breadcrumb'
import pricingConfigService from '../services/pricingConfigService'

// `enabledFields[key]` is the "apply in customer billing" checkbox for each
// pricing entity. Ticked (true) = the customer app shows it and adds it to the
// bill; unticked (false) = it is hidden and never charged.
const initialPricing = {
  labour: {
    platformCommission: 12,
    costRate: 18,
    serviceCharge: 25,
    cancellationFee: 30,
    peakHourMultiplier: 1.5,
    enabledFields: {
      platformCommission: true,
      costRate: true,
      serviceCharge: true,
      cancellationFee: true,
      peakHourMultiplier: true,
    },
  },
  materials: {
    platformCommission: 8,
    gstRate: 18,
    deliveryCharge: 40,
    minOrderValue: 200,
    bulkDiscount: 5,
    vendorCommission: 92,
    enabledFields: {
      platformCommission: true,
      gstRate: true,
      deliveryCharge: true,
      minOrderValue: true,
      bulkDiscount: true,
      vendorCommission: true,
    },
  },
  rentals: {
    platformCommission: 10,
    gstRate: 18,
    securityDepositPercent: 15,
    damageWaiver: 50,
    lateReturnFee: 100,
    cleaningFee: 30,
    enabledFields: {
      platformCommission: true,
      gstRate: true,
      securityDepositPercent: true,
      damageWaiver: true,
      lateReturnFee: true,
      cleaningFee: true,
    },
  },
}

// Entities shown for each category, in display order. `percent` adds the %
// icon, `bounded` limits the input to 0-100.
const FIELD_CONFIG = {
  labour: [
    { key: 'platformCommission', label: 'Platform Commission (%)', percent: true, bounded: true, hint: 'Percentage taken from each transaction' },
    { key: 'costRate', label: 'Cost Rate (%)', percent: true, bounded: true, hint: "Markup applied on top of the worker's base rate" },
    { key: 'serviceCharge', label: 'Service Charge (₹)', hint: 'Minimum charge is set per-category instead — see Categories → Base Price.' },
    { key: 'cancellationFee', label: 'Cancellation Fee (₹)' },
    { key: 'peakHourMultiplier', label: 'Peak Hour Multiplier', step: 0.1 },
  ],
  materials: [
    { key: 'platformCommission', label: 'Platform Commission (%)', percent: true, bounded: true, hint: 'Percentage taken from each transaction' },
    { key: 'gstRate', label: 'GST Rate (%)', percent: true, bounded: true },
    { key: 'deliveryCharge', label: 'Delivery Charge (₹)' },
    { key: 'minOrderValue', label: 'Min Order Value (₹)' },
    { key: 'bulkDiscount', label: 'Bulk Discount (%)' },
    { key: 'vendorCommission', label: 'Vendor Commission (%)', hint: 'Amount vendor receives per sale' },
  ],
  rentals: [
    { key: 'platformCommission', label: 'Platform Commission (%)', percent: true, bounded: true, hint: 'Percentage taken from each transaction' },
    { key: 'gstRate', label: 'GST Rate (%)', percent: true, bounded: true },
    { key: 'securityDepositPercent', label: 'Security Deposit (%)' },
    { key: 'damageWaiver', label: 'Damage Waiver (₹)' },
    { key: 'lateReturnFee', label: 'Late Return Fee (₹)' },
    { key: 'cleaningFee', label: 'Cleaning Fee (₹)' },
  ],
}

export default function PricingManagement() {
  const [pricing, setPricing] = useState(initialPricing)
  const [activeCategory, setActiveCategory] = useState('labour')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await pricingConfigService.getAll()
        if (mounted && res.success && res.pricing) {
          setPricing(prev => {
            const merge = (key) => ({
              ...prev[key],
              ...(res.pricing[key] || {}),
              enabledFields: {
                ...prev[key].enabledFields,
                ...((res.pricing[key] && res.pricing[key].enabledFields) || {}),
              },
            })
            return {
              labour: merge('labour'),
              materials: merge('materials'),
              rentals: merge('rentals'),
            }
          })
        }
      } catch (err) {
        // Keep defaults if the fetch fails; admin can still edit and save.
        console.error('Failed to load pricing config:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

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

  const handleToggle = (field, checked) => {
    setPricing(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        enabledFields: {
          ...prev[activeCategory].enabledFields,
          [field]: checked,
        },
      },
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await pricingConfigService.save(activeCategory, pricing[activeCategory])
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save pricing config:', err)
    } finally {
      setSaving(false)
    }
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
            <div className="flex items-center gap-3">
              {loading && <Loader2 size={16} className="animate-spin text-textMuted" />}
              {saved && <span className="text-sm text-success font-medium">Saved successfully!</span>}
            </div>
          </div>

          <p className="text-sm text-textMuted">
            Tick an entity to apply it in the customer app's billing. Unticked entities are hidden from the
            customer and are not added to the bill.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(FIELD_CONFIG[activeCategory] || []).map((field) => {
              const enabled = current.enabledFields?.[field.key] !== false
              const rawValue = current[field.key]
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-textSecondary flex items-center gap-2">
                      {field.percent && <Percent size={14} />}
                      {field.label}
                    </label>
                    <label
                      className="flex items-center gap-1.5 text-xs text-textMuted cursor-pointer select-none"
                      title="Apply this entity in the customer app billing"
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleToggle(field.key, e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-accentAmber"
                      />
                      Apply
                    </label>
                  </div>
                  <Input
                    type="number"
                    value={Number.isFinite(rawValue) ? rawValue : ''}
                    onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
                    disabled={!enabled}
                    className={enabled ? '' : 'opacity-50'}
                    {...(field.bounded ? { min: 0, max: 100 } : {})}
                    {...(field.step ? { step: field.step } : {})}
                  />
                  {!enabled ? (
                    <p className="text-xs text-danger">Not applied — hidden from customer billing.</p>
                  ) : (
                    field.hint && <p className="text-xs text-textMuted">{field.hint}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Pricing Settings'}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
