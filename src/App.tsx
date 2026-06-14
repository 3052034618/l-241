import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import NewDonation from './pages/NewDonation';
import Inventory from './pages/Inventory';
import Procurement from './pages/Procurement';
import Applications from './pages/Applications';
import WorkOrders from './pages/WorkOrders';
import Logistics from './pages/Logistics';
import Projects from './pages/Projects';
import ApprovalRules from './pages/ApprovalRules';
import Users from './pages/Users';
import { useAuthStore } from './store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, token, checkAuth, isLoading } = useAuthStore();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        await checkAuth();
      }
      setAuthChecked(true);
    };
    verifyAuth();
  }, [token, checkAuth]);

  if (isLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

const ForbiddenPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">403</h1>
        <p className="text-xl text-secondary-600 mb-6">您没有权限访问此页面</p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          返回上一页
        </button>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/403" element={<ForbiddenPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={['project_admin', 'inventory_admin', 'foundation_admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="donations"
          element={
            <ProtectedRoute allowedRoles={['donor', 'project_admin', 'inventory_admin', 'foundation_admin']}>
              <Donations />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="donations/new"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <NewDonation />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={['inventory_admin', 'foundation_admin']}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="procurement"
          element={
            <ProtectedRoute allowedRoles={['inventory_admin', 'foundation_admin']}>
              <Procurement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="applications"
          element={
            <ProtectedRoute allowedRoles={['project_admin', 'foundation_admin']}>
              <Applications />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="workorders"
          element={
            <ProtectedRoute allowedRoles={['project_admin', 'foundation_admin']}>
              <WorkOrders />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="logistics"
          element={
            <ProtectedRoute allowedRoles={['project_admin', 'foundation_admin']}>
              <Logistics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="projects"
          element={
            <ProtectedRoute allowedRoles={['project_admin', 'foundation_admin']}>
              <Projects />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="approval-rules"
          element={
            <ProtectedRoute allowedRoles={['foundation_admin']}>
              <ApprovalRules />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['foundation_admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
