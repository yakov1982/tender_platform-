import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import TendersList from './pages/TendersList';
import TenderDetail from './pages/TenderDetail';
import MyBids from './pages/MyBids';

import AdminLayout from './components/AdminLayout';
import AdminTenders from './pages/admin/AdminTenders';
import AdminTenderEdit from './pages/admin/AdminTenderEdit';
import AdminBids from './pages/admin/AdminBids';
import AdminUsers from './pages/admin/AdminUsers';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TendersList />} />
        <Route path="tenders/:id" element={<TenderDetail />} />
        <Route path="my-bids" element={<MyBids />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/tenders" replace />} />
        <Route path="tenders" element={<AdminTenders />} />
        <Route path="tenders/new" element={<AdminTenderEdit />} />
        <Route path="tenders/:id/edit" element={<AdminTenderEdit />} />
        <Route path="tenders/:id/bids" element={<AdminBids />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
