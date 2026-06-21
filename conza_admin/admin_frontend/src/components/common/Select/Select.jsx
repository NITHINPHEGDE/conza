export default function Select({ label, options, error, className, ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-textSecondary mb-1.5">{label}</label>}
      <select
        className={`w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all ${error ? 'border-danger' : ''}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
