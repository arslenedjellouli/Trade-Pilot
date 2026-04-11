import { create } from 'zustand'

const initialProducts = [
  {
    id: 'sample-a',
    name: 'EcoMesh Composite Cable',
    description: 'A premium composite cable engineered for low-carbon infrastructure and smart logistics.',
    material: 'Recycled copper, polymer sheath',
    certifications: ['CE', 'RoHS'],
    capacity: '50 kW',
    incoterms: 'DAP',
    markets: ['EU', 'UK'],
    images: [],
    files: [],
    aiContent: {
      description: 'Designed for modern exporters, this cable balances technical performance with sustainability.',
      sellingPoints: ['Low carbon footprint', 'Advanced corrosion resistance', 'Rapid lead times'],
      benefits: ['Shipping-ready', 'Designed for compliance', 'Optimized for export markets'],
    },
    compliance: {
      score: 88,
      warnings: ['Verify packaging claims for hazardous materials'],
      certifications: ['CE', 'RoHS'],
      riskClaims: ['eco-friendly'],
    },
    history: [
      { date: '2026-04-10', note: 'Imported initial product brief' },
      { date: '2026-04-11', note: 'AI-generated product sheet' },
    ],
  },
]

export const useAppStore = create((set, get) => ({
  auth: {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  },
  products: initialProducts,
  selectedProductId: initialProducts[0].id,
  jobs: [
    { id: 'job-1', label: 'Generate catalog', status: 'completed', updatedAt: '2m ago' },
    { id: 'job-2', label: 'AI product sheet', status: 'processing', updatedAt: 'just now' },
    { id: 'job-3', label: 'Compliance review', status: 'pending', updatedAt: '1m ago' },
  ],
  catalogs: [],
  notifications: [],

  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ auth: { token, user } })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ auth: { token: null, user: null } })
  },
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (productId, updates) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId ? { ...product, ...updates } : product,
      ),
    })),
  setSelectedProductId: (productId) => set({ selectedProductId: productId }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJobStatus: (jobId, status) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, status, updatedAt: 'just now' } : job,
      ),
    })),
  addCatalog: (catalog) => set((state) => ({ catalogs: [catalog, ...state.catalogs] })),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
}))
