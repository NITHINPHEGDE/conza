import { Routes, Route } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { Toaster } from './components/common/Toast/Toaster'

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  )
}