export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            active === tab.key
              ? 'border-accentYellow text-textPrimary'
              : 'border-transparent text-textMuted hover:text-textPrimary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
