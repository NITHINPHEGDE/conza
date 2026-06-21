import { Outlet } from 'react-router-dom'

export default function PageWrapper() {
  return (
    <div className="animate-fadeIn">
      <Outlet />
    </div>
  )
}
