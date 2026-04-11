import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import ProductWizard from './pages/ProductWizard'
import ProductEditor from './pages/ProductEditor'
import CatalogGenerator from './pages/CatalogGenerator'
import JobStatus from './pages/JobStatus'
import NotFound from './pages/NotFound'
import ProtectedRoute from './pages/ProtectedRoute'
import Layout from './components/navigation/Layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products/new" element={<ProductWizard />} />
            <Route path="products/:productId" element={<ProductEditor />} />
            <Route path="catalogs" element={<CatalogGenerator />} />
            <Route path="jobs" element={<JobStatus />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
