import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'motion/react';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, LayoutDashboard, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { token: routeToken } = useParams();
  const token = (searchParams.get('token') || routeToken || '').trim();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // If no token and no user, redirect to login
  useEffect(() => {
    if (!token && !user) {
      navigate('/login');
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const unmet = [];
    if (password.length < 8) unmet.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) unmet.push('one uppercase letter');
    if (!/[a-z]/.test(password)) unmet.push('one lowercase letter');
    if (!/[0-9]/.test(password)) unmet.push('one number');
    if (!/[^A-Za-z0-9\s]/.test(password)) unmet.push('one special character');

    if (unmet.length > 0) {
      setError(`Password must include: ${unmet.join(', ')}.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/reset-password', { 
        newPassword: password,
        email: user?.email,
        token: token || undefined 
      });
      
      setSuccess(true);

      // If they were doing a first-time login update (not a forgot password reset from email)
      // they should stay logged in and go to dashboard
      if (data.user) {
        updateUser(data.user);
        setTimeout(() => {
          const rolesArray = data.user.role ? data.user.role.split(',').map(r => r.trim()) : [];
          const primaryRole = rolesArray[0] || 'Team Member';
          const rolePath = primaryRole.toLowerCase().replace(/\s+/g, '-');
          navigate(`/dashboard/${rolePath}`);
        }, 2000);
      } else {
        // Forgot password case - redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-blue-600" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {token ? 'Reset Password' : 'Update Password'}
            </h2>
            <p className="text-gray-500 mt-2">
              {token 
                ? 'Create a new secure password for your account.' 
                : 'Security requirement: Please set a new password for your first login.'}
            </p>
          </div>

          {success ? (
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h3>
              <p className="text-gray-600">
                Your password has been changed successfully. {token ? 'Redirecting you to login...' : 'Redirecting you to your dashboard...'}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                  {token && (
                    <div className="pt-2">
                      <Link 
                        to="/forgot-password" 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 hover:text-red-950 underline"
                      >
                        <RefreshCw size={12} />
                        Request a new reset link
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="New Password"
                    value={password || ''}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="Confirm New Password"
                    value={confirmPassword || ''}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password Strength Checklist:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Minimum 8 characters', valid: (password || '').length >= 8 },
                    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password || '') },
                    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password || '') },
                    { label: 'One number (0-9)', valid: /[0-9]/.test(password || '') },
                    { label: 'One special character (e.g. !, @, #, $)', valid: /[^A-Za-z0-9\s]/.test(password || '') }
                  ].map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${req.valid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {req.valid ? (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      <span className={req.valid ? 'font-medium text-green-700' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : (token ? 'Reset Password' : 'Update & Continue')}
                {!loading && <ChevronRight size={20} />}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="text-white" size={16} />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">SmartFYP</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
