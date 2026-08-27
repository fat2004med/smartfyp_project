import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Tag, 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Mail, 
  Shield,
  Loader2,
  Phone
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const containerRef = useRef(null);
  
  const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    profilePicture: user?.profilePicture || '',
    interests: user?.interests || [],
    phone: user?.phone || '',
  });
  
  const [newInterest, setNewInterest] = useState('');

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { data } = await axios.put('/api/users/profile/update', formData);
      login({ ...user, ...data });
      setSuccess('Profile updated successfully!');
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload this to a server. 
      // For now, we'll use a placeholder or data URL if it's small, 
      // but let's stick to dummy profile pictures or simulate upload.
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
              <div className="min-w-0 pr-2">
                <h3 className="text-lg sm:text-xl font-bold truncate">Manage Profile</h3>
                <p className="text-blue-100 text-xs sm:text-sm">Update your personal information and interests.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 no-scrollbar" ref={containerRef}>
              {error && (
                <div className="p-3.5 sm:p-4 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3.5 sm:p-4 bg-green-50 text-green-600 rounded-xl text-xs sm:text-sm font-medium border border-green-100">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-blue-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-blue-600 font-bold text-2xl sm:text-4xl">
                      {formData.profilePicture ? (
                        <img 
                          src={formData.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        user?.name?.charAt(0) || <User size={36} className="sm:w-12 sm:h-12" />
                      )}
                    </div>
                    <label className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2.5 sm:p-3 bg-blue-600 text-white rounded-2xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all hover:scale-110 active:scale-95">
                      <Camera size={16} className="sm:w-5 sm:h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 italic text-center">Click the camera to upload a new photo</p>
                  {formData.profilePicture && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePicture: '' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer mt-0.5"
                    >
                      <Trash2 size={13} />
                      Remove Profile Picture
                    </button>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2">
                      <User size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 sm:p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Phone size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 sm:p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2 opacity-60">
                      <Mail size={14} className="sm:w-4 sm:h-4" /> Email Address (Read-only)
                    </label>
                    <div className="w-full p-3 sm:p-3.5 bg-gray-100 border border-gray-100 rounded-2xl text-gray-500 font-medium flex items-center text-sm" title={user?.email}>
                      <span className="break-all">{user?.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2 opacity-60">
                      <Shield size={14} className="sm:w-4 sm:h-4" /> Current Role (Read-only)
                    </label>
                    <div className="w-full p-3 sm:p-3.5 bg-gray-100 border border-gray-100 rounded-2xl text-gray-500 font-medium text-sm">
                      {activeRole}
                    </div>
                  </div>
                </div>

                {/* Interests Section */}
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Tag size={14} className="text-blue-600 sm:w-4 sm:h-4" /> Research Interests & Skills
                  </label>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 min-h-[50px] p-3 sm:p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    {formData.interests.length === 0 ? (
                      <p className="text-xs sm:text-sm text-gray-400 italic">No interests added yet...</p>
                    ) : (
                      formData.interests.map((interest, idx) => (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={idx}
                          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-blue-100 text-blue-700 rounded-xl text-xs sm:text-sm font-bold shadow-sm group break-words max-w-full"
                        >
                          <span className="break-all">{interest}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInterest(interest)}
                            className="p-0.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors shrink-0"
                          >
                            <Trash2 size={11} className="sm:w-3 sm:h-3" />
                          </button>
                        </motion.span>
                      ))
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newInterest || ''}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInterest(e)}
                      className="flex-1 p-3 sm:p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                      placeholder="Add an interest (e.g. AI, Blockchain)"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="py-3 sm:py-3.5 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 text-sm"
                    >
                      <Plus size={18} /> Add
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:flex-1 py-3 sm:py-4 px-6 border border-gray-200 text-gray-650 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:flex-[2] py-3 sm:py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Updating...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
