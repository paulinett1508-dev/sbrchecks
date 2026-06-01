import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { HomePage } from './pages/HomePage';
import { WalletPage } from './pages/WalletPage';
import { PdvListPage } from './pages/admin/PdvListPage';
import { UserListPage } from './pages/admin/UserListPage';
import { AdminWalletPage } from './pages/admin/WalletPage';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Authenticated shell with sidebar */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/admin/pdvs" element={<ProtectedRoute minRole="GERENTE"><PdvListPage /></ProtectedRoute>} />
          <Route path="/admin/carteira" element={<ProtectedRoute minRole="GERENTE"><AdminWalletPage /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute minRole="ADMIN"><UserListPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
