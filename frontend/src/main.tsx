import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './index.css'
import LoginPage from './pages/LoginPage'
import DashBoard from './pages/Dashboard'
import Layout from './layouts/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ProjectDetails from './pages/ProjectDetails'
import ExpensesPage from './pages/Expenses'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ReimbursementPage from './pages/Reimbursement'
import MembersView from './components/MembersView'
import ExpensesLayout from './layouts/ExpenseLayout'
import ProjectOverview from './pages/ProjectOverview'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CID}>
    <ToastContainer />
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute homePage={true} />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path='/dashboard' element={<DashBoard />} />
            <Route path='/projects' element={<ProjectOverview />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path='/expenses' element={<ExpensesLayout />}>
              <Route index element={<ExpensesPage />}/>
              <Route path='member-wise' element={<MembersView />}/>
            </Route>
            <Route path='/reimbursements' element={<ReimbursementPage />} />
          </Route>
          <Route path='/login' element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
)