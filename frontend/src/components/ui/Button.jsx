export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary:   'bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.18)] hover:-translate-y-0.5 hover:bg-blue-700',
    secondary: 'border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:border-blue-200 hover:bg-white',
    danger:    'bg-rose-600 text-white shadow-[0_12px_24px_rgba(225,29,72,0.18)] hover:bg-rose-700',
    ghost:     'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
  }
  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
