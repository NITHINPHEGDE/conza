import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../Button/Button'

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visiblePages = pages.slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  )

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surfaceElevated/50 rounded-b-xl">
      <p className="text-sm text-textMuted">
        Showing page {currentPage} of {totalPages} ({totalItems} items)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </Button>
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(page)}
            className="min-w-[36px]"
          >
            {page}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
