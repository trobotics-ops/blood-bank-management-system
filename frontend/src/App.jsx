import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Donor pages
import DonorListPage from './pages/donors/DonorListPage';
import DonorSearchPage from './pages/donors/DonorSearchPage';
import DonorRegisterPage from './pages/donors/DonorRegisterPage';
import DonorProfilePage from './pages/donors/DonorProfilePage';

// Inventory pages
import InventoryListPage from './pages/inventory/InventoryListPage';
import AddBloodUnitPage from './pages/inventory/AddBloodUnitPage';
import BloodStockPage from './pages/inventory/BloodStockPage';
import ExpiringUnitsPage from './pages/inventory/ExpiringUnitsPage';

// Request pages
import RequestListPage from './pages/requests/RequestListPage';
import NewRequestPage from './pages/requests/NewRequestPage';

// Camp pages
import CampListPage from './pages/camps/CampListPage';
import CreateCampPage from './pages/camps/CreateCampPage';
import MyCampsPage from './pages/camps/MyCampsPage';

// Notifications
import NotificationsPage from './pages/notifications/NotificationsPage';

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes inside the Layout shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Donors */}
        <Route path="donors" element={<ProtectedRoute allowedRoles={['admin']}><DonorListPage /></ProtectedRoute>} />
        <Route path="donors/search" element={<ProtectedRoute allowedRoles={['admin', 'hospital']}><DonorSearchPage /></ProtectedRoute>} />
        <Route path="donors/register" element={<ProtectedRoute allowedRoles={['donor']}><DonorRegisterPage /></ProtectedRoute>} />
        <Route path="donors/profile" element={<DonorProfilePage />} />

        {/* Inventory */}
        <Route path="inventory" element={<ProtectedRoute allowedRoles={['admin']}><InventoryListPage /></ProtectedRoute>} />
        <Route path="inventory/add" element={<ProtectedRoute allowedRoles={['admin']}><AddBloodUnitPage /></ProtectedRoute>} />
        <Route path="inventory/stock" element={<BloodStockPage />} />
        <Route path="inventory/expiring" element={<ProtectedRoute allowedRoles={['admin']}><ExpiringUnitsPage /></ProtectedRoute>} />

        {/* Requests */}
        <Route path="requests" element={<RequestListPage />} />
        <Route path="requests/new" element={<ProtectedRoute allowedRoles={['hospital']}><NewRequestPage /></ProtectedRoute>} />

        {/* Camps */}
        <Route path="camps" element={<CampListPage />} />
        <Route path="camps/create" element={<ProtectedRoute allowedRoles={['admin']}><CreateCampPage /></ProtectedRoute>} />
        <Route path="camps/my" element={<ProtectedRoute allowedRoles={['donor']}><MyCampsPage /></ProtectedRoute>} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
