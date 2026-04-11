import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAppStore } from '../store/useAppStore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TabGroup from '../components/ui/TabGroup'
import { improveProduct } from '../api/ai'

const languages = [
  { label: 'EN', value: 'en' },
  { label: 'FR', value: 'fr' },
  { label: 'AR', value: 'ar' },
]

const suggestionsTemplate = [
  'Refine the product story for EU buyers.',
  'Add certifications to the summary for compliance trust.',
  'Emphasize durability and shipping efficiency.',
]

export default function ProductEditor() {
  const { productId } = useParams()
  const products = useAppStore((state) => state.products)
  const updateProduct = useAppStore((state) => state.updateProduct)
  const [activeTab, setActiveTab] = useState('en')
  const [suggestions, setSuggestions] = useState([])
  const [isImproving, setIsImproving] = useState(false)
  const product = useMemo(() => products.find((item) => item.id === productId), [products, productId])

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      description: '',
      sellingPoints: '',
      benefits: '',
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        description: product.aiContent.description,
        sellingPoints: product.aiContent.sellingPoints.join('\n'),
        benefits: product.aiContent.benefits.join('\n'),
      })
    }
  }, [product, reset])

  if (!product) {
    return <p className="text-slate-600">Product not found.</p>
  }

  const onSubmit = (values) => {
    updateProduct(productId, {
      aiContent: {
        description: values.description,
        sellingPoints: values.sellingPoints.split('\n').map((item) => item.trim()).filter(Boolean),
        benefits: values.benefits.split('\n').map((item) => item.trim()).filter(Boolean),
      },
      history: [{ date: new Date().toISOString().slice(0, 10), note: 'Updated AI content' }, ...product.history],
    })
  }

  const requestImprovement = async () => {
    setIsImproving(true)
    try {
      const response = await improveProduct(productId)
      setSuggestions(response.suggestions || suggestionsTemplate)
    } catch (error) {
      setSuggestions(suggestionsTemplate)
    } finally {
      setIsImproving(false)
    }
  }

  const watchedValues = watch()

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Product editor</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Edit the AI-generated product story, review ESG compliance, and manage version history.</p>
          </div>
          <Button onClick={requestImprovement} disabled={isImproving}>
            {isImproving ? 'Improving...' : 'Improve my product'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <TabGroup tabs={languages} activeTab={activeTab} onChange={setActiveTab} />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <label className="block text-sm text-slate-700">
                Description
                <textarea {...register('description')} rows="5" className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <label className="block text-sm text-slate-700">
                Selling points
                <textarea {...register('sellingPoints')} rows="3" className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <label className="block text-sm text-slate-700">
                Benefits
                <textarea {...register('benefits')} rows="3" className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Save changes</Button>
                <p className="text-sm text-slate-500">Live preview updates as you edit.</p>
              </div>
            </form>
          </Card>

          <Card title="AI suggestions" subtitle="Accept changes to update the product sheet">
            <div className="space-y-3">
              {suggestions.length ? (
                suggestions.map((suggestion, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">{suggestion}</p>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => setSuggestions((list) => list.filter((_, i) => i !== index))}>
                        Reject
                      </Button>
                      <Button type="button" onClick={() => {
                        const updated = [...suggestions]
                        updated.splice(index, 1)
                        setSuggestions(updated)
                      }}>
                        Accept
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No suggestions available. Trigger the AI assistant again to get proposal edits.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Compliance overview" subtitle="Monitor ESG and certification risk">
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4 rounded-3xl bg-emerald-50 p-4">
                <div>
                  <p className="text-sm text-emerald-700">Compliance score</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{product.compliance.score}%</p>
                </div>
                <div className="rounded-full bg-white px-3 py-2 text-xs uppercase tracking-[0.24em] text-emerald-700">Healthy</div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Certifications</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.compliance.certifications.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-700">{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Warnings</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {product.compliance.warnings.map((warning, index) => (
                    <li key={index} className="rounded-3xl bg-slate-50 p-3">{warning}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Risk claims</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.compliance.riskClaims.map((claim) => (
                    <span key={claim} className="rounded-3xl bg-amber-100 px-3 py-2 text-xs text-amber-700">{claim}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Version history" subtitle="Track editorial updates">
            <div className="space-y-4 text-sm text-slate-600">
              {product.history.map((entry) => (
                <div key={entry.date} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{entry.date}</p>
                  <p className="mt-1">{entry.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
