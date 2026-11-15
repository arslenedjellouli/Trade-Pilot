import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/navigation/Layout'
import Dashboard from './pages/Dashboard'
import ProductWizard from './pages/ProductWizard'
import ProductEditor from './pages/ProductEditor'
import Chat from './pages/Chat'
import Login from './pages/Auth/Login'
import ProtectedRoute from './pages/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/products/new"        element={<ProductWizard />} />
            <Route path="/products/:productId" element={<ProductEditor />} />
            <Route path="/chat"                element={<Chat />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
