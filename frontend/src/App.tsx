import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import CreateKitPage from '@/pages/CreateKitPage';
import ResultsPage from '@/pages/ResultsPage';
import KitDetailPage from '@/pages/KitDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SharedKitPage from '@/pages/SharedKitPage';
import PrivateRoute from '@/components/layout/PrivateRoute';
import ToastContainer from '@/components/ui/ToastContainer';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PrivateRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/kits/new" element={<CreateKitPage />} />
            <Route path="/kits/:id/results" element={<ResultsPage />} />
            <Route path="/kits/:id" element={<KitDetailPage />} />
          </Route>
        </Route>
        <Route path="/shared/:token" element={<SharedKitPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
