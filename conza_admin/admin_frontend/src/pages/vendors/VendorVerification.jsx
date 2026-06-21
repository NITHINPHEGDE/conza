import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Eye, Store } from 'lucide-react'
import useVendorStore from '../../store/vendors/useVendorStore'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorVerification() {
  const { vendors, updateVendorStatus } = useVendorStore()
  const pendingVendors = vendors.filter((v) => v.status === 'pending_verification')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const handleAction = (vendor, action) => {
    setSelectedVendor(vendor)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'approve') updateVendorStatus(selectedVendor.id, 'active')
    if (modalAction === 'reject') updateVendorStatus(selectedVendor.id, 'rejected')
    setModalOpen(false)
  }

  const columns = [
    { key: 'shopName', title: 'Vendor', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Store size={14} className="text-green-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.shopName}</p>
          <p className="text-xs text-textMuted">{row.name}</p>
        </div>
      </div>
    )},
    { key: 'sellerType', title: 'Type' },
    { key: 'city', title: 'City' },
    { key: 'gstNumber', title: 'GST' },
    { key: 'licenseNo', title: 'License' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/vendors/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'approve')}><CheckCircle size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'reject')}><XCircle size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Vendors', path: '/vendors' }, { label: 'Verification' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Vendor Verification</h1>
      <Table columns={columns} data={pendingVendors} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'approve' ? 'Approve' : 'Reject'} Vendor`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'approve' ? 'primary' : 'danger'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} <strong>{selectedVendor?.shopName}</strong>?</p>
      </Modal>
    </div>
  )
}
