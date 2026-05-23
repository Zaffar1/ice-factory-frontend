import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';

// Public Pages
const LandingPage = lazy(() => import('./pages/website/LandingPage'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));

// Admin Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const Orders = lazy(() => import('./pages/orders/Orders'));
const Production = lazy(() => import('./pages/production/Production'));
const Inventory = lazy(() => import('./pages/inventory/Inventory'));
const Payments = lazy(() => import('./pages/payments/Payments'));
const Expenses = lazy(() => import('./pages/expenses/Expenses'));
const Reports = lazy(() => import('./pages/reports/Reports'));

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const FallbackLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-light">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<FallbackLoader />}>
      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="production" element={<Production />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="payments" element={<Payments />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
