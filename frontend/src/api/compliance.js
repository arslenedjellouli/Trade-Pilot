import axiosClient from './axiosClient'

export async function checkCompliance(productId, payload) {
  const response = await axiosClient.post('/compliance/check', { productId, ...payload })
  return response.data
}
