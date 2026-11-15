export default function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:    'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
    slate:   'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
    green:   'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    emerald: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    blue:    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    sky:     'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    purple:  'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/70',
    yellow:  'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    amber:   'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    red:     'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/70',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  )
}
