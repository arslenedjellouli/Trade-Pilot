import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import Button from '../components/ui/Button'
import FileUpload from '../components/ui/FileUpload'
import Card from '../components/ui/Card'
import { generateProductSheet } from '../api/ai'

const marketOptions = ['EU', 'UK', 'Africa', 'Middle East']

export default function ProductWizard() {
  const [step, setStep] = useState(1)
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [selectedMarkets, setSelectedMarkets] = useState(['EU'])
  const [processing, setProcessing] = useState(false)
  const [generatedSheet, setGeneratedSheet] = useState(null)
  const navigate = useNavigate()
  const addProduct = useAppStore((state) => state.addProduct)
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      name: '',
      description: '',
      material: '',
      certifications: '',
      capacity: '',
      incoterms: '',
    },
  })

  const formValues = watch()
  const productPreview = useMemo(
    () => ({
      ...formValues,
      certifications: formValues.certifications.split(',').map((item) => item.trim()).filter(Boolean),
      markets: selectedMarkets,
    }),
    [formValues, selectedMarkets],
  )

  const onSubmit = async (values) => {
    if (step < 4) {
      setStep((current) => current + 1)
      return
    }

    setProcessing(true)
    const payload = {
      name: values.name,
      description: values.description,
      material: values.material,
      certifications: values.certifications.split(',').map((item) => item.trim()).filter(Boolean),
      capacity: values.capacity,
      incoterms: values.incoterms,
      markets: selectedMarkets,
      images: images.map((file) => file.name),
      files: files.map((file) => file.name),
    }

    try {
      const response = await generateProductSheet(null, payload)
      const newProduct = {
        id: `prod-${Date.now()}`,
        ...payload,
        aiContent: {
          description: response.description || 'AI-generated product messaging to support global exports.',
          sellingPoints: response.sellingPoints || ['Export-friendly packaging', 'Targeted compliance', 'Optimized lead time'],
          benefits: response.benefits || ['Ready for EU and UK markets', 'Improved buyer trust', 'Streamlined catalog entry'],
        },
        compliance: {
          score: response.compliance?.score || 85,
          warnings: response.compliance?.warnings || ['Review local labeling requirements'],
          certifications: payload.certifications,
          riskClaims: ['eco-friendly'],
        },
        images: images,
        files: files,
        history: [{ date: new Date().toISOString().slice(0, 10), note: 'Created product and generated AI sheet' }],
      }
      addProduct(newProduct)
      setGeneratedSheet(newProduct.aiContent)
      navigate(`/products/${newProduct.id}`)
    } catch (error) {
      const fallbackProduct = {
        id: `prod-${Date.now()}`,
        ...payload,
        aiContent: {
          description: 'The AI service was unavailable; this product has been saved locally for review.',
          sellingPoints: ['Fallback product entry', 'Review details', 'Retry AI generation'],
          benefits: ['Local draft saved', 'Editable on product page', 'Configurable for catalog generation'],
        },
        compliance: {
          score: 72,
          warnings: ['AI service currently unreachable'],
          certifications: payload.certifications,
          riskClaims: ['claim review needed'],
        },
        images: images,
        files: files,
        history: [{ date: new Date().toISOString().slice(0, 10), note: 'Saved product draft without AI sheet' }],
      }
      addProduct(fallbackProduct)
      navigate(`/products/${fallbackProduct.id}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Product creation wizard</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create a catalog-ready product</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span className={`rounded-full bg-slate-100 px-3 py-2 ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}>Info</span>
          <span className={`rounded-full bg-slate-100 px-3 py-2 ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}>Upload</span>
          <span className={`rounded-full bg-slate-100 px-3 py-2 ${step === 3 ? 'text-slate-900' : 'text-slate-500'}`}>Markets</span>
          <span className={`rounded-full bg-slate-100 px-3 py-2 ${step === 4 ? 'text-slate-900' : 'text-slate-500'}`}>AI</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="space-y-6" title={`Step ${step}`}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block space-y-2 text-sm text-slate-700">
                  Product name
                  <input {...register('name', { required: true })} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="block space-y-2 text-sm text-slate-700">
                  Capacity
                  <input {...register('capacity')} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="md:col-span-2 block space-y-2 text-sm text-slate-700">
                  Description
                  <textarea {...register('description')} rows="4" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="block space-y-2 text-sm text-slate-700">
                  Material
                  <input {...register('material')} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="block space-y-2 text-sm text-slate-700">
                  Certifications
                  <input {...register('certifications')} placeholder="CE, RoHS" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="block space-y-2 text-sm text-slate-700">
                  Incoterms
                  <input {...register('incoterms')} placeholder="DAP, FOB" className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <FileUpload files={images} onChange={setImages} label="Upload images" allowed={['image/*']} />
                <FileUpload files={files} onChange={setFiles} label="Upload supporting files" allowed={['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx']} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-900">Select target markets</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {marketOptions.map((market) => (
                    <button
                      key={market}
                      type="button"
                      onClick={() =>
                        setSelectedMarkets((current) =>
                          current.includes(market)
                            ? current.filter((item) => item !== market)
                            : [...current, market],
                        )
                      }
                      className={`rounded-3xl border px-4 py-3 text-left text-sm transition ${
                        selectedMarkets.includes(market)
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold">{market}</p>
                      <p className="mt-1 text-xs text-slate-500">Optimized compliance and buyer messaging</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <p className="text-sm font-semibold text-slate-900">AI generation</p>
                <p className="text-sm leading-7 text-slate-500">
                  Generate a product sheet using the product details, assets, and market selection.
                </p>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm text-slate-700">Preview</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p><span className="font-semibold">Name:</span> {productPreview.name || '—'}</p>
                    <p><span className="font-semibold">Markets:</span> {productPreview.markets.join(', ') || '—'}</p>
                    <p><span className="font-semibold">Certifications:</span> {productPreview.certifications.join(', ') || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit" disabled={processing}>
                {step < 4 ? 'Continue' : processing ? 'Generating...' : 'Generate Product Sheet'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-5" title="AI product sheet preview" subtitle="Your draft will be editable after generation.">
          <div className="space-y-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">How it works</p>
            <p>
              The AI engine takes your product details, market targets, and content assets to create an export-ready sheet. After generation, you can refine multilingual messaging and compliance notes.
            </p>
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">Current step</p>
              <p className="mt-2 text-sm text-slate-500">{['Product info', 'Upload assets', 'Market selection', 'AI generation'][step - 1]}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
