import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'

const aboutData = {
  title: 'About Conza',
  description: 'Conza is a comprehensive home services platform connecting customers with verified workers, vendors, and business partners. We provide plumbing, electrical, carpentry, cleaning, and many more services with real-time tracking and secure payments.',
  mission: 'To revolutionize home services by making them accessible, reliable, and transparent for every household.',
  vision: 'To become India\'s most trusted home services ecosystem.',
  founded: '2023',
  headquarters: 'Bangalore, India',
  team: 45,
  partners: 1200,
  stats: { customers: '50K+', workers: '8K+', vendors: '1.2K+', cities: '25+' }
}

export default function AboutUs() {
  const [data, setData] = useState(aboutData)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(data)

  const handleSave = () => {
    setData(editForm)
    setIsEditing(false)
  }

  return (
    <PageWrapper title="About Us" subtitle="Manage platform about information">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Platform Overview</h2>
          <Button onClick={() => setIsEditing(true)} variant="primary">Edit Content</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Company Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Founded</span>
                <span className="font-medium">{data.founded}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Headquarters</span>
                <span className="font-medium">{data.headquarters}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Team Size</span>
                <span className="font-medium">{data.team}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Partners</span>
                <span className="font-medium">{data.partners}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Platform Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.stats).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{value}</div>
                  <div className="text-sm text-gray-500 capitalize">{key}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Mission</h3>
            <p className="text-gray-600">{data.mission}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Vision</h3>
            <p className="text-gray-600">{data.vision}</p>
          </div>
        </div>

        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit About Us">
          <div className="space-y-4">
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
            <Input label="Founded" value={editForm.founded} onChange={(e) => setEditForm({...editForm, founded: e.target.value})} />
            <Input label="Headquarters" value={editForm.headquarters} onChange={(e) => setEditForm({...editForm, headquarters: e.target.value})} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mission</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} value={editForm.mission} onChange={(e) => setEditForm({...editForm, mission: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Vision</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} value={editForm.vision} onChange={(e) => setEditForm({...editForm, vision: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setIsEditing(false)} variant="secondary">Cancel</Button>
              <Button onClick={handleSave} variant="primary">Save Changes</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}
