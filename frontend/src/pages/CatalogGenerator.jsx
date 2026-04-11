import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { generateCatalog } from '../api/catalog'

export default function CatalogGenerator() {
  const products = useAppStore((state) => state.products)
  const addCatalog = useAppStore((state) => state.addCatalog)
  const [selected, setSelected] = useState([])
  const [buyer, setBuyer] = useState('Standard Buyer')
  const [fileType, setFileType] = useState('PDF catalog')
  const [status, setStatus] = useState(null)
  const [preview, setPreview] = useState(null)

  const selectedProducts = useMemo(
    () => products.filter((product) => selected.includes(product.id)),
    [products, selected],
  )

  const toggleProduct = (productId) => {
    setSelected((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  const onGenerate = async () => {
    setStatus('Generating catalog…')
    const payload = {
      productIds: selected,
      buyer,
      format: fileType,
    }

    try {
      const response = await generateCatalog(payload)
      const catalog = {
        id: `catalog-${Date.now()}`,
        name: `${buyer} catalog`,
        productCount: selectedProducts.length,
        preview: response.preview || `Catalog for ${buyer} containing ${selectedProducts.length} products.`,
        createdAt: new Date().toISOString(),
      }
      addCatalog(catalog)
      setPreview(catalog.preview)
      setStatus('Catalog generated successfully.')
    } catch (error) {
      const fallbackPreview = `Preview: ${selectedProducts.length} products for ${buyer}. Download will be available when backend is ready.`
      addCatalog({
        id: `catalog-${Date.now()}`,
        name: `${buyer} catalog`,
        productCount: selectedProducts.length,
        preview: fallbackPreview,
        createdAt: new Date().toISOString(),
      })
      setPreview(fallbackPreview)
      setStatus('Backend unavailable, fallback preview created.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Catalog generator" subtitle="Select products and create buyer-specific catalogs.">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Select products</p>
                <div className="mt-4 space-y-3">
                  {products.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${
                        selected.includes(product.id)
                          ? 'border-sky-500 bg-sky-50 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.description}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {selected.includes(product.id) ? 'Selected' : 'Add'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-900">Buyer variant</p>
                <select value={buyer} onChange={(event) => setBuyer(event.target.value)} className="mt-3 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
                  <option>Standard Buyer</option>
                  <option>Retail import</option>
                  <option>Industrial distributor</option>
                </select>
                <p className="mt-5 text-sm font-semibold text-slate-900">Format</p>
                <div className="mt-3 space-y-3">
                  {['PDF catalog', 'Buyer-specific version'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFileType(option)}
                      className={`flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left text-sm transition ${
                        fileType === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{option}</span>
                      {fileType === option && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Selected</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">Catalog preview</p>
                <p className="mt-3 text-sm text-slate-600">Buyer: {buyer}</p>
                <p className="mt-1 text-sm text-slate-600">Products: {selectedProducts.length}</p>
                <p className="mt-1 rounded-3xl bg-white p-4 text-sm text-slate-500">{preview || 'Generate a preview to see the catalog summary.'}</p>
              </div>
              <Button type="button" onClick={onGenerate} disabled={!selected.length} className="w-full">
                Generate catalog
              </Button>
              {status && <p className="text-sm text-slate-600">{status}</p>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
