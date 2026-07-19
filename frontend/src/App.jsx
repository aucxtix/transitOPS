import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import Layout from './components/layout/Layout';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver', 'Customer']}><Dashboard /></RoleRoute></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}><Vehicles /></RoleRoute></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}><Drivers /></RoleRoute></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver']}><Trips /></RoleRoute></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Safety Officer']}><Maintenance /></RoleRoute></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}><Finance /></RoleRoute></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager', 'Safety Officer', 'Financial Analyst']}><Reports /></RoleRoute></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><RoleRoute allowedRoles={['Fleet Manager']}><Settings /></RoleRoute></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
