import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { translateProductData, generatePDF, improveProduct } from '../api/ai'
import { getProduct } from '../api/products'

const LANGS    = [{ v:'en', l:'EN' }, { v:'fr', l:'FR' }, { v:'ar', l:'AR' }, { v:'es', l:'ES' }]
const MULTILINE = new Set(['materials','usage_instructions','supplier_contact','remarks','description'])
const LABELS   = {
  name:'Product Name', brand:'Brand', reference:'Reference / SKU',
  product_type:'Product Type', country_of_origin:'Country of Origin',
  weight:'Net Weight', volume:'Volume / Capacity', dimensions:'Dimensions',
  format:'Format', color:'Color', materials:'Materials / Composition',
  category:'Category', certifications:'Certifications',
  usage_instructions:'Usage Instructions', colisage:'Colisage',
  price:'Price', supplier_contact:'Supplier Contact', remarks:'Remarks',
  description:'Product Description',
}

const cls = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'

function Field({ k, val, set }) {
  const El = MULTILINE.has(k) ? 'textarea' : 'input'
  return (
    <label className="block space-y-1 text-sm text-gray-700">
      {LABELS[k] ?? k}
      <El value={val ?? ''} onChange={e => set(k, e.target.value)}
        rows={MULTILINE.has(k) ? 3 : undefined}
        className={cls + (MULTILINE.has(k) ? ' resize-y' : '')}
        style={{ display:'block', marginTop:4 }} />
    </label>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{title}</h3>
      {children}
    </section>
  )
}

export default function ProductEditor() {
  const { productId } = useParams()
  const products      = useAppStore(s => s.products)
  const updateProduct = useAppStore(s => s.updateProduct)
  const product       = products.find(p => p.id === productId)

  const [activeLang,    setActiveLang]    = useState('en')
  const [fields,        setFields]        = useState({})
  const [suggestions,   setSuggestions]   = useState([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [isImproving,   setIsImproving]   = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState(null)
  const [loadedProduct, setLoadedProduct] = useState(null)

  useEffect(() => {
    if (product || !productId) return
    getProduct(productId)
      .then(setLoadedProduct)
      .catch(e => setError(e?.response?.data?.error || e.message || 'Product not found'))
  }, [product, productId])

  const currentProduct = product || loadedProduct

  useEffect(() => {
    if (!currentProduct) return
    const pd = currentProduct.productData || {}
    setFields({
      name:               pd.name               || currentProduct.name || '',
      brand:              pd.brand              || '',
      reference:          pd.reference          || '',
      product_type:       pd.product_type       || '',
      country_of_origin:  pd.country_of_origin  || '',
      weight:             pd.weight             || '',
      volume:             pd.volume             || '',
      dimensions:         pd.dimensions         || '',
      format:             pd.format             || '',
      color:              pd.color              || '',
      materials:          pd.materials          || '',
      category:           pd.category           || '',
      certifications:     pd.certifications     || '',
      usage_instructions: pd.usage_instructions || '',
      colisage:           pd.colisage           || '',
      price:              pd.price              || '',
      supplier_contact:   pd.supplier_contact   || '',
      remarks:            pd.remarks            || '',
      description:        pd.description        || '',
      features:           pd.features?.length ? pd.features : ['','','','',''],
    })
    setActiveLang(currentProduct.lang || 'en')
  }, [currentProduct])

  if (!currentProduct) return <p className="text-gray-500">{error || 'Loading product…'}</p>

  const setField   = (k, v) => setFields(f => ({ ...f, [k]: v }))
  const setFeature = (i, v) => setFields(f => {
    const ft = [...(f.features || ['','','','',''])]; ft[i] = v
    return { ...f, features: ft }
  })

  const save = () => {
    const features = (fields.features||[]).filter(Boolean)
    const pd = { ...fields, features }
    updateProduct(productId, {
      productData: pd,
      lang: activeLang,
      history: [{ date: new Date().toISOString().slice(0,10), note: `Fields updated (${activeLang.toUpperCase()})` }, ...(currentProduct.history||[])],
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const translate = async (lang) => {
    if (lang === activeLang) return fields
    setActiveLang(lang)
    setIsTranslating(true); setError(null)
    try {
      const r = await translateProductData(fields, lang)
      const t = r.productData || r
      setFields(t)
      return t
    } catch(e) {
      setError(e?.response?.data?.error || e.message || 'Translation failed')
      return fields
    } finally {
      setIsTranslating(false)
    }
  }

  const improve = async () => {
    setIsImproving(true)
    try {
      const r = await improveProduct(productId)
      setSuggestions(r.suggestions || [])
    } catch {
      setSuggestions(['Refine the product story for EU buyers.','Add certifications for trust signals.','Emphasize logistics readiness.'])
    } finally {
      setIsImproving(false)
    }
  }

  const download = async (lang) => {
    setIsDownloading(true); setError(null)
    try {
      let currentFields = fields
      if (lang !== activeLang) currentFields = await translate(lang)
      const features = (currentFields.features||[]).filter(Boolean)
      const blob = await generatePDF({ ...currentFields, features }, currentProduct.imagePath||null, lang)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${currentFields.name || 'product_sheet'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) {
      setError(e?.response?.data?.error || e.message || 'PDF failed')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="app-panel overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="app-heading">Product editor</p>
            <h1 className="app-page-title mt-2">{currentProduct.name || fields.name || 'Untitled'}</h1>
            <p className="app-page-subtitle mt-2">Edit all fields, translate, then download the export PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={improve} disabled={isImproving}>
              {isImproving ? 'Loading…' : 'AI suggestions'}
            </Button>
            <Button onClick={() => download(activeLang)} disabled={isDownloading}>
              {isDownloading ? 'Generating…' : `Download PDF (${activeLang.toUpperCase()})`}
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Lang tabs */}
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                {LANGS.map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => translate(v)} disabled={isTranslating}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeLang===v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {isTranslating && <p className="text-sm font-medium text-blue-600">Translating…</p>}
            </div>
          </Card>

          {/* Fields */}
          <Card className="space-y-8">
            <Section title="Identification">
              <div className="grid gap-4 md:grid-cols-2">
                {['name','brand','reference','product_type','country_of_origin','category'].map(k => (
                  <Field key={k} k={k} val={fields[k]} set={setField} />
                ))}
              </div>
            </Section>

            <Section title="Physical Characteristics">
              <div className="grid gap-4 md:grid-cols-2">
                {['weight','volume','dimensions','format','color'].map(k => (
                  <Field key={k} k={k} val={fields[k]} set={setField} />
                ))}
              </div>
            </Section>

            <Section title="Composition & Certifications">
              <Field k="materials"      val={fields.materials}     set={setField} />
              <Field k="certifications" val={fields.certifications} set={setField} />
            </Section>

            <Section title="Key Features">
              <div className="space-y-2">
                {(fields.features?.length ? fields.features : ['','','','','']).map((f, i) => (
                  <label key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-4 shrink-0 text-center text-gray-400">{i+1}</span>
                    <input value={f||''} onChange={e => setFeature(i, e.target.value)}
                      className={cls + ' flex-1'} placeholder={`Feature ${i+1}`} />
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Product Description">
              <Field k="description" val={fields.description} set={setField} />
            </Section>

            <Section title="Usage & Commercial">
              <div className="grid gap-4 md:grid-cols-2">
                <Field k="usage_instructions" val={fields.usage_instructions} set={setField} />
                <div className="space-y-4">
                  <Field k="colisage" val={fields.colisage} set={setField} />
                  <Field k="price"    val={fields.price}    set={setField} />
                </div>
              </div>
            </Section>

            <Section title="Supplier & Remarks">
              <Field k="supplier_contact" val={fields.supplier_contact} set={setField} />
              <Field k="remarks"          val={fields.remarks}          set={setField} />
            </Section>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save}>Save changes</Button>
              {saved && <p className="text-sm text-blue-600">Saved.</p>}
            </div>
          </Card>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Card title="AI suggestions">
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4">
                    <p className="text-sm text-slate-700">{s}</p>
                    <button onClick={() => setSuggestions(l => l.filter((_,j) => j!==i))}
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* PDF quick export */}
          <Card title="Export PDF" subtitle="Download in any language">
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map(({ v, l }) => (
                <button key={v} onClick={() => download(v)} disabled={isDownloading}
                  className="rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 transition-colors">
                  {l} PDF
                </button>
              ))}
            </div>
          </Card>

          {/* Compliance */}
          <Card title="Compliance">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4 ring-1 ring-inset ring-blue-200/70">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Score</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                    {product.compliance?.score ?? 82}%
                  </p>
                </div>
                <Badge color="green">Healthy</Badge>
              </div>
              {(product.compliance?.certifications||[]).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Certifications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.compliance.certifications.map(c => <Badge key={c}>{c}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* History */}
          <Card title="Version history">
            <div className="space-y-3 text-sm">
              {(product.history||[]).map((e, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{e.date}</p>
                  <p className="mt-0.5 text-slate-500">{e.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
