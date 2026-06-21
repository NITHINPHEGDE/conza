import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar/Sidebar'
import Header from '../components/layout/Header/Header'
import Footer from '../components/layout/Footer/Footer'
import PageWrapper from '../components/layout/PageWrapper/PageWrapper'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          <PageWrapper />
        </main>
        <Footer />
      </div>
    </div>
  )
}