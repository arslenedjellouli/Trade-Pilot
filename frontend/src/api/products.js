import axiosClient from './axiosClient'

export const getProducts    = ()       => axiosClient.get('/products/').then(r => r.data)
export const createProduct  = (data)   => axiosClient.post('/products/', data).then(r => r.data)
export const getProduct     = (id)     => axiosClient.get(`/products/${id}/`).then(r => r.data)
export const updateProduct  = (id, d)  => axiosClient.put(`/products/${id}/`, d).then(r => r.data)
export const deleteProduct  = (id)     => axiosClient.delete(`/products/${id}/`).then(r => r.data)
