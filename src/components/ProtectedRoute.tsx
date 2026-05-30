import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Only block on loading — which is cleared after getSession + profile fetch
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    // If roles are restricted, we MUST have a profile to verify access
    if (!profile || !allowedRoles.includes(profile.role)) {
      if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
      if (profile?.role === 'staff') return <Navigate to="/staff" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
