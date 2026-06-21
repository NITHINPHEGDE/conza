import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Ban, CheckCircle, Handshake } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockBPs = [
  { id: '1', name: 'Vijay Enterprises', phone: '+91 9876543230', email: 'vijay@enterprises.com', territory: 'Bangalore North', workersOnboarded: 45, vendorsOnboarded: 12, referrals: 89, commission: 45000, status: 'active' },
  { id: '2', name: 'Ramesh Associates', phone: '+91 9876543231', email: 'ramesh@associates.com', territory: 'Bangalore South', workersOnboarded: 32, vendorsOnboarded: 8, referrals: 67, commission: 32000, status: 'active' },
  { id: '3', name: 'Suresh Partners', phone: '+91 9876543232', email: 'suresh@partners.com', territory: 'Bangalore East', workersOnboarded: 28, vendorsOnboarded: 15, referrals: 54, commission: 28000, status: 'suspended' },
]

export default function BPList() {
  const [bps, setBps] = useState(mockBPs)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const filtered = bps.filter((bp) => 
    bp.name.toLowerCase().includes(search.toLowerCase()) || 
    bp.territory.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (bp, action) => {
    setSelected(bp)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'suspend') setBps(bps.map((b) => b.id === selected.id ? { ...b, status: 'suspended' } : b))
    if (modalAction === 'activate') setBps(bps.map((b) => b.id === selected.id ? { ...b, status: 'active' } : b))
    setModalOpen(false)
  }

  const columns = [
    { key: 'name', title: 'Business Partner', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Handshake size={14} className="text-purple-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.name}</p>
          <p className="text-xs text-textMuted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'territory', title: 'Territory' },
    { key: 'workersOnboarded', title: 'Workers' },
    { key: 'vendorsOnboarded', title: 'Vendors' },
    { key: 'referrals', title: 'Referrals' },
    { key: 'commission', title: 'Commission', render: (row) => `₹${row.commission.toLocaleString()}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/business-partners/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        {row.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'suspend')}><Ban size={14} className="text-danger" /></Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'activate')}><CheckCircle size={14} className="text-success" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Business Partners' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Business Partners</h1>
        <SearchBar placeholder="Search partners..." onSearch={setSearch} />
      </div>
      <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/business-partners/${row.id}`} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Partner`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'suspend' ? 'danger' : 'primary'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} <strong>{selected?.name}</strong>?</p>
      </Modal>
    </div>
  )
}
