import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import StaffLayout from './layouts/StaffLayout';
import TransportationLayout from './layouts/TransportationLayout';
import AppRoutes from './routes/AppRoutes';
import StaffRoutes from './routes/StaffRoutes';
import TransportRoutes from './routes/TransportRoutes';
import RoleSelectPage from './pages/RoleSelectPage';
import LoginPage from './pages/LoginPage';

// Picks the right layout + route tree for whoever is signed in. Staff and
// Transportation never render MainLayout or any of its ~70 Admin routes —
// they get their own small, separate trees entirely.
const AuthenticatedApp = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/role" replace />;
  }

  if (user.role === 'STAFF') {
    return (
      <StaffLayout>
        <StaffRoutes />
      </StaffLayout>
    );
  }

  if (user.role === 'TRANSPORTATION') {
    return (
      <TransportationLayout>
        <TransportRoutes />
      </TransportationLayout>
    );
  }

  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/role" element={<RoleSelectPage />} />
          <Route path="/login" element={<Navigate to="/role" replace />} />
          <Route path="/login/admin" element={<LoginPage role="ADMIN" />} />
          <Route path="/login/staff" element={<LoginPage role="STAFF" />} />
          <Route path="/login/transportation" element={<LoginPage role="TRANSPORTATION" />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
