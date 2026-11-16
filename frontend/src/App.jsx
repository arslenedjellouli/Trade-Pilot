import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/navigation/Layout'
import Dashboard from './pages/Dashboard'
import ProductWizard from './pages/ProductWizard'
import ProductEditor from './pages/ProductEditor'
import Chat from './pages/Chat'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                    element={<Dashboard />} />
          <Route path="/products/new"        element={<ProductWizard />} />
          <Route path="/products/:productId" element={<ProductEditor />} />
          <Route path="/chat"                element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
