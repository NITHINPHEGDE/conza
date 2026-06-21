import { Search, X } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar({ placeholder = 'Search...', onSearch, className = '' }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-64 pl-10 pr-8 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(''); onSearch?.('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
        >
          <X size={14} />
        </button>
      )}
    </form>
  )
}
