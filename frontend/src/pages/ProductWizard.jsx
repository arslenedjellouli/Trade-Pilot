import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FileUpload from '../components/ui/FileUpload'
import { runOCRPipeline } from '../api/ai'

const LANGS   = [{ v: 'en', l: 'English' }, { v: 'fr', l: 'French' }, { v: 'ar', l: 'Arabic' }, { v: 'es', l: 'Spanish' }]
const MARKETS = ['EU', 'UK', 'Africa', 'Middle East', 'Asia', 'North America']

const EMPTY = {
  name:'', brand:'', reference:'', product_type:'', country_of_origin:'',
  weight:'', volume:'', dimensions:'', format:'', color:'', materials:'',
  category:'', certifications:'', usage_instructions:'', colisage:'',
  price:'', supplier_contact:'', remarks:'', description:'',
  features: ['', '', '', '', ''],
}

const LABELS = {
  name:'Product Name', brand:'Brand', reference:'Reference / SKU',
  product_type:'Product Type', country_of_origin:'Country of Origin',
  weight:'Net Weight', volume:'Volume / Capacity', dimensions:'Dimensions',
  format:'Format', color:'Color', materials:'Materials / Composition',
  category:'Category', certifications:'Certifications',
  usage_instructions:'Usage Instructions', colisage:'Colisage',
  price:'Price', supplier_contact:'Supplier Contact', remarks:'Remarks',
  description:'Product Description',
}

const MULTILINE = new Set(['materials','usage_instructions','supplier_contact','remarks','description'])

const cls = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'

function Field({ k, val, set }) {
  const El   = MULTILINE.has(k) ? 'textarea' : 'input'
  return (
    <label className="block space-y-1 text-sm text-gray-700">
      {LABELS[k]}
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

function StepPill({ n, label, active }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
    }`}>{n}. {label}</span>
  )
}

export default function ProductWizard() {
  const [step,       setStep]       = useState(1)
  const [lang,       setLang]       = useState('en')
  const [images,     setImages]     = useState([])
  const [markets,    setMarkets]    = useState(['EU'])
  const [fields,     setFields]     = useState(EMPTY)
  const [imagePath,  setImagePath]  = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error,      setError]      = useState(null)
  const addProduct = useAppStore(s => s.addProduct)
  const navigate   = useNavigate()

  const setField   = (k, v) => setFields(f => ({ ...f, [k]: v }))
  const setFeature = (i, v) => setFields(f => {
    const ft = [...(f.features || ['','','','',''])]; ft[i] = v
    return { ...f, features: ft }
  })
  const toggleMarket = m => setMarkets(ms => ms.includes(m) ? ms.filter(x => x !== m) : [...ms, m])

  const runPipeline = async () => {
    if (!images.length) { setStep(2); return }
    setProcessing(true); setError(null)
    try {
      const r  = await runOCRPipeline(images[0], lang)
      const pd = r.productData || {}
      setFields({
        name:               pd.name || '',
        brand:              pd.brand || '',
        reference:          pd.reference || '',
        product_type:       pd.product_type || '',
        country_of_origin:  pd.country_of_origin || '',
        weight:             pd.weight || '',
        volume:             pd.volume || '',
        dimensions:         pd.dimensions || '',
        format:             pd.format || '',
        color:              pd.color || '',
        materials:          pd.materials || '',
        category:           pd.category || '',
        certifications:     pd.certifications || '',
        usage_instructions: pd.usage_instructions || '',
        colisage:           pd.colisage || '',
        price:              pd.price || '',
        supplier_contact:   pd.supplier_contact || '',
        remarks:            pd.remarks || '',
        description:        pd.description || '',
        features:           pd.features?.length ? pd.features : ['','','','',''],
      })
      setImagePath(r.imagePath || null)
      setStep(2)
    } catch(e) {
      setError(e?.response?.data?.error || e.message || 'Pipeline failed')
    } finally {
      setProcessing(false)
    }
  }

  const save = async () => {
    const features = (fields.features || []).filter(Boolean)
    const pd       = { ...fields, features }
    const product  = await addProduct({
      name:        pd.name || 'Untitled',
      productData: pd,
      imagePath:   imagePath || '',
      lang,
      markets,
      compliance: { score: 82, warnings:[], certifications: fields.certifications ? fields.certifications.split(',').map(s=>s.trim()).filter(Boolean) : [], riskClaims:[] },
      history:    [{ date: new Date().toISOString().slice(0,10), note: 'Created via AI pipeline' }],
    })
    navigate(`/products/${product.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="app-panel overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="app-heading">Product creation wizard</p>
            <h1 className="app-page-title mt-2">Create a catalog-ready product</h1>
            <p className="app-page-subtitle mt-2 max-w-2xl">The OCR, augmentation, translation, and save flow stays the same. Only the interface is cleaner.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[['1','Image & Language'],['2','Edit Fields'],['3','Markets & Save']].map(([n,l]) => (
              <StepPill key={n} n={n} label={l} active={step === +n} />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card title="Upload product image" subtitle="Upload a file to extract structured product data or skip it and fill the form manually." className="space-y-5">
            <p className="text-sm text-slate-500">
              Upload a product image and the AI will read all text, extract 19 structured fields, and translate them.
              Skip the image to fill the form manually.
            </p>

            <FileUpload files={images} onChange={setImages} label="Product image (optional — JPG / PNG)" accept="image/*" />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Output language</p>
              <div className="flex flex-wrap gap-2">
                {LANGS.map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setLang(v)}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${lang===v ? 'bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

            {processing && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700 space-y-1">
                <p className="font-medium">Pipeline running…</p>
                <p className="text-xs">OCR → Gemini augmentation → Mistral translation. Takes 30–60 s.</p>
              </div>
            )}

            <Button onClick={runPipeline} disabled={processing}>
              {processing ? 'Analysing…' : images.length ? 'Analyse image & extract fields' : 'Skip — fill manually'}
            </Button>
          </Card>

          <Card title="How it works" className="space-y-3 text-sm text-slate-600">
            {[['OCR','NVIDIA vision reads all label text'],
              ['Augment','Gemini extracts 19 structured fields'],
              ['Translate','Mistral converts to your language'],
              ['Edit','Review and correct before saving']].map(([t,d]) => (
              <div key={t} className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
                <p className="font-semibold text-slate-900">{t}</p>
                <p className="mt-0.5 text-slate-500">{d}</p>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Step 2: edit fields */}
      {step === 2 && (
        <Card title="Review & edit extracted fields" subtitle="Correct any field below before saving." className="space-y-8">
          <p className="text-sm text-slate-500">Correct any field below before saving.</p>

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
            <Field k="materials"     val={fields.materials}     set={setField} />
            <Field k="certifications" val={fields.certifications} set={setField} />
          </Section>

          <Section title="Key Features (up to 5)">
            <div className="space-y-2">
              {(fields.features || ['','','','','']).map((f, i) => (
                <label key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="w-4 shrink-0 text-center text-gray-400">{i+1}</span>
                  <input value={f||''} onChange={e => setFeature(i, e.target.value)}
                    placeholder={`Feature ${i+1}`} className={cls + ' flex-1'} />
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

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Continue to Markets</Button>
          </div>
        </Card>
      )}

      {/* Step 3: markets & save */}
      {step === 3 && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card title="Select target markets" subtitle="Pick the markets you want to generate for." className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {MARKETS.map(m => (
                <button key={m} type="button" onClick={() => toggleMarket(m)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${markets.includes(m) ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                  <p className="font-semibold">{m}</p>
                  <p className="mt-0.5 text-xs opacity-60">Export-ready messaging</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={save}>Save product</Button>
            </div>
          </Card>

          <Card title="Summary" className="space-y-3 text-sm">
            {[['Name', fields.name], ['Brand', fields.brand], ['Category', fields.category],
              ['Weight', fields.weight], ['Language', LANGS.find(l=>l.v===lang)?.l], ['Markets', markets.join(', ')]
            ].map(([label, val]) => val ? (
              <div key={label} className="flex justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-200/70">
                <span className="font-medium text-slate-900">{label}</span>
                <span className="text-right text-slate-600">{val}</span>
              </div>
            ) : null)}
          </Card>
        </div>
      )}
    </div>
  )
}
