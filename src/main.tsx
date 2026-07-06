import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { Hub } from './pages/Hub'
import { AdminLayout } from './admin/AdminLayout'
import { Login } from './admin/Login'
import { LinksManager } from './admin/LinksManager'
import { Appearance } from './admin/Appearance'
import { Analytics } from './admin/Analytics'
import { ToastProvider } from './admin/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<LinksManager />} />
            <Route path="appearance" element={<Appearance />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
