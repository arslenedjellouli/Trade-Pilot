import { useRef } from 'react'

export default function FileUpload({ files = [], onChange, label = 'Upload file', accept = 'image/*', multiple = false }) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const selected = Array.from(e.target.files)
    onChange(multiple ? selected : selected.slice(0, 1))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    onChange(multiple ? dropped : dropped.slice(0, 1))
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Click or drag &amp; drop</p>
      {files.length > 0 && (
        <ul className="mt-4 space-y-2 text-left">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-inset ring-slate-200/70">
              <span className="font-medium">{f.name}</span>
              <span className="ml-auto text-slate-400">{Math.round(f.size / 1024)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
