import { SearchX } from 'lucide-react'

export default function EmptyState({ title = 'No results found', description = 'Try adjusting your search or filters.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-surfaceElevated flex items-center justify-center mb-4">
        <SearchX size={28} className="text-textMuted" />
      </div>
      <h3 className="text-lg font-semibold text-textPrimary mb-1">{title}</h3>
      <p className="text-sm text-textMuted max-w-sm">{description}</p>
    </div>
  )
}
