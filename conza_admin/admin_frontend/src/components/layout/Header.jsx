import { Search, Bell, User } from 'lucide-react'
import SearchBar from '../../common/SearchBar/SearchBar'

export default function Header({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <SearchBar placeholder="Search anything..." />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-textSecondary hover:text-textPrimary transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accentYellow flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-textPrimary">Super Admin</p>
            <p className="text-xs text-textMuted">admin@conza.in</p>
          </div>
        </div>
      </div>
    </header>
  )
}
