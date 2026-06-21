import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockOutOfStock = [
  { id: '1', product: 'AAC Blocks 600×200×150', vendor: 'QuickBuild Supply', category: 'Blocks', lastStock: '2024-06-15' },
  { id: '2', product: 'River Sand (Fine)', vendor: 'NatureMats Co.', category: 'Sand', lastStock: '2024-06-18' },
  { id: '3', product: 'Power Generator 5KVA', vendor: 'RentEquip Bangalore', category: 'Power', lastStock: '2024-06-10' },
]

export default function OutOfStock() {
  const columns = [
    { key: 'product', title: 'Product' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'category', title: 'Category' },
    { key: 'lastStock', title: 'Last Stock Date', render: (row) => new Date(row.lastStock).toLocaleDateString() },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status="out_of_stock" label="Out of Stock" /> },
    { key: 'actions', title: 'Actions', render: () => (
      <Button variant="outline" size="sm">Notify Vendor</Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Inventory', path: '/inventory' }, { label: 'Out of Stock' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Out of Stock</h1>
      <Table columns={columns} data={mockOutOfStock} />
    </div>
  )
}
