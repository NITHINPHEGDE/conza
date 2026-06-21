import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const reportTypes = [
  { id: 'daily', label: 'Daily Report', description: 'Daily revenue, bookings, and orders summary' },
  { id: 'weekly', label: 'Weekly Report', description: 'Weekly performance metrics and trends' },
  { id: 'monthly', label: 'Monthly Report', description: 'Monthly comprehensive business report' },
  { id: 'yearly', label: 'Yearly Report', description: 'Annual financial and operational summary' },
]

export default function Reports() {
  const [generating, setGenerating] = useState(null)

  const handleGenerate = (id) => {
    setGenerating(id)
    setTimeout(() => setGenerating(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Finance', path: '/finance/revenue' }, { label: 'Reports' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Financial Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-surface rounded-xl border border-border p-6 card-shadow hover:card-shadow-hover transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-accentYellowSoft flex items-center justify-center shrink-0">
                <FileText size={24} className="text-accentAmber" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-textPrimary">{report.label}</h3>
                <p className="text-sm text-textMuted mt-1">{report.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  loading={generating === report.id}
                  onClick={() => handleGenerate(report.id)}
                >
                  <Download size={14} /> Generate
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
