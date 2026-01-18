import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '../layout/authLayout';
import Loader from '../components/Loader'; // A simple spinner component
import { useAuth } from '../features/auth/authContext';
import ProtectedLayout from '../layout/protectedLayout';
import PublicLayout from '../layout/publicLayout';
import DashboardLayout from '../layout/DashboardLayout';

// The browser won't download 'Inventory.js' until the user visits /inventory

const Dashboard = lazy(() => import('../pages/auth/dashboard'));
const Inventory = lazy(() => import('../pages/auth/Inventory'));
const Recipes = lazy(() => import('../pages/auth/recipe'));
const Orders = lazy(() => import('../pages/auth/orders'));
const Settings = lazy(() => import('../pages/auth/settings'));
const Login = lazy(() => import('../pages/auth/login'));
const Signup = lazy(() => import('../pages/auth/signup'));
const Landing = lazy(() => import('../pages/auth/landingPage'));



const AppRoutes = () => {
  const { token } = useAuth();
  return (
    // Suspense shows a fallback UI while the lazy chunk is downloading
    <Suspense fallback={<Loader />}>
      <Routes>

        <Route path="/" element={<Landing />} />

        {/* Public Routes */}
        <Route element={<PublicLayout />} >
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
        </Route>

        {/* Protected Routes (Main App) */}
        <Route element={<ProtectedLayout />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
