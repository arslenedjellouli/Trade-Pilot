import { useMemo } from 'react'

export default function FileUpload({ files, onChange, label, allowed }) {
  const accept = useMemo(() => allowed?.join(',') ?? '', [allowed])

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-sm text-slate-500">Drop files or choose from your device.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-500">
          {allowed?.join(' ') ?? 'Any'}
        </span>
      </div>
      <input
        type="file"
        accept={accept}
        multiple
        onChange={(event) => onChange(Array.from(event.target.files))}
        className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-600 outline-none transition hover:border-slate-300"
      />
      {files?.length > 0 && (
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          {files.map((file) => (
            <div key={file.name} className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-slate-500">{Math.round(file.size / 1024)} KB</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
