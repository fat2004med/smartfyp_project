import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Ideas from './pages/Ideas';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';
import TeamMemberDashboard from './pages/dashboards/TeamMemberDashboard';
import TeamLeaderDashboard from './pages/dashboards/TeamLeaderDashboard';
import SupervisorDashboard from './pages/dashboards/SupervisorDashboard';
import HODDashboard from './pages/dashboards/HODDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';


// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  // Enforce first login password change
  if (user.isFirstLogin && window.location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" />;
  }

  const userRoles = user?.role ? user.role.split(',').map(r => r.trim()) : [];
  const hasAllowedRole = allowedRoles ? allowedRoles.some(r => userRoles.includes(r)) : true;
  if (!hasAllowedRole) return <Navigate to="/" />;
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppContent = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-600">
      <ScrollToTop />
      {!isDashboard && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard/team-member/*" element={
            <ProtectedRoute allowedRoles={['Team Member']}>
              <TeamMemberDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/team-leader/*" element={
            <ProtectedRoute allowedRoles={['Team Leader']}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/supervisor/*" element={
            <ProtectedRoute allowedRoles={['Supervisor']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/hod/*" element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HODDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/*" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/projects" element={<Projects />} /> 
        </Routes>
      </main>
      {!isDashboard && !isLogin && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
