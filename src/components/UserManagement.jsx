import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  ChevronDown,
  Mail,
  Building2,
  ShieldCheck,
  UserMinus,
  UserCheck,
  Loader2,
  Phone,
  Eye,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Send,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedViewUser, setSelectedViewUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [statusConfirmData, setStatusConfirmData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Direct Password Reset Modal State (Solution 2)
  const [resetModalUser, setResetModalUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('Password123!');
  const [requireChangeOnLogin, setRequireChangeOnLogin] = useState(true);
  const [resetSuccessData, setResetSuccessData] = useState(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Created User / Welcome Credentials Modal State
  const [createdUserResult, setCreatedUserResult] = useState(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    studentRegNo: '',
    designation: '',
    phone: '',
  });
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/departments');
      setDepts(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchDepts()]);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchUsers, fetchDepts]);

  const roles = currentUser?.role?.includes('Admin') 
    ? ['Admin', 'HOD', 'Supervisor', 'HOD, Supervisor', 'Team Leader', 'Team Member']
    : ['Supervisor', 'HOD, Supervisor', 'Team Leader', 'Team Member']; // HODs usually create these

  const tabs = [
    { label: 'All Users', count: users.length },
    { label: 'Admins', count: users.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('Admin')).length },
    { label: 'HODs', count: users.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('HOD')).length },
    { label: 'Supervisors', count: users.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('Supervisor')).length },
    { label: 'Team Leaders', count: users.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('Team Leader')).length },
    { label: 'Team Members', count: users.filter(u => u.role && u.role.split(',').map(r => r.trim()).includes('Team Member')).length },
  ];

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmittingId('save');
    setError(null);
    
    // Form and Field Validations
    if (!newUser.name || newUser.name.trim().length < 3) {
      toast.error('Full Name must be at least 3 characters long');
      setSubmittingId(null);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newUser.email || !emailRegex.test(newUser.email.trim())) {
      toast.error('Please enter a valid email address');
      setSubmittingId(null);
      return;
    }
    
    if (newUser.phone && newUser.phone.trim().length > 0 && newUser.phone.trim().length < 7) {
      toast.error('Phone number must be at least 7 digits/characters long');
      setSubmittingId(null);
      return;
    }
    
    if (!newUser.role) {
      toast.error('Please select a user role');
      setSubmittingId(null);
      return;
    }
    
    if ((newUser.role === 'Team Member' || newUser.role === 'Team Leader') && (!newUser.studentRegNo || !newUser.studentRegNo.trim())) {
      toast.error('Student Registration Number is required for team members/leaders');
      setSubmittingId(null);
      return;
    }
    
    if ((newUser.role === 'Supervisor' || newUser.role === 'HOD' || newUser.role === 'HOD, Supervisor') && (!newUser.designation || !newUser.designation.trim())) {
      toast.error('Designation is required for academic staff');
      setSubmittingId(null);
      return;
    }
    
    if (newUser.role !== 'Admin' && !newUser.department) {
      toast.error('Please select a department');
      setSubmittingId(null);
      return;
    }

    try {
      const payload = {
        ...newUser,
        origin: window.location.origin
      };
      if (editingUser) {
        const { data } = await api.put(`/api/users/${editingUser._id}`, payload);
        setUsers(users.map(u => u._id === editingUser._id ? data : u));
        setEditingUser(null);
        toast.success('User updated successfully!');
      } else {
        const { data } = await api.post('/api/users', payload);
        setUsers([...users, data]);
        setCreatedUserResult(data);
        if (data.emailSent) {
          toast.success(`User created! Welcome email dispatched to ${data.email}`);
        } else {
          toast.success(data.message || `User created with temporary password: ${data.temporaryPassword}`);
        }
      }
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', role: '', department: '', studentRegNo: '', designation: '', phone: '' });
      fetchUsers();
    } catch (error) {
       // Handled by interceptor or standard response error
       const msg = error.response?.data?.message || 'Error saving user';
       toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleResendWelcome = async (user) => {
    setSubmittingId(`resend-${user._id}`);
    try {
      const { data } = await api.post(`/api/users/${user._id}/resend-welcome`, {
        origin: window.location.origin
      });
      if (data.emailSent) {
        toast.success(`Welcome email sent to ${user.email}!`);
      } else {
        toast.error(`Email delivery note: ${data.emailError || 'Could not dispatch email'}`);
      }
      setCreatedUserResult({
        ...data,
        name: user.name,
        role: user.role,
        department: user.department?.name || user.department
      });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend welcome email');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleToggleStatus = async (userToToggle) => {
    if (!userToToggle) return;
    const id = userToToggle._id;
    setSubmittingId(`toggle-${id}`);
    setError(null);
    try {
      const { data } = await api.put(`/api/users/${id}/toggle-status`);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: data.isActive } : u));
      toast.success(data.message || 'Status updated successfully!');
      setStatusConfirmData(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Error toggling user status');
      toast.error(error.response?.data?.message || 'Error toggling user status');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!userToDelete) return;
    const id = userToDelete._id;
    setSubmittingId(`delete-${id}`);
    setError(null);
    try {
      await api.delete(`/api/users/${id}`);
      await fetchUsers();
      toast.success('User deleted successfully!');
      setDeleteConfirmUser(null);
    } catch (error) {
      // Handled by interceptor
    } finally {
      setSubmittingId(null);
    }
  };

  const openResetPasswordModal = (user) => {
    setResetModalUser(user);
    setTemporaryPassword('Password123!');
    setRequireChangeOnLogin(true);
    setResetSuccessData(null);
    setCopiedPass(false);
  };

  const handleDirectPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setSubmittingId('direct-reset');
    try {
      const { data } = await api.post(`/api/users/${resetModalUser._id}/reset-password`, {
        newPassword: temporaryPassword,
        requirePasswordChange: requireChangeOnLogin,
        origin: window.location.origin
      });
      setResetSuccessData(data);
      toast.success(data.message || 'Password reset successfully!');
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset user password';
      toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = 'Pass@';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTemporaryPassword(result + '1');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    const initialDept = currentUser?.role?.includes('HOD') 
      ? (currentUser?.department?._id || currentUser?.department || '') 
      : (user.department?._id || user.department || '');
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: initialDept,
      studentRegNo: user.studentRegNo || '',
      designation: user.designation || '',
      phone: user.phone || ''
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingUser(null);
    const initialDept = currentUser?.role?.includes('HOD') 
      ? (currentUser?.department?._id || currentUser?.department || '') 
      : '';
    setNewUser({ 
      name: '', 
      email: '', 
      role: '', 
      department: initialDept,
      studentRegNo: '',
      designation: ''
    });
    setIsModalOpen(true);
  };

  const getRoleBadgeColor = (role) => {
    if (role && role.includes('HOD') && role.includes('Supervisor')) {
      return 'bg-gradient-to-r from-purple-100 to-blue-100 text-indigo-700 font-extrabold';
    }
    switch (role) {
      case 'Admin': return 'bg-orange-100 text-orange-600';
      case 'HOD': return 'bg-purple-100 text-purple-600';
      case 'Supervisor': return 'bg-blue-100 text-blue-600';
      case 'Team Leader': return 'bg-green-100 text-green-600';
      case 'Team Member': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredUsers = users.filter(user => {
    const rolesArray = user.role ? user.role.split(',').map(r => r.trim()) : [];
    const matchesTab = activeTab === 'All Users' || 
                      (activeTab === 'Admins' && rolesArray.includes('Admin')) ||
                      (activeTab === 'HODs' && rolesArray.includes('HOD')) ||
                      (activeTab === 'Supervisors' && rolesArray.includes('Supervisor')) ||
                      (activeTab === 'Team Leaders' && rolesArray.includes('Team Leader')) ||
                      (activeTab === 'Team Members' && rolesArray.includes('Team Member'));
    
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-6 pb-10 relative px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} total users registered</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="bg-gray-100/50 p-1 rounded-2xl flex overflow-x-auto scrollbar-hide gap-1 w-full lg:w-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.label 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-gray-600">Syncing database...</p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{user.department?.name || (typeof user.department === 'string' ? user.department : 'N/A')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button 
                          onClick={() => setSelectedViewUser(user)}
                          className="p-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-purple-100" 
                          title="View Details"
                          id={`view-user-btn-${user._id}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-blue-100" 
                          title="Edit User"
                          id={`edit-user-${user._id}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openResetPasswordModal(user)}
                          className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-amber-100" 
                          title="Direct Password Reset"
                          id={`reset-pwd-user-${user._id}`}
                        >
                          <KeyRound size={16} />
                        </button>
                        <button 
                          onClick={() => handleResendWelcome(user)}
                          disabled={submittingId === `resend-${user._id}`}
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-indigo-100 disabled:opacity-50"
                          title="Send / Resend Welcome Email with Credentials"
                          id={`resend-welcome-user-${user._id}`}
                        >
                          {submittingId === `resend-${user._id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                        <button 
                          onClick={() => setStatusConfirmData({
                            user,
                            action: user.isActive !== false ? 'deactivate' : 'activate'
                          })}
                          className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm border ${
                            user.isActive !== false 
                              ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={user.isActive !== false ? "Deactivate User" : "Activate User"}
                          id={`toggle-user-${user._id}`}
                        >
                          {submittingId === `toggle-${user._id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            user.isActive !== false ? <UserMinus size={16} /> : <UserCheck size={16} />
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            if (user.isActive !== false) {
                              toast.error("Please deactivate the user before deleting.");
                              return;
                            }
                            setDeleteConfirmUser(user);
                          }}
                          className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                            user.isActive !== false 
                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 border-gray-100' 
                              : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:scale-105 active:scale-95'
                          }`}
                          title={user.isActive !== false ? "Deactivate before deleting" : "Delete User"}
                          id={`delete-user-${user._id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Users size={48} strokeWidth={1} />
                      <p className="font-medium">No users found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-xl lg:max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                    <p className="text-xs text-gray-500 font-medium">Enter user credentials and academic role assignments</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddUser} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 scrollbar-thin">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name *</label>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={newUser.name || ''}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="email"
                          required
                          placeholder="e.g. user@university.edu"
                          value={newUser.email || ''}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text"
                          placeholder="e.g. +92 300 1234567"
                          value={newUser.phone || ''}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Role *</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select 
                          required
                          value={newUser.role || ''}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm font-medium cursor-pointer"
                        >
                          <option value="">Select system role</option>
                          {roles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      </div>
                    </div>

                    {/* Conditional Fields Based on Role */}
                    {newUser.role === 'Team Member' || newUser.role === 'Team Leader' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Student Reg. No *</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text"
                            required
                            placeholder="e.g. 2021-CS-123"
                            value={newUser.studentRegNo || ''}
                            onChange={(e) => setNewUser({...newUser, studentRegNo: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                      </div>
                    ) : newUser.role && newUser.role !== 'Admin' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Designation *</label>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Associate Professor"
                            value={newUser.designation || ''}
                            onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Department */}
                    <div className={`space-y-1.5 ${newUser.role === 'Admin' ? 'sm:col-span-2' : ''}`}>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Department {newUser.role === 'Admin' ? '(Optional)' : '*'}
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select 
                          required={newUser.role !== 'Admin'}
                          value={newUser.department || ''}
                          onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                          disabled={currentUser?.role?.includes('HOD')}
                          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 text-sm font-medium cursor-pointer"
                        >
                          <option value="">{newUser.role === 'Admin' ? 'Optional - Select department' : 'Select department'}</option>
                          {depts.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Buttons */}
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
                    disabled={submittingId === 'save'}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submittingId === 'save' ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{editingUser ? 'Update User' : 'Create User'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* View User Details Modal */}
      <AnimatePresence>
        {selectedViewUser && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedViewUser(null)}
              className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6 scrollbar-thin"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">User Profile Details</h3>
                <button
                  onClick={() => setSelectedViewUser(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-inner">
                  {getInitials(selectedViewUser.name)}
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-gray-900">{selectedViewUser.name}</h4>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(selectedViewUser.role)}`}>
                    {selectedViewUser.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-gray-50">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</span>
                  <a 
                    href={`mailto:${selectedViewUser.email}`}
                    className="col-span-2 text-sm text-gray-800 font-bold hover:text-indigo-600 break-all select-all flex items-center gap-1.5"
                  >
                    <Mail size={14} className="text-gray-400" />
                    {selectedViewUser.email}
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                  {selectedViewUser.phone ? (
                    <a 
                      href={`tel:${selectedViewUser.phone}`}
                      className="col-span-2 text-sm text-gray-800 font-bold hover:text-indigo-600 select-all flex items-center gap-1.5"
                    >
                      <Phone size={14} className="text-gray-400" />
                      {selectedViewUser.phone}
                    </a>
                  ) : (
                    <span className="col-span-2 text-sm text-gray-400 italic">No phone listed</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</span>
                  <span className="col-span-2 text-sm text-gray-800 font-semibold">
                    {selectedViewUser.department?.name || (typeof selectedViewUser.department === 'string' ? selectedViewUser.department : 'N/A')}
                  </span>
                </div>

                {selectedViewUser.studentRegNo && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Reg. No</span>
                    <span className="col-span-2 text-sm text-gray-800 font-mono font-bold select-all">
                      {selectedViewUser.studentRegNo}
                    </span>
                  </div>
                )}

                {selectedViewUser.designation && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Designation</span>
                    <span className="col-span-2 text-sm text-gray-800 font-bold">
                      {selectedViewUser.designation}
                    </span>
                  </div>
                )}

                {selectedViewUser.interests && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interests</span>
                    <span className="col-span-2 text-sm text-gray-800 font-semibold italic text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg break-words">
                      {Array.isArray(selectedViewUser.interests) 
                        ? selectedViewUser.interests.join(', ') 
                        : (typeof selectedViewUser.interests === 'string' 
                            ? selectedViewUser.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                            : selectedViewUser.interests)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <span className="col-span-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedViewUser.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedViewUser.isActive !== false ? 'Active Account' : 'Inactive Account'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedViewUser(null)}
                  className="px-5 py-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all border border-gray-200"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Password Reset Modal (Solution 2) */}
      <AnimatePresence>
        {resetModalUser && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setResetModalUser(null);
                setResetSuccessData(null);
              }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Reset User Password</h3>
                    <p className="text-xs text-gray-500">Admin & HOD Override Tool</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setResetModalUser(null);
                    setResetSuccessData(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              {!resetSuccessData ? (
                <form onSubmit={handleDirectPasswordReset} className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
                    <p className="text-xs text-blue-900 leading-relaxed font-medium">
                      Resetting password for <strong className="text-blue-950 font-bold">{resetModalUser.name}</strong> (<span className="font-mono">{resetModalUser.email}</span>). You can provide this temporary password directly to the user.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Temporary Password</label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={temporaryPassword || ''}
                        onChange={(e) => setTemporaryPassword(e.target.value)}
                        placeholder="e.g. Password123!"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">Must be at least 6 characters with upper, lower, and number/symbol.</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requireChangeCheckbox"
                      checked={requireChangeOnLogin}
                      onChange={(e) => setRequireChangeOnLogin(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="requireChangeCheckbox" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                      Force user to choose a new password upon their next login
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetModalUser(null)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingId === 'direct-reset'}
                      className="flex-1 bg-amber-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                    >
                      {submittingId === 'direct-reset' ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Resetting...
                        </>
                      ) : (
                        'Save & Reset Password'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="font-bold text-emerald-950 text-base">Password Reset Successfully!</h4>
                    <p className="text-xs text-emerald-800">
                      The password for <strong>{resetModalUser.name}</strong> has been updated. An email has also been dispatched to <span className="font-semibold">{resetModalUser.email}</span>.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Credentials to Share with User</span>
                    <div className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-lg font-mono text-sm">
                      <span className="text-gray-900 font-bold">{resetSuccessData.temporaryPassword}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(resetSuccessData.temporaryPassword);
                          setCopiedPass(true);
                          toast.success('Password copied to clipboard!');
                          setTimeout(() => setCopiedPass(false), 2500);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-all flex items-center gap-1 text-xs font-bold font-sans"
                      >
                        {copiedPass ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedPass ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetSuccessData(null);
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md text-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Created / Credentials Result Modal */}
      <AnimatePresence>
        {createdUserResult && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setCreatedUserResult(null); setCopiedCredentials(false); }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">User Account & Credentials</h3>
                    <p className="text-xs text-gray-500 font-medium">Account status and login credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCreatedUserResult(null); setCopiedCredentials(false); }}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Delivery Status Banner */}
              {createdUserResult.emailSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-emerald-900">Welcome Email Dispatched!</p>
                    <p className="text-emerald-700 text-xs mt-0.5">
                      An official welcome email with login credentials has been sent to <strong>{createdUserResult.email}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-amber-900">Account Ready (Email Delivery Alert)</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      {createdUserResult.emailError || "The welcome email could not be delivered automatically to this inbox. You can copy the credentials below and provide them to the user directly."}
                    </p>
                  </div>
                </div>
              )}

              {/* Credentials Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>User Login Details</span>
                  <span className="text-blue-600 lowercase font-bold">{createdUserResult.role}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  {createdUserResult.name && (
                    <>
                      <span className="text-slate-500 font-medium col-span-1">Name:</span>
                      <span className="font-bold text-slate-900 col-span-2">{createdUserResult.name}</span>
                    </>
                  )}

                  <span className="text-slate-500 font-medium col-span-1">Email:</span>
                  <span className="font-bold text-slate-900 col-span-2 break-all">{createdUserResult.email}</span>

                  <span className="text-slate-500 font-medium col-span-1">Temporary Pass:</span>
                  <span className="col-span-2">
                    <code className="bg-white border border-slate-200 text-blue-600 px-2.5 py-0.5 rounded font-mono font-bold text-sm">
                      {createdUserResult.temporaryPassword || createdUserResult.tempPasswordUsed}
                    </code>
                  </span>

                  <span className="text-slate-500 font-medium col-span-1">Portal URL:</span>
                  <span className="text-slate-700 text-xs col-span-2 break-all font-mono">
                    {createdUserResult.portalUrl || `${window.location.origin}/login`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const pass = createdUserResult.temporaryPassword || createdUserResult.tempPasswordUsed;
                    const url = createdUserResult.portalUrl || `${window.location.origin}/login`;
                    const text = `SmartFYP Academic Portal Credentials:\nName: ${createdUserResult.name || 'User'}\nEmail: ${createdUserResult.email}\nTemporary Password: ${pass}\nRole: ${createdUserResult.role || 'User'}\nPortal URL: ${url}\n\nPlease reset your password upon first login.`;
                    navigator.clipboard.writeText(text);
                    setCopiedCredentials(true);
                    toast.success("Credentials copied to clipboard!");
                    setTimeout(() => setCopiedCredentials(false), 3000);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all border border-slate-200"
                >
                  {copiedCredentials ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copiedCredentials ? "Copied Credentials!" : "Copy Credentials"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedUserResult(null);
                    setCopiedCredentials(false);
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deactivation / Activation Confirmation Dialogue Modal */}
      <ConfirmModal
        isOpen={!!statusConfirmData}
        onClose={() => setStatusConfirmData(null)}
        onConfirm={() => handleToggleStatus(statusConfirmData?.user)}
        isLoading={submittingId === `toggle-${statusConfirmData?.user?._id}`}
        title={statusConfirmData?.action === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
        message={
          statusConfirmData?.action === 'deactivate'
            ? 'Are you sure you want to deactivate this user account? The user will be blocked from logging into the portal until reactivated.'
            : 'Are you sure you want to activate this user account? The user will regain access to log into the portal.'
        }
        confirmText={statusConfirmData?.action === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Activate'}
        cancelText="Cancel"
        variant={statusConfirmData?.action === 'deactivate' ? 'warning' : 'success'}
        itemName={statusConfirmData?.user ? `${statusConfirmData.user.name} (${statusConfirmData.user.email})` : null}
      />

      {/* Delete Confirmation Dialogue Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={() => handleDeleteUser(deleteConfirmUser)}
        isLoading={submittingId === `delete-${deleteConfirmUser?._id}`}
        title="Confirm Deletion"
        message="Are you sure you want to permanently delete this user? All user profile data will be permanently removed. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmUser ? `${deleteConfirmUser.name} (${deleteConfirmUser.email})` : null}
      />
    </div>
  );
};

export default UserManagement;
