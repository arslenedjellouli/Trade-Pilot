import axiosClient from './axiosClient'

export async function runOCRPipeline(imageFile, lang = 'en') {
  const form = new FormData()
  form.append('image', imageFile)
  form.append('lang', lang)
  const res = await axiosClient.post('/ai/pipeline/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  })
  return res.data
}

export async function generatePDF(productData, imagePath = null, lang = 'en') {
  const res = await axiosClient.post(
    '/ai/generate-pdf/',
    { productData, imagePath, lang },
    { responseType: 'blob', timeout: 60_000 },
  )
  return res.data
}

export async function translateProductData(productData, lang) {
  const res = await axiosClient.post('/ai/translate/', { productData, lang })
  return res.data
}

export async function improveProduct(productId) {
  const res = await axiosClient.post('/ai/improve/', { productId })
  return res.data
}

export async function generateProductSheet(data) {
  const res = await axiosClient.post('/ai/generate-product/', data)
  return res.data
}
