import { useState } from 'react'
import LiveMap from '../../components/maps/LiveMap/LiveMap'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function LiveTracking() {
  const [filters, setFilters] = useState({ showWorkers: true, showVendors: true, showJobs: true })

  return (
    <div className="space-y-4 h-[calc(100vh-120px)]">
      <Breadcrumb items={[{ label: 'Maps' }, { label: 'Live Tracking' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Live Tracking</h1>
        <div className="flex gap-2">
          <Button
            variant={filters.showWorkers ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, showWorkers: !filters.showWorkers })}
          >
            Workers
          </Button>
          <Button
            variant={filters.showVendors ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, showVendors: !filters.showVendors })}
          >
            Vendors
          </Button>
          <Button
            variant={filters.showJobs ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, showJobs: !filters.showJobs })}
          >
            Active Jobs
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
        <LiveMap filters={filters} />
      </div>
    </div>
  )
}
