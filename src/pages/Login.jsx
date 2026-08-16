import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Mail, 
  Lock, 
  ChevronRight, 
  User, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  GraduationCap,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const errors = {};
    if (!role) errors.role = 'Please select your role';
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      
      // Verify role matches
      const userRoles = data.role ? data.role.split(',').map(r => r.trim()) : [];
      if (!userRoles.includes(role)) {
        setError(`Role mismatch: You logged in as ${data.role}, but selected ${role}.`);
        setLoading(false);
        return;
      }

      localStorage.setItem('activeDashboardRole', role);
      login(data);

      // Handle first login redirect
      if (data.isFirstLogin) {
        navigate('/reset-password');
        return;
      }

      const rolePath = role.toLowerCase().replace(/\s+/g, '-');
      navigate(`/dashboard/${rolePath}`);
    } catch (error) {
      console.error('Login Error:', error);
      let message = 'An unexpected error occurred. Please try again.';
      if (error.response) {
        message = error.response.data.message || 'Login failed. Please check your credentials.';
      } else if (error.request) {
        message = 'The server is not responding. Please check your connection.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (fieldErrors.role) {
      setFieldErrors(prev => ({ ...prev, role: null }));
    }
  };

  const roles = [
    { id: 'member', title: 'Team Member', icon: User, desc: 'View tasks and upload docs' },
    { id: 'leader', title: 'Team Leader', icon: Users, desc: 'Manage team and submissions' },
    { id: 'supervisor', title: 'Supervisor', icon: UserCheck, desc: 'Review and provide feedback' },
    { id: 'hod', title: 'HOD', icon: GraduationCap, desc: 'Department oversight' },
    { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'System-wide management' }
  ];

  return (
    <div className="min-h-screen pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full sm:max-w-xl lg:max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-300">
        
        {/* Left Side - Info */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-blue-600 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <LayoutDashboard className="text-blue-600" size={24} />
              </div>
              <span className="font-bold text-2xl tracking-tight">SmartFYP</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">Welcome to the Future of Project Management</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Access your personalized dashboard and manage your academic projects with ease and efficiency.
            </p>
          </div>

          <div className="relative z-10 pt-12 border-t border-blue-500/30">
            <p className="text-sm text-blue-200">© 2024 SmartFYP Management System. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-6 sm:p-10 lg:p-12 lg:col-span-7 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">Sign In</h2>
            <p className="text-sm text-gray-500">Please select your role and enter your credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl text-sm sm:text-base font-semibold shadow-sm flex items-start gap-3 relative transition-all border-l-4 ${
                  error.includes('mismatch') 
                    ? 'bg-amber-50 text-amber-800 border-amber-400' 
                    : 'bg-red-50 text-red-800 border-red-400'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <AlertCircle size={20} className={error.includes('mismatch') ? 'text-amber-500' : 'text-red-500'} />
                </div>
                <div className="flex-1 pr-6 leading-snug">
                  {error}
                </div>
                <button 
                  type="button" 
                  onClick={() => setError('')}
                  className="absolute right-1.5 top-1.5 p-2 rounded-full hover:bg-black/5 text-gray-500 hover:text-gray-800 transition-all active:scale-95 shadow-sm"
                  aria-label="Close error"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
            {/* Role Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2.5">Select Your Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.title)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left group ${
                      role === r.title 
                        ? 'border-blue-600 bg-blue-50' 
                        : fieldErrors.role ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      role === r.title ? 'bg-blue-600 text-white' : 'bg-gray-150 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      <r.icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-bold text-xs sm:text-sm truncate ${role === r.title ? 'text-blue-900' : 'text-gray-900'}`}>{r.title}</h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{r.desc}</p>
                    </div>
                    {role === r.title && (
                      <div className="ml-auto w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <ChevronRight size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {fieldErrors.role && <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.role}</p>}
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                    }}
                    className={`w-full pl-12 pr-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base border transition-all outline-none ${fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.email}</p>}
              </div>

              <div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                    }}
                    className={`w-full pl-12 pr-12 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base border transition-all outline-none ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.password}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <ChevronRight size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
