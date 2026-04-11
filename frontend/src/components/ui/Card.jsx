export default function Card({ className = '', children, title, subtitle }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-soft ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between gap-4"><div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div></div>}
      {children}
    </div>
  )
}
