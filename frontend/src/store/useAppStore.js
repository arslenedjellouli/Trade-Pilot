import { create } from 'zustand'
import { getProducts, createProduct, updateProduct } from '../api/products'

export const useAppStore = create((set, get) => ({
  auth: {
    token: localStorage.getItem('token') || null,
    user:  localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  },
  products: [],
  loading:  false,

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

  fetchProducts: async () => {
    set({ loading: true })
    try {
      const products = await getProducts()
      set({ products })
    } catch (error) {
      set({ error: error?.response?.data?.error || 'Unable to load products' })
    } finally {
      set({ loading: false })
    }
  },

  addProduct: async (data) => {
    try {
      const product = await createProduct(data)
      set((s) => ({ products: [product, ...s.products] }))
      return product
    } catch (error) {
      set({ error: error?.response?.data?.error || 'Unable to create product' })
      throw error
    }
  },

  updateProduct: async (id, data) => {
    try {
      const product = await updateProduct(id, data)
      set((s) => ({
        products: s.products.map((p) => (p.id === id ? product : p)),
      }))
      return product
    } catch (error) {
      set({ error: error?.response?.data?.error || 'Unable to update product' })
      throw error
    }
  },
}))
