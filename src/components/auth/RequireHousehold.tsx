import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingScreen } from '@/components/layout/LoadingScreen'

export function RequireHousehold() {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!profile?.household_id) return <Navigate to="/household-setup" replace />

  return <Outlet />
}
