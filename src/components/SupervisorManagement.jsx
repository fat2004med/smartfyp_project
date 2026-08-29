import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  Search, 
  User,
  Mail, 
  Briefcase, 
  GraduationCap,
  Eye,
  MoreVertical,
  Phone
} from 'lucide-react';

const SupervisorManagement = () => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViewSup, setSelectedViewSup] = useState(null);

  const [supervisors, setSupervisors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSup, setEditingSup] = useState(null);
  const [deleteConfirmSup, setDeleteConfirmSup] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/users');
      setSupervisors(Array.isArray(data) ? data.filter(u => u.role && (u.role.includes('Supervisor') || u.role.includes('HOD'))) : []);
    } catch (error) {
      toast.error('Error fetching supervisors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/api/departments');
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments');
    }
  };

  useEffect(() => {
    const init = async () => {
      fetchSupervisors();
      fetchDepartments();
    };
    init();
  }, []);

  const [newSupervisor, setNewSupervisor] = useState({
    name: '',
    email: '',
    password: '@FYP_Secure_pass1',
    department: currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '',
    interests: ''
  });

  const resetForm = () => {
    const userDeptId = currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '';
    setNewSupervisor({
      name: '',
      email: '',
      password: '@FYP_Secure_pass1',
      department: userDeptId,
      interests: ''
    });
    setEditingSup(null);
    setIsModalOpen(false);
  };

  const validateSupervisorData = (data) => {
    if (!data.name || data.name.trim().length < 3) {
      toast.error('Coordinator/Supervisor name must be at least 3 characters');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!data.interests || (typeof data.interests === 'string' && !data.interests.trim())) {
      toast.error('Specialization or interests are required');
      return false;
    }
    if (!data.department) {
      toast.error('Please select a department');
      return false;
    }
    return true;
  };

  const handleAddSupervisor = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateSupervisorData(newSupervisor)) return;
    try {
      const { data } = await api.post('/api/users', {
        ...newSupervisor,
        role: 'Supervisor',
        origin: window.location.origin
      });
      resetForm();
      if (data.emailSent) {
        toast.success(`Supervisor created! Welcome email sent to ${data.email}`);
      } else {
        toast.success(`Supervisor created! Temp password: ${data.temporaryPassword || '@FYP_Secure_pass1'}`);
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchSupervisors();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Error adding supervisor');
    }
  };

  const handleDeleteSupervisor = async (sup) => {
    if (!sup) return;
    setDeleting(true);
    try {
      await api.delete(`/api/users/${sup._id}`);
      toast.success('Supervisor removed successfully');
      setDeleteConfirmSup(null);
      fetchSupervisors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error removing supervisor');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (sup) => {
    setEditingSup(sup);
    setNewSupervisor({
      name: sup.name,
      email: sup.email,
      department: sup.department?._id || sup.department || '',
      interests: sup.interests || '',
      password: '' 
    });
    setIsModalOpen(true);
  };

  const filteredSupervisors = supervisors.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.interests || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1700px] mx-auto space-y-6 pb-10 relative">
      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[200] bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 size={20} />
            Supervisor Added Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Management</h1>
          <p className="text-gray-500 mt-1">Manage faculty supervisors and their workloads</p>
        </div>
        <button 
          onClick={() => {
            const userDeptId = currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '';
            setNewSupervisor({
              name: '',
              email: '',
              password: '@FYP_Secure_pass1',
              department: userDeptId,
              interests: ''
            });
            setEditingSup(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Add Supervisor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search by name or specialization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
        />
      </div>

      {/* Supervisors Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Interests</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSupervisors.map((sup) => (
                <tr key={sup._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                        {sup.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{sup.name}</p>
                        <p className="text-[10px] text-gray-400">{sup.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 font-medium">{sup.department?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {Array.isArray(sup.interests) 
                        ? sup.interests.join(', ') 
                        : (typeof sup.interests === 'string' 
                            ? sup.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                            : (sup.interests || 'N/A'))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      sup.isActive !== false ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {sup.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-all">
                      <button 
                        onClick={() => setSelectedViewSup(sup)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(sup)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
                        title="Edit Supervisor"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmSup(sup)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" 
                        title="Delete Supervisor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSupervisors.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Users size={48} strokeWidth={1} />
                      <p className="font-medium">No supervisors found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supervisor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-gray-100"
            >
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{editingSup ? 'Edit Supervisor' : 'Add New Supervisor'}</h2>
                <button 
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingSup) {
                  if (!validateSupervisorData(newSupervisor)) return;
                  axios.put(`/api/users/${editingSup._id}`, newSupervisor).then(() => {
                    resetForm();
                    fetchSupervisors();
                    toast.success('Supervisor updated');
                  }).catch(() => toast.error('Update failed'));
                } else {
                  handleAddSupervisor(e);
                }
              }} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 scrollbar-thin">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={newSupervisor.name || ''}
                        onChange={(e) => setNewSupervisor({...newSupervisor, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email"
                        required
                        placeholder="Enter email address"
                        value={newSupervisor.email || ''}
                        onChange={(e) => setNewSupervisor({...newSupervisor, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Specialization / Interests *</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Machine Learning, Cloud Computing"
                        value={newSupervisor.interests || ''}
                        onChange={(e) => setNewSupervisor({...newSupervisor, interests: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Department *</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select 
                        required
                        value={newSupervisor.department || ''}
                        onChange={(e) => setNewSupervisor({...newSupervisor, department: e.target.value})}
                        disabled={currentUser?.role !== 'Admin'}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none disabled:bg-gray-100 disabled:opacity-75 disabled:cursor-not-allowed text-sm font-medium cursor-pointer"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 text-sm cursor-pointer"
                  >
                    {editingSup ? 'Update Supervisor' : 'Add Supervisor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Supervisor Details Modal */}
      <AnimatePresence>
        {selectedViewSup && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedViewSup(null)}
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6 scrollbar-thin"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Supervisor Profile Details</h3>
                <button
                  onClick={() => setSelectedViewSup(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 rounded-xl bg-blue-50 border-2 border-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner">
                  {selectedViewSup.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-gray-900">{selectedViewSup.name}</h4>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    {selectedViewSup.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-gray-50">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</span>
                  <a 
                    href={`mailto:${selectedViewSup.email}`}
                    className="col-span-2 text-sm text-gray-800 font-bold hover:text-indigo-600 break-all select-all flex items-center gap-1.5"
                  >
                    <Mail size={14} className="text-gray-400" />
                    {selectedViewSup.email}
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                  {selectedViewSup.phone ? (
                    <a 
                      href={`tel:${selectedViewSup.phone}`}
                      className="col-span-2 text-sm text-gray-800 font-bold hover:text-indigo-600 select-all flex items-center gap-1.5"
                    >
                      <Phone size={14} className="text-gray-400" />
                      {selectedViewSup.phone}
                    </a>
                  ) : (
                    <span className="col-span-2 text-sm text-gray-400 italic flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-300" />
                      No phone listed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</span>
                  <span className="col-span-2 text-sm text-gray-800 font-semibold">
                    {selectedViewSup.department?.name || (typeof selectedViewSup.department === 'string' ? selectedViewSup.department : 'N/A')}
                  </span>
                </div>

                {selectedViewSup.designation && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Designation</span>
                    <span className="col-span-2 text-sm text-gray-800 font-bold">
                      {selectedViewSup.designation}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Specialization</span>
                  <span className="col-span-2 text-sm text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 flex-wrap">
                    <GraduationCap size={14} className="text-indigo-500 flex-shrink-0" />
                    <span className="break-words">
                      {Array.isArray(selectedViewSup.interests) 
                        ? selectedViewSup.interests.join(', ') 
                        : (typeof selectedViewSup.interests === 'string' 
                            ? selectedViewSup.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                            : (selectedViewSup.interests || 'Not specified'))}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <span className="col-span-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedViewSup.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedViewSup.isActive !== false ? 'Active Faculty' : 'Inactive'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedViewSup(null)}
                  className="px-5 py-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all border border-gray-200"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Supervisor Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmSup}
        onClose={() => setDeleteConfirmSup(null)}
        onConfirm={() => handleDeleteSupervisor(deleteConfirmSup)}
        isLoading={deleting}
        title="Confirm Supervisor Removal"
        message="Are you sure you want to remove this supervisor from the platform? Their access and assignments will be revoked. This action cannot be undone."
        confirmText="Yes, Remove"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmSup ? `${deleteConfirmSup.name} (${deleteConfirmSup.email})` : null}
      />
    </div>
  );
};

export default SupervisorManagement;
