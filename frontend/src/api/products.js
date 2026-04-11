import axiosClient from './axiosClient'

export async function fetchProducts() {
  const response = await axiosClient.get('/products')
  return response.data
}

export async function createProduct(payload) {
  const response = await axiosClient.post('/products', payload)
  return response.data
}

export async function updateProduct(productId, payload) {
  const response = await axiosClient.put(`/products/${productId}`, payload)
  return response.data
}

export async function fetchProductById(productId) {
  const response = await axiosClient.get(`/products/${productId}`)
  return response.data
}
