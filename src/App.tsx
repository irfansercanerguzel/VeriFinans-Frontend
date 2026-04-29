import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CardDetailsPage from './pages/CardDetailsPage';
import CashExpensesPage from './pages/CashExpensesPage';
import AnalysisPage from './pages/AnalysisPage'; // <--- KANKA: Yeni sayfamız burada!

/**
 * PrivateRoute: Sadece giriş yapmış kullanıcılar girebilir.
 */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

/**
 * PublicRoute: Giriş yapmış kullanıcıyı Login'den Dashboard'a şutlar.
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* GİRİŞ SAYFASI */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* DASHBOARD: Ana ekranımız */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />

        {/* ANALİZ SAYFASI: Harcama raporları ve grafikler */}
        <Route 
          path="/analysis" 
          element={
            <PrivateRoute>
              <AnalysisPage />
            </PrivateRoute>
          } 
        />

        {/* KART DETAYLARI */}
        <Route 
          path="/card-details/:id" 
          element={
            <PrivateRoute>
              <CardDetailsPage />
            </PrivateRoute>
          } 
        />

        {/* NAKİT HARCAMALAR */}
        <Route 
          path="/cash-expenses" 
          element={
            <PrivateRoute>
              <CashExpensesPage />
            </PrivateRoute>
          } 
        />

        {/* 404 / GEÇERSİZ ROTA */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;