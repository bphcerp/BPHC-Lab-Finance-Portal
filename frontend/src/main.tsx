import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './index.css'
import LoginPage from './pages/LoginPage'
import DashBoard from './pages/Dashboard'
import Layout from './layouts/Layout'
import ProtectedRoute from './components/ProtectedRoute'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute homePage={true}/>} />
        <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
        <Route path='/dashboard' element={<DashBoard />} />
        </Route>
        <Route path='/login' element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)