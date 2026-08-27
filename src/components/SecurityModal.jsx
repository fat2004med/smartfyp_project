import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Shield, Eye, EyeOff, CheckCircle2, AlertCircle, Mail, UserCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SecurityModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const validatePassword = (pass) => {
    const unmet = [];
    if (pass.length < 8) unmet.push('at least 8 characters');
    if (!/[A-Z]/.test(pass)) unmet.push('one uppercase letter');
    if (!/[a-z]/.test(pass)) unmet.push('one lowercase letter');
    if (!/[0-9]/.test(pass)) unmet.push('one number');
    if (!/[^A-Za-z0-9\s]/.test(pass)) unmet.push('one special character');
    return unmet;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    const unmet = validatePassword(passwords.newPassword);
    if (unmet.length > 0) {
      setMessage({ type: 'error', text: `Password must include: ${unmet.join(', ')}.` });
      return;
    }

    setLoading(true);
    try {
      await axios.patch('/api/auth/updatePassword', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error updating password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Account Credentials</h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Identity & Access Control</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Credentials Card */}
              <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={16} className="text-indigo-600" />
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Identification</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900 min-w-0" title={user?.email}>
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Role</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <Shield size={14} className="text-indigo-600" />
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-xs">{activeRole}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password Status</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <Lock size={14} className="text-gray-400" />
                      ••••••••••••
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={16} className="text-gray-600" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Update Security</span>
                </div>

                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-center gap-3 ${
                      message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold">{message.text}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Current Password</label>
                  <div className="relative group/input">
                    <input 
                      type={showCurrent ? "text" : "password"}
                      required
                      value={passwords.currentPassword || ''}
                      onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                      className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors bg-transparent border-none appearance-none cursor-pointer p-1"
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">New Password</label>
                    <div className="relative group/input">
                      <input 
                        type={showNew ? "text" : "password"}
                        required
                        value={passwords.newPassword || ''}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        placeholder="Min 8 chars"
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors bg-transparent border-none appearance-none cursor-pointer p-1"
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Confirm New</label>
                    <div className="relative group/input">
                      <input 
                        type={showConfirm ? "text" : "password"}
                        required
                        value={passwords.confirmPassword || ''}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        placeholder="Repeat new"
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors bg-transparent border-none appearance-none cursor-pointer p-1"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time checklist */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Password Strength Checklist</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'Min 8 characters', valid: passwords.newPassword.length >= 8 },
                      { label: 'One uppercase letter', valid: /[A-Z]/.test(passwords.newPassword) },
                      { label: 'One lowercase letter', valid: /[a-z]/.test(passwords.newPassword) },
                      { label: 'One number', valid: /[0-9]/.test(passwords.newPassword) },
                      { label: 'One special character', valid: /[^A-Za-z0-9\s]/.test(passwords.newPassword) }
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-medium">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${req.valid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {req.valid ? (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <div className="w-1 h-1 bg-gray-300 rounded-full" />
                          )}
                        </div>
                        <span className={req.valid ? 'text-green-700' : 'text-gray-500'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={18} />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SecurityModal;
