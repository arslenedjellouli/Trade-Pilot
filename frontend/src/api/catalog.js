import axiosClient from './axiosClient'

export async function generateCatalog(payload) {
  const response = await axiosClient.post('/catalog/generate', payload)
  return response.data
}
