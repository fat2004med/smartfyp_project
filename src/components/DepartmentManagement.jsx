import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  Users, 
  Briefcase,
  Mail,
  MoreVertical,
  ChevronRight,
  UserMinus,
  UserCheck,
  FileText
} from 'lucide-react';

const DepartmentManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteConfirmDept, setDeleteConfirmDept] = useState(null);
  const [statusConfirmDept, setStatusConfirmDept] = useState(null);

  const [newDept, setNewDept] = useState({
    name: '',
    hod: '',
    description: ''
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/departments');
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHods = async () => {
    try {
      const { data } = await axios.get('/api/users');
      setHods(Array.isArray(data) ? data.filter(u => u.role === 'HOD') : []);
    } catch (error) {
      console.error('Error fetching HODs:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDepartments();
      await fetchHods();
    };
    init();
  }, []);

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setSubmittingId('save');
    setError(null);
    try {
      // Prompt client-side check to provide instant feedback
      const isDuplicate = departments.some(d => 
        d.name.trim().toLowerCase() === newDept.name.trim().toLowerCase() && 
        (!editingDept || d._id !== editingDept._id)
      );
      if (isDuplicate) {
        const dupError = new Error(`A department named "${newDept.name}" already exists. Please choose a unique name.`);
        dupError.isClientVal = true;
        throw dupError;
      }

      if (editingDept) {
        const { data } = await axios.put(`/api/departments/${editingDept._id}`, newDept);
        setDepartments(departments.map(d => d._id === editingDept._id ? data : d));
        setEditingDept(null);
      } else {
        const { data } = await axios.post('/api/departments', newDept);
        setDepartments([...departments, data]);
      }
      setIsModalOpen(false);
      toast.success(editingDept ? 'Department updated successfully!' : 'Department created successfully!');
      setNewDept({ name: '', hod: '', description: '' });
      fetchDepartments();
    } catch (err) {
       const msg = err.response?.data?.message || err.message || 'Error saving department';
       toast.error(msg);
       setError(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleToggleStatus = async (deptToToggle) => {
    if (!deptToToggle) return;
    const id = deptToToggle._id;
    setSubmittingId(`toggle-${id}`);
    setError(null);
    try {
      const { data } = await axios.patch(`/api/departments/${id}/toggle-status`);
      setDepartments(departments.map(d => d._id === id ? { ...d, isActive: data.isActive } : d));
      toast.success(data.message || 'Status updated successfully!');
      setStatusConfirmDept(null);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error toggling department status';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteDepartment = async (deptToDelete) => {
    if (!deptToDelete) return;
    const id = deptToDelete._id;
    setSubmittingId(`delete-${id}`);
    setError(null);
    try {
      await axios.delete(`/api/departments/${id}`);
      setDepartments(departments.filter(d => d._id !== id));
      toast.success('Department deleted successfully!');
      setDeleteConfirmDept(null);
    } catch (error) {
      // Handled by interceptor
    } finally {
      setSubmittingId(null);
    }
  };

  const openEditModal = (dept) => {
    setError(null);
    setEditingDept(dept);
    setNewDept({
      name: dept.name,
      hod: dept.hod?._id || dept.hod || '',
      description: dept.description || ''
    });
    setIsModalOpen(true);
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dept.hod?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Departments', value: departments.length, icon: Building2, color: 'blue' },
    { label: 'Total Projects', value: departments.reduce((acc, curr) => acc + (Number(curr.projects) || 0), 0), icon: Briefcase, color: 'indigo' },
    { label: 'Total Supervisors', value: departments.reduce((acc, curr) => acc + (Number(curr.supervisors) || 0), 0), icon: Users, color: 'purple' },
  ];

  return (
    <div className="max-w-[1700px] mx-auto space-y-6 pb-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-500 mt-1">Manage academic departments and their leadership</p>
        </div>
        <button 
          onClick={() => {
            setError(null);
            setEditingDept(null);
            setNewDept({ name: '', hod: '', description: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Add Department
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search departments or HODs..."
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
        />
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">HOD</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Projects</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Supervisors</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDepartments.map((dept) => (
                <tr key={dept._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                        dept.isActive !== false 
                          ? 'bg-blue-50 text-blue-600 border-blue-100' 
                          : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        <Building2 size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-sm ${dept.isActive !== false ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {dept.name}
                        </span>
                        {dept.isActive === false && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full w-fit">Deactivated</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{dept.hod?.name || 'Not assigned'}</span>
                      <span className="text-[10px] text-gray-400">{dept.hod?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{dept.projects || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{dept.supervisors || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(dept)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-blue-100" 
                        title="Edit Department"
                        id={`edit-dept-${dept._id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setStatusConfirmDept({
                          dept,
                          action: dept.isActive !== false ? 'deactivate' : 'activate'
                        })}
                        className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm border ${
                          dept.isActive !== false 
                            ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title={dept.isActive !== false ? "Deactivate Department" : "Activate Department"}
                        id={`toggle-dept-${dept._id}`}
                      >
                        {submittingId === `toggle-${dept._id}` ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <X size={16} />
                          </motion.div>
                        ) : (
                          dept.isActive !== false ? <UserMinus size={16} /> : <UserCheck size={16} />
                        )}
                      </button>
                      <button 
                        onClick={() => {
                          if (dept.isActive !== false) {
                            toast.error("Please deactivate the department before deleting.");
                            return;
                          }
                          setDeleteConfirmDept(dept);
                        }}
                        className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                          dept.isActive !== false 
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 border-gray-100' 
                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:scale-105 active:scale-95'
                        }`}
                        title={dept.isActive !== false ? "Deactivate before deleting" : "Delete Department"}
                        id={`delete-dept-${dept._id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Building2 size={48} strokeWidth={1} />
                      <p className="font-medium">No departments found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingDept ? 'Edit Department' : 'Add New Department'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDept(null);
                    setNewDept({ name: '', hod: '', description: '' });
                    setError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveDepartment} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Department Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      required
                      placeholder="Enter department name"
                      value={newDept.name || ''}
                      onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea 
                      placeholder="Enter department description"
                      value={newDept.description || ''}
                      onChange={(e) => setNewDept({...newDept, description: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Assign HOD</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                      value={newDept.hod || ''}
                      onChange={(e) => setNewDept({...newDept, hod: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value="">Select an HOD (Optional)</option>
                      {hods.map(hod => (
                        <option key={hod._id} value={hod._id}>{hod.name} ({hod.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => { setIsModalOpen(false); setError(null); }}
                    className="w-full sm:flex-1 px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={submittingId === 'save'}
                    type="submit"
                    className="w-full sm:flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {submittingId === 'save' ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <X size={20} />
                      </motion.div>
                    ) : (
                      editingDept ? 'Update Details' : 'Add Department'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deactivation / Activation Confirmation Dialogue Modal */}
      <ConfirmModal
        isOpen={!!statusConfirmDept}
        onClose={() => setStatusConfirmDept(null)}
        onConfirm={() => handleToggleStatus(statusConfirmDept?.dept)}
        isLoading={submittingId === `toggle-${statusConfirmDept?.dept?._id}`}
        title={statusConfirmDept?.action === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
        message={
          statusConfirmDept?.action === 'deactivate'
            ? 'Are you sure you want to deactivate this department? Inactive departments will be disabled for new student and faculty registrations.'
            : 'Are you sure you want to activate this department? It will become active for registrations and project allocation.'
        }
        confirmText={statusConfirmDept?.action === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Activate'}
        cancelText="Cancel"
        variant={statusConfirmDept?.action === 'deactivate' ? 'warning' : 'success'}
        itemName={statusConfirmDept?.dept ? statusConfirmDept.dept.name : null}
      />

      {/* Delete Confirmation Dialogue Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmDept}
        onClose={() => setDeleteConfirmDept(null)}
        onConfirm={() => handleDeleteDepartment(deleteConfirmDept)}
        isLoading={submittingId === `delete-${deleteConfirmDept?._id}`}
        title="Confirm Deletion"
        message="Are you sure you want to permanently delete this department? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmDept ? deleteConfirmDept.name : null}
      />
    </div>
  );
};

export default DepartmentManagement;
