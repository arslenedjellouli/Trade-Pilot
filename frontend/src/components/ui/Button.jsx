export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
