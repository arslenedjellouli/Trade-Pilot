export default function Card({ children, title, subtitle, className = '', ...props }) {
  return (
    <div className={`app-panel p-5 ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title    && <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>}
          {subtitle && <p  className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
