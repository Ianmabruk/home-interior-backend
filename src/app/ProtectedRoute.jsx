import { Outlet } from 'react-router-dom'

// TEMP AUTH BYPASS - REMOVE BEFORE PRODUCTION
export const ProtectedRoute = () => {
  return <Outlet />
}
