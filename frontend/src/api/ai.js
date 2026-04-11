import axiosClient from './axiosClient'

export async function generateProductSheet(productId, data) {
  const response = await axiosClient.post('/ai/generate-product', { productId, ...data })
  return response.data
}

export async function improveProduct(productId) {
  const response = await axiosClient.post('/ai/improve-product', { productId })
  return response.data
}
