import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-textMuted mb-4">
      <Link to="/" className="hover:text-textPrimary transition-colors">
        <Home size={16} />
      </Link>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <ChevronRight size={14} />
          {item.path ? (
            <Link to={item.path} className="hover:text-textPrimary transition-colors">{item.label}</Link>
          ) : (
            <span className="text-textPrimary font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
