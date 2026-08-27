import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, LayoutDashboard, ArrowLeft, ExternalLink, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessData(null);
    try {
      const response = await api.post('/api/auth/forgot-password', { 
        email: email.trim(), 
        origin: window.location.origin 
      });
      setSuccessData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please check your email and try again.');
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
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to Login</span>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-blue-600" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
            <p className="text-gray-500 mt-2">
              Enter your registered email address to receive your secure password reset link.
            </p>
          </div>

          {successData ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="text-green-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {successData.emailSent ? 'Reset Email Dispatched!' : 'Reset Link Ready'}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed px-2 mb-6">
                {successData.emailSent ? (
                  <>
                    We have dispatched a password reset link to <strong className="text-gray-900">{email}</strong>. 
                    Please check your inbox and spam folder.
                  </>
                ) : (
                  <>
                    A secure password reset link has been generated for <strong className="text-gray-900">{email}</strong>.
                  </>
                )}
              </p>

              {/* Direct Reset Action */}
              {successData.token && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-left space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs uppercase tracking-wider">
                    <KeyRound size={16} />
                    <span>Instant Password Reset</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-normal">
                    You can reset your password immediately using the link below:
                  </p>
                  <button
                    onClick={() => {
                      if (successData.token) {
                        navigate(`/reset-password?token=${encodeURIComponent(successData.token)}`);
                      } else if (successData.resetUrl) {
                        window.location.href = successData.resetUrl;
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Reset Password</span>
                    <ExternalLink size={15} />
                  </button>
                </div>
              )}

              <button 
                onClick={() => navigate('/login')}
                className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4 text-sm"
              >
                Return to Login
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-lg animate-shake">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@email.com"
                  value={email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Send Reset Link'}
                {!loading && <ChevronRight size={20} />}
              </button>
            </form>
          )}
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

export default ForgotPassword;

