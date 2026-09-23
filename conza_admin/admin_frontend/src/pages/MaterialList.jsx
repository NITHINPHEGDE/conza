import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import Button from '../components/common/Button'
import Breadcrumb from '../components/layout/Breadcrumb'
import Tabs from '../components/common/Tabs'
import MaterialsTable from '../components/materials/MaterialsTable'
import CatalogueProducts from './CatalogueProducts'

const TABS = [
  { key: 'catalogue', label: 'Conza Catalogue' },
  { key: 'all', label: 'All Products' },
  { key: 'catalogue_listings', label: 'Catalogue Products' },
  { key: 'custom', label: 'Custom Products' },
]

export default function MaterialList() {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Materials' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Materials & Products</h1>
        <Link to="/materials/categories">
          <Button variant="outline"><LayoutGrid size={16} /> Categories</Button>
        </Link>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'catalogue' && <CatalogueProducts embedded />}
      {activeTab === 'all' && <MaterialsTable source="all" />}
      {activeTab === 'catalogue_listings' && <MaterialsTable source="catalogue" />}
      {activeTab === 'custom' && <MaterialsTable source="custom" />}
    </div>
  )
}
