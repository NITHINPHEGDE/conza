import WorkerMap from '../../components/maps/WorkerMap/WorkerMap'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerTracking() {
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Workers', path: '/workers' }, { label: 'Live Tracking' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Live Worker Tracking</h1>
      <div className="bg-surface rounded-xl border border-border p-4">
        <WorkerMap height="600px" />
      </div>
    </div>
  )
}
