import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ErrorBoundary from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ForecastPage from './pages/ForecastPage';
import TransactionsPage from './pages/TransactionsPage';
import AssistantPage from './pages/AssistantPage';
import UsersPage from './pages/UsersPage';
import { CurrencyProvider } from './context/CurrencyContext';

const ROUTES = [
  { path: '/', title: 'Dashboard', sub: 'Real-time financial intelligence overview', el: <DashboardPage /> },
  { path: '/analytics', title: 'Analytics', sub: 'Income, expense trends & category breakdown', el: <AnalyticsPage /> },
  { path: '/forecast', title: 'Forecast & Risk', sub: 'AI-powered cash flow projections & risk score', el: <ForecastPage /> },
  { path: '/transactions', title: 'Transactions', sub: 'Transaction ledger with upload & filtering', el: <TransactionsPage /> },
  { path: '/assistant', title: 'AI Assistant', sub: 'Conversational financial intelligence engine', el: <AssistantPage /> },
  { path: '/users', title: 'User Management', sub: 'Manage users, roles, and access control', el: <UsersPage /> },
];

function ProtectedLayout() {
  const token = localStorage.getItem('finsight_token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          {ROUTES.map(r => (
            <Route key={r.path} path={r.path} element={
              <>
                <Header title={r.title} subtitle={r.sub} />
                <div className="page-body">{r.el}</div>
              </>
            } />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <CurrencyProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </CurrencyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
