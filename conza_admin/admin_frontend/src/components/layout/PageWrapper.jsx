import { Outlet } from 'react-router-dom'

export default function PageWrapper({ title, subtitle, children }) {
  return (
    <div className="animate-fadeIn p-6">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h1 className="text-2xl font-bold text-gray-800">{title}</h1>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      {children || <Outlet />}
    </div>
  )
}
