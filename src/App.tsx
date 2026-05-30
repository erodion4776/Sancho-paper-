import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DebugPanel } from './components/DebugPanel';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { ClientDashboard } from './pages/ClientDashboard';

const RootRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return <Navigate to="/client/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (profile?.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/client/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <DebugPanel />
      <BrowserRouter>
        <Routes>
          {/* Client Portal */}
          <Route path="/client/login" element={<Login />} />
          <Route path="/client/register" element={<Register />} />
          <Route path="/client/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
          </Route>

          {/* Staff Portal */}
          <Route path="/staff/login" element={<Login />} />
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin/login" element={<Login />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
