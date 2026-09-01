import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  FileText, 
  Eye, 
  ChevronDown, 
  X, 
  MessageSquare,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Code2,
  Award,
  ExternalLink,
  Mail,
  Phone,
  Download,
  Lock
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';
import ConfirmModal from './ConfirmModal';

const ProjectRecords = () => {
  const { user } = useAuth();
  const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');
  const isHOD = activeRole === 'HOD' || (!activeRole && Boolean(user?.role?.includes('HOD')));
  const isSupervisor = activeRole === 'Supervisor' || (!activeRole && Boolean(user?.role?.includes('Supervisor')));
  const isDepartmentLocked = (isHOD || isSupervisor) && activeRole !== 'Admin';

  const [selectedProject, setSelectedProject] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    teamName: '',
    description: '',
    department: '',
    supervisor: '',
    hod: '',
    teamLeader: '',
    members: [],
    academicYear: new Date().getFullYear().toString(),
    batch: '',
    status: 'Proposed',
    isPublic: false,
    technologies: '',
    abstract: '',
    outcomes: '',
    duration: '',
    grade: '',
    score: 0,
    githubLink: '',
    fileUrl: '',
    liveLink: '',
    isLiveLinkPublic: false
  });

  const [filters, setFilters] = useState({
    department: 'All Departments',
    year: 'All Years',
    status: 'All Status'
  });
  const [feedbackText, setFeedbackText] = useState('');

  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const statuses = ["All Status", "Proposed", "Active", "Approved", "Completed", "Rejected", "Published"];

  // Find user's department name
  const userDepartmentName = useMemo(() => {
    if (!user) return '';
    if (user.department && typeof user.department === 'object' && user.department.name) {
      return user.department.name;
    }
    if (user.dept && typeof user.dept === 'object' && user.dept.name) {
      return user.dept.name;
    }
    const deptIdOrName = user.department || user.dept;
    if (deptIdOrName) {
      const match = departments.find(d => 
        String(d._id) === String(deptIdOrName) || 
        d.name?.toLowerCase() === String(deptIdOrName).toLowerCase()
      );
      if (match) return match.name;
    }
    if (isHOD) {
      const hodDept = departments.find(d => 
        String(d.hod?._id || d.hod) === String(user._id)
      );
      if (hodDept) return hodDept.name;
    }
    if (typeof deptIdOrName === 'string' && deptIdOrName.length > 2 && !deptIdOrName.match(/^[0-9a-fA-F]{24}$/)) {
      return deptIdOrName;
    }
    return '';
  }, [user, departments, isHOD]);

  // Synchronize locked department into filters
  useEffect(() => {
    if (isDepartmentLocked && userDepartmentName) {
      setFilters(prev => ({ ...prev, department: userDepartmentName }));
    }
  }, [isDepartmentLocked, userDepartmentName]);

  // Dynamically extract available years from projects
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    projects.forEach(p => {
      const y = p.academicYear || p.year;
      if (y) yearsSet.add(String(y));
    });
    const currentY = new Date().getFullYear();
    [currentY, currentY - 1, currentY - 2, currentY - 3].forEach(y => yearsSet.add(String(y)));
    return Array.from(yearsSet).filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, deptRes, userRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/departments'),
        axios.get('/api/users')
      ]);
      setProjects(projRes.data);
      setDepartments(deptRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const handleFeedbackSubmit = async (projectId) => {
    if (!feedbackText.trim() && !editingGrade) {
      toast.error('Please provide at least feedback or a grade');
      return;
    }
    setSubmittingId(`feedback-${projectId}`);
    setError(null);
    try {
      const { data } = await axios.put(`/api/projects/${projectId}/feedback`, { 
        text: feedbackText,
        grade: editingGrade
      });
      toast.success('Review and grade updated');
      setFeedbackText('');
      setEditingGrade('');
      fetchData();
      if (selectedProject?._id === projectId) {
        setSelectedProject(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting feedback');
    } finally {
      setSubmittingId(null);
    }
  };

  const [editingGrade, setEditingGrade] = useState('');

  const handleApprove = async (projectId) => {
    setSubmittingId(`approve-${projectId}`);
    try {
      await axios.put(`/api/projects/${projectId}/approve`);
      toast.success('Project Approved');
      fetchData();
    } catch (err) {
      toast.error('Error approving project');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (projectId) => {
    setSubmittingId(`reject-${projectId}`);
    try {
      await axios.put(`/api/projects/${projectId}/reject`);
      toast.success('Project Rejected');
      fetchData();
    } catch (err) {
      toast.error('Error rejecting project');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleActivate = async (projectId) => {
    setSubmittingId(`activate-${projectId}`);
    try {
      await axios.put(`/api/projects/${projectId}/activate`);
      toast.success('Project Activated');
      fetchData();
    } catch (err) {
      toast.error('Error activating project');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleComplete = async (projectId) => {
    setSubmittingId(`complete-${projectId}`);
    try {
      await axios.put(`/api/projects/${projectId}/complete`);
      toast.success('Project marked as Completed');
      fetchData();
    } catch (err) {
      toast.error('Error completing project');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmittingId('project-form');
    try {
      const payload = {
        ...projectForm,
        technologies: projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingProject) {
        await axios.put(`/api/projects/${editingProject._id}`, payload);
        toast.success('Project updated successfully');
      } else {
        await axios.post('/api/projects', payload);
        toast.success('Project created successfully');
      }
      setIsFormModalOpen(false);
      setEditingProject(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving project');
    } finally {
      setSubmittingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    const userDeptId = departments.find(d => d.name === userDepartmentName)?._id || user?.department?._id || user?.department || user?.dept?._id || user?.dept || '';
    setProjectForm({
      title: '',
      teamName: '',
      description: '',
      department: (isDepartmentLocked && userDeptId) ? userDeptId : '',
      supervisor: isSupervisor ? user?._id : '',
      hod: isHOD ? user?._id : '',
      teamLeader: '',
      members: [],
      academicYear: new Date().getFullYear().toString(),
      batch: '',
      status: 'Proposed',
      isPublic: false,
      technologies: '',
      abstract: '',
      outcomes: '',
      duration: '',
      grade: '',
      score: 0,
      githubLink: '',
      fileUrl: '',
      liveLink: '',
      isLiveLinkPublic: false
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title || '',
      teamName: project.teamName || project.title || '',
      description: project.description || '',
      department: project.department?._id || project.department || '',
      supervisor: project.supervisor?._id || project.supervisor || '',
      hod: project.hod?._id || project.hod || '',
      teamLeader: project.teamLeader?._id || project.teamLeader || '',
      members: project.members?.map(m => m._id || m) || [],
      academicYear: project.academicYear || '',
      batch: project.batch || '',
      status: project.status || 'Proposed',
      isPublic: project.isPublic || false,
      technologies: project.technologies?.join(', ') || '',
      abstract: project.abstract || '',
      outcomes: project.outcomes || '',
      duration: project.duration || '',
      grade: project.grade || '',
      score: project.score || 0,
      githubLink: project.githubLink || '',
      fileUrl: project.fileUrl || '',
      liveLink: project.liveLink || '',
      isLiveLinkPublic: project.isLiveLinkPublic || false
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id) => {
    setError(null);
    const toastId = toast.loading('Deleting project...');
    try {
      await axios.delete(`/api/projects/${id}`);
      toast.success('Project deleted successfully!', { id: toastId });
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error deleting project';
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    }
  };

  const handlePublish = async (projectId) => {
    setSubmittingId(`publish-${projectId}`);
    try {
      await axios.put(`/api/projects/${projectId}/publish`);
      toast.success('Project published successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error publishing project');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // 1. Role-specific department and assignment filtering for HOD & Supervisor
      if (isDepartmentLocked && userDepartmentName) {
        const pDeptName = p.department?.name || (typeof p.department === 'string' ? p.department : '');
        const isMyDept = pDeptName && pDeptName.toLowerCase() === userDepartmentName.toLowerCase();
        const isMyAssigned = String(p.supervisor?._id || p.supervisor || '') === String(user?._id || '');

        if (isHOD && !isMyDept) {
          return false;
        }
        if (isSupervisor && !isMyDept && !isMyAssigned) {
          return false;
        }
      }

      // 2. Search query matching across all relevant fields
      const q = (searchQuery || '').trim().toLowerCase();
      if (q) {
        const titleMatch = p.title?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const abstractMatch = p.abstract?.toLowerCase().includes(q);
        const teamMatch = p.teamName?.toLowerCase().includes(q);
        const superMatch = p.supervisor?.name?.toLowerCase().includes(q) || p.supervisor?.email?.toLowerCase().includes(q);
        const leaderMatch = p.teamLeader?.name?.toLowerCase().includes(q) || p.teamLeader?.email?.toLowerCase().includes(q);
        const deptMatch = p.department?.name?.toLowerCase().includes(q);
        const batchMatch = p.batch?.toLowerCase().includes(q);
        const yearMatch = String(p.academicYear || p.year || '').toLowerCase().includes(q);
        const statusMatch = p.status?.toLowerCase().includes(q);
        const techMatch = Array.isArray(p.technologies) 
          ? p.technologies.some(t => typeof t === 'string' && t.toLowerCase().includes(q))
          : (typeof p.technologies === 'string' && p.technologies.toLowerCase().includes(q));
        const tagMatch = Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q));
        const memberMatch = Array.isArray(p.members) && p.members.some(m => 
          m?.name?.toLowerCase().includes(q) || m?.email?.toLowerCase().includes(q)
        );

        const matchesSearch = titleMatch || descMatch || abstractMatch || teamMatch || superMatch || leaderMatch || deptMatch || batchMatch || yearMatch || statusMatch || techMatch || tagMatch || memberMatch;
        if (!matchesSearch) return false;
      }

      // 3. Department filter (when not locked, e.g. for Admin)
      if (!isDepartmentLocked && filters.department && filters.department !== 'All Departments') {
        const pDeptName = p.department?.name || (typeof p.department === 'string' ? p.department : '');
        const pDeptId = p.department?._id || p.department;
        const targetDept = filters.department;
        if (pDeptName !== targetDept && String(pDeptId) !== String(targetDept)) {
          return false;
        }
      }

      // 4. Academic Year filter
      if (filters.year && filters.year !== 'All Years') {
        const pYearStr = String(p.academicYear || p.year || '');
        if (pYearStr !== filters.year && !pYearStr.includes(filters.year)) {
          return false;
        }
      }

      // 5. Status filter
      if (filters.status && filters.status !== 'All Status') {
        if (p.status?.toLowerCase() !== filters.status.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [projects, searchQuery, filters, isDepartmentLocked, userDepartmentName, isHOD, isSupervisor, user]);

  return (
    <div className="w-full max-w-none space-y-6 pb-10 px-0 lg:px-0">
      {/* Error Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[200] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <X size={20} className="cursor-pointer" onClick={() => setError(null)} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Records</h1>
          <p className="text-gray-500 mt-1">
            {isHOD && userDepartmentName 
              ? `Department Project Database — ${userDepartmentName}`
              : isSupervisor && userDepartmentName
                ? `Department & Assigned Projects — ${userDepartmentName}`
                : 'Comprehensive database of all academic projects'}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title, team, supervisor, technology, year..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="relative">
            {isDepartmentLocked ? (
              <div className="relative" title={`Department locked to ${userDepartmentName || 'your assigned department'}`}>
                <select 
                  value={userDepartmentName || filters.department}
                  disabled={true}
                  className="w-full appearance-none bg-gray-100/90 border border-gray-200 rounded-xl px-4 py-2.5 outline-none text-sm text-gray-700 font-semibold cursor-not-allowed pr-10"
                >
                  <option value={userDepartmentName || filters.department}>
                    {userDepartmentName || 'Your Department'}
                  </option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 pointer-events-none">
                  <Lock size={14} className="text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <select 
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm pr-10 text-gray-800"
                >
                  <option value="All Departments">All Departments</option>
                  {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
          <div className="relative">
            <select 
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm pr-10"
            >
              <option value="All Years">All Years</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm pr-10"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-gray-900">{filteredProjects.length} Projects Found</h2>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Records: {projects.length}</span>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team & Supervisor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status & Grade</th>
                {['Supervisor', 'HOD', 'Admin'].includes(activeRole || user?.role) && (
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documentation</th>
                )}
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProjects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-6 max-w-sm">
                    <div className="space-y-2">
                       <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">{project.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies.slice(0, 3).map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900">{project.teamName}</p>
                      <p className="text-[11px] text-gray-500">Leader: {project.teamLeader?.name || 'Unassigned'}</p>
                      <p className="text-[11px] text-gray-500">Supervisor: {project.supervisor?.name || 'Unassigned'}</p>
                      <p className="text-[10px] text-blue-500 font-bold">{project.members?.length || 0} members</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-700">{project.department?.name || 'N/A'}</p>
                      <p className="text-[11px] text-gray-500">Batch: {project.batch || 'N/A'}</p>
                      <p className="text-[11px] text-gray-500">Year: {project.academicYear || project.year || 'N/A'}</p>
                    </div>
                  </td>
                  <td id={`project-status-cell-${project._id}`} className="px-6 py-6 font-medium">
                    <div className="space-y-1">
                      <div className="flex flex-col gap-1.5">
                        {(() => {
                          if (project.status === 'Proposed') return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-gray-100 text-gray-700 border border-gray-200">Proposed</span>;
                          if (project.status === 'Active') return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-blue-100 text-blue-700 border border-blue-200">In Progress</span>;
                          if (project.status === 'Completed') {
                            if (!project.isApprovedBySupervisor) return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">Pending Supervisor</span>;
                            if (!project.isApprovedByHOD) return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">Pending HOD</span>;
                            if (!project.isApprovedByAdmin) return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-red-100 text-red-800 border border-red-200 animate-pulse">Pending Admin</span>;
                            return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-green-100 text-green-800 border border-green-200">Completed (Pending Publish)</span>;
                          }
                          if (project.status === 'Approved') return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-green-100 text-green-800 border border-green-200">Approved</span>;
                          if (project.status === 'Published') return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-emerald-600 text-white shadow-md">Published</span>;
                          return <span id={`status-badge-${project._id}`} className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit shadow-sm bg-gray-150 text-gray-600">{project.status}</span>;
                        })()}
                        {project.grade ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl w-fit border border-indigo-100/50 shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Grade</span>
                            <span className="text-xs font-black">{project.grade}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold italic ml-2 mt-1">Not Graded</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {['Supervisor', 'HOD', 'Admin'].includes(activeRole) && (
                    <td id={`project-documentation-cell-${project._id}`} className="px-6 py-6 font-medium">
                      {(() => {
                        const doc = project.finalDocumentations && project.finalDocumentations[0];

                        if (doc) {
                          const isSupervisorApproved = doc.approvals?.some(a => a.role === 'Supervisor' && a.status === 'Approved') || 
                                                       ['Pending HOD', 'Pending Admin', 'Approved'].includes(doc.status);

                          const isHODApproved = doc.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved') || 
                                                ['Pending Admin', 'Approved'].includes(doc.status);

                          const isAdminApproved = doc.approvals?.some(a => a.role === 'Admin' && a.status === 'Approved') || 
                                                 doc.status === 'Approved';

                          return (
                            <div className="flex flex-col gap-1.5 max-w-[220px]">
                              <div className="flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-800 transition-colors">
                                <FileText size={16} />
                                <span className="text-xs truncate font-bold" title={doc.title}>
                                  {doc.title || 'Final Documentation'}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-1.5">
                                {doc.fileUrl && (
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerDirectDownload(doc.fileUrl, doc.title || project.title);
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-100 transition-all cursor-pointer shadow-2xs"
                                    title="Download original document file"
                                  >
                                    <Download size={11} />
                                    Download Doc
                                  </button>
                                )}
                                
                                {doc.links && doc.links.filter(Boolean).map((link, idx) => (
                                  <a 
                                    key={idx}
                                    href={link} 
                                    target="_blank" 
                                    referrerPolicy="no-referrer"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-all cursor-pointer"
                                    title={link}
                                  >
                                    Link {idx + 1}
                                  </a>
                                ))}
                              </div>

                              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100">
                                <div className="flex flex-col items-center justify-center p-1 rounded bg-slate-50 border border-slate-100/50">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block leading-tight">SUP</span>
                                  <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded mt-0.5 ${
                                    isSupervisorApproved 
                                      ? 'text-emerald-700 bg-emerald-50' 
                                      : 'text-amber-700 bg-amber-50'
                                  }`}>
                                    {isSupervisorApproved ? 'Approved' : 'Pending'}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col items-center justify-center p-1 rounded bg-slate-50 border border-slate-100/50">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block leading-tight">HOD</span>
                                  <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded mt-0.5 ${
                                    isHODApproved 
                                      ? 'text-emerald-700 bg-emerald-50' 
                                      : 'text-amber-700 bg-amber-50'
                                  }`}>
                                    {isHODApproved ? 'Approved' : 'Pending'}
                                  </span>
                                </div>

                                <div className="flex flex-col items-center justify-center p-1 rounded bg-slate-50 border border-slate-100/50">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block leading-tight">ADM</span>
                                  <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded mt-0.5 ${
                                    isAdminApproved 
                                      ? 'text-emerald-700 bg-emerald-50' 
                                      : 'text-amber-700 bg-amber-50'
                                  }`}>
                                    {isAdminApproved ? 'Approved' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-xs text-gray-400 italic">
                              No Doc Submitted
                            </div>
                          );
                        }
                      })()}
                    </td>
                  )}
                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2 xl:gap-3 max-w-[280px] ml-auto">
                      {/* Secondary Actions Group */}
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm">
                        {(project.status === 'Proposed' || project.status === 'Active') && (activeRole === 'Supervisor' || activeRole === 'Admin' || (activeRole === 'HOD' && (project.supervisor?._id === user?._id || project.supervisor === user?._id))) && (
                          <button 
                            id={`activate-btn-${project._id}`}
                            onClick={project.status === 'Proposed' ? () => handleActivate(project._id) : undefined}
                            disabled={project.status === 'Active' || submittingId === `activate-${project._id}`}
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all shadow-sm ${
                              project.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default opacity-90'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {project.status === 'Active' ? 'Activated' : 'Activate'}
                          </button>
                        )}
                        
                        {project.status === 'Completed' && (
                          <>
                            {/* Supervisor Approval Stage */}
                            {!project.isApprovedBySupervisor && (activeRole === 'Supervisor' || activeRole === 'Admin' || (activeRole === 'HOD' && (project.supervisor?._id === user?._id || project.supervisor === user?._id))) && (
                              <button 
                                onClick={() => handleApprove(project._id)}
                                disabled={submittingId === `approve-${project._id}`}
                                className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm"
                                title="Approve as Supervisor"
                              >
                                Approve (Supervisor)
                              </button>
                            )}

                            {/* HOD Approval Stage */}
                            {project.isApprovedBySupervisor && !project.isApprovedByHOD && (activeRole === 'HOD' || activeRole === 'Admin') && (
                              <button 
                                onClick={() => handleApprove(project._id)}
                                disabled={submittingId === `approve-${project._id}`}
                                className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-sm"
                                title="Approve as Department HOD"
                              >
                                Approve (HOD)
                              </button>
                            )}

                            {/* Admin Approval Stage */}
                            {project.isApprovedBySupervisor && project.isApprovedByHOD && !project.isApprovedByAdmin && activeRole === 'Admin' && (
                              <button 
                                onClick={() => handleApprove(project._id)}
                                disabled={submittingId === `approve-${project._id}`}
                                className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm"
                                title="Approve as Administrator"
                              >
                                Approve (Admin)
                              </button>
                            )}

                            {/* Reject action: visible if Completed but not fully Admin approved */}
                            {!project.isApprovedByAdmin && ['Supervisor', 'HOD', 'Admin'].includes(activeRole) && (
                              <button 
                                onClick={() => handleReject(project._id)}
                                disabled={submittingId === `reject-${project._id}`}
                                className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-white text-red-650 text-red-600 hover:bg-red-50 hover:text-white border border-red-150 shadow-sm transition-all"
                                title="Reject back to Active status so details can be revised"
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Primary Publish Action - Admin only when Admin approved */}
                      {activeRole === 'Admin' && (project.isApprovedByAdmin || project.status === 'Approved') && (
                        <button 
                          onClick={() => handlePublish(project._id)}
                          disabled={project.status === 'Published' || submittingId === `publish-${project._id}`}
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${project.status === 'Published' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100'}`}
                        >
                          {project.status === 'Published' ? 'Published' : 'Publish to Gallery'}
                        </button>
                      )}
                      
                      {/* Utility Actions */}
                      <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                        <button 
                          onClick={() => setSelectedProject(project)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(project)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(project._id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-[98vw] lg:max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto lg:my-6 max-h-[95vh] flex flex-col mx-auto text-left"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 sticky top-0 z-10 w-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                      {selectedProject.teamName || 'Active Team'}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1.5 select-all">{selectedProject.title}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* Visual Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Progress</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-indigo-600 break-all">{selectedProject.progress || 0}% Done</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedProject.progress || 0}%` }} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Status</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-indigo-600 break-all">
                      {(() => {
                        const status = selectedProject.status || 'Proposed';
                        if (status === 'Proposed' || status === 'Rejected') return 'Inactive';
                        if (status === 'Completed' || status === 'Published') return 'Completed';
                        return 'Activated';
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Current Phase</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-indigo-600 break-words">
                      {(() => {
                        const status = selectedProject.status || 'Proposed';
                        const hasSubmissions = selectedProject.finalDocumentations && selectedProject.finalDocumentations.length > 0;
                        if (status === 'Proposed' || status === 'Rejected') return 'Proposal';
                        if (status === 'Completed') return 'Completed (Final)';
                        if (status === 'Published') return 'Published';
                        return hasSubmissions ? 'In Progress' : 'Started';
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Batch</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-gray-800 break-all">{selectedProject.batch || 'N/A'}</p>
                  </div>
                </div>

                {/* Two Column details structure */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column (Details, Technology, Assets) */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={14} /> Description / Abstract
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                        {selectedProject.description || selectedProject.abstract || 'No description or abstract provided for this project.'}
                      </p>
                    </div>

                    {selectedProject.outcomes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Outcomes / Key Deliverables
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                          {selectedProject.outcomes}
                        </p>
                      </div>
                    )}

                    {/* Technologies & Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Code2 size={14} /> Technologies
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProject.technologies && selectedProject.technologies.length > 0 ? (
                            selectedProject.technologies.map((tech, i) => (
                              <span key={`tech-${i}`} className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                                {tech}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-medium text-gray-400 italic">No technologies listed</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Award size={14} /> Tags
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProject.tags && selectedProject.tags.length > 0 ? (
                            selectedProject.tags.map((tag, i) => (
                              <span key={`tag-${i}`} className="text-xs font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-medium text-gray-400 italic">No tags listed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* External Project Links & Assets */}
                    <div className="space-y-3 pt-2">
                       <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Links & Artifacts</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {selectedProject.githubLink ? (
                          <a 
                            href={selectedProject.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-xs font-bold text-slate-800"
                          >
                            <span>GitHub Repository</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl text-center text-xs font-medium italic">
                            No GitHub link
                          </div>
                        )}

                        {selectedProject.liveLink ? (
                          <a 
                            href={selectedProject.liveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all text-xs font-bold text-indigo-700"
                          >
                            <span>Live Project Link</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl text-center text-xs font-medium italic">
                            No Live Link
                          </div>
                        )}

                        {selectedProject.fileUrl ? (
                          <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl gap-2">
                            <span className="text-xs font-bold text-indigo-900 truncate flex-1 flex items-center gap-1.5">
                              <FileText size={14} className="text-indigo-600 shrink-0" />
                              Proposal Document
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerDirectDownload(selectedProject.fileUrl, `Proposal - ${selectedProject.title}`)}
                              title="Download Proposal Document"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl text-center text-xs font-medium italic">
                            No document file
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Approved Final Documentations Column History */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 font-sans">
                          <FileText size={14} className="text-indigo-600" />
                          Approved Final Documentations
                        </p>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-100 font-bold px-2 py-0.5 rounded-lg text-indigo-600 uppercase tracking-wide">
                          {selectedProject.finalDocumentations?.length || 0} active documents
                        </span>
                      </div>
                      
                      {!selectedProject.finalDocumentations || selectedProject.finalDocumentations.length === 0 ? (
                        <p className="text-xs text-gray-400 italic bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                          No final documentations approved or published yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedProject.finalDocumentations.map((doc, idx) => (
                            <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-gray-900 leading-snug">{doc.title}</p>
                                  <p className="text-[10px] text-gray-400 font-medium font-sans">Approved on {doc.approvedAt ? new Date(doc.approvedAt).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => triggerDirectDownload(doc.fileUrl, `${doc.title} (${selectedProject.title})`)}
                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                                    title="Download Document"
                                  >
                                    <Download size={13} />
                                    Download Doc
                                  </button>
                                </div>
                              </div>
                              {doc.history?.length > 0 && (
                                <div className="pt-2 border-t border-gray-50 space-y-1">
                                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1 font-sans mb-1 selection:bg-transparent">Document Version History</p>
                                  <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                                    {doc.history.map((ver, vidx) => (
                                      <div key={vidx} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100/50">
                                        <span className="text-[11px] text-gray-600 font-bold">Version {ver.version}</span>
                                        <button
                                          type="button"
                                          onClick={() => triggerDirectDownload(ver.fileUrl, `${doc.title} v${ver.version}`)}
                                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                          <Download size={11} />
                                          Download
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (Team Leadership & Member Contacts) */}
                  <div className="space-y-6">
                    {/* HOD/Department/Academic */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic Context</h4>
                      <div className="space-y-1.5 text-xs text-gray-700">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Department:</span>
                          <span className="font-bold">{selectedProject.department?.name || (typeof selectedProject.department === 'string' ? selectedProject.department : 'N/A')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Academic Year:</span>
                          <span className="font-bold">{selectedProject.academicYear || selectedProject.year || new Date().getFullYear().toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Project Batch:</span>
                          <span className="font-bold">{selectedProject.batch || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Contact Block */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-500" /> Supervisor Info
                      </h4>
                      {selectedProject.supervisor ? (
                        <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl border border-emerald-100 space-y-3">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            {selectedProject.supervisor.name}
                          </div>
                          
                          <div className="space-y-1.5 text-xs">
                            <a 
                              href={`mailto:${selectedProject.supervisor.email}`} 
                              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium break-all select-all transition-colors"
                            >
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              {selectedProject.supervisor.email}
                            </a>
                            {selectedProject.supervisor.phone ? (
                              <a 
                                href={`tel:${selectedProject.supervisor.phone}`} 
                                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium select-all transition-colors"
                              >
                                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                {selectedProject.supervisor.phone}
                              </a>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400 font-medium italic">
                                <Phone size={14} className="text-gray-300 flex-shrink-0" />
                                No phone listed
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No supervisor assigned</p>
                      )}
                    </div>

                    {/* Team Leader Contact Block */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Plus size={14} /> Team Leader Info
                      </h4>
                      {selectedProject.teamLeader ? (
                        <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl border border-indigo-100 space-y-3">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            {selectedProject.teamLeader.name}
                          </div>
                          
                          <div className="space-y-1.5 text-xs">
                            <a 
                              href={`mailto:${selectedProject.teamLeader.email}`} 
                              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium break-all select-all transition-colors"
                            >
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              {selectedProject.teamLeader.email}
                            </a>
                            {selectedProject.teamLeader.phone ? (
                              <a 
                                href={`tel:${selectedProject.teamLeader.phone}`} 
                                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium select-all transition-colors"
                              >
                                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                {selectedProject.teamLeader.phone}
                              </a>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400 font-medium italic">
                                <Phone size={14} className="text-gray-300 flex-shrink-0" />
                                No phone listed
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No team leader assigned</p>
                      )}
                    </div>

                    {/* Team Members Contact Block */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={14} /> Team Members ({selectedProject.members?.length || 0})
                      </h4>
                      <div className="space-y-3">
                        {selectedProject.members && selectedProject.members.length > 0 ? (
                          selectedProject.members.map((member, i) => (
                            <div key={`member-contact-${i}`} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                              <div className="font-bold text-gray-900 text-sm">
                                {member.name || (typeof member === 'string' ? member : 'N/A')}
                              </div>
                              <div className="space-y-1.5 text-xs">
                                {member.email ? (
                                  <a 
                                    href={`mailto:${member.email}`} 
                                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium break-all select-all transition-colors"
                                  >
                                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                    {member.email}
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-400 font-medium italic">
                                    <Mail size={14} className="text-gray-300 flex-shrink-0" />
                                    No email listed
                                  </div>
                                )}
                                {member.phone ? (
                                  <a 
                                    href={`tel:${member.phone}`} 
                                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium select-all transition-colors"
                                  >
                                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                    {member.phone}
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-400 font-medium italic">
                                    <Phone size={14} className="text-gray-300 flex-shrink-0" />
                                    No phone listed
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs text-gray-400 italic">
                            No crew members listed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback & Grading Section */}
                <div className="border-t border-gray-100 pt-8 space-y-6">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    Official Feedback & Grading
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                      {selectedProject.feedback?.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {selectedProject.feedback.map((fb, fidx) => (
                            <div key={fidx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100">
                                    {(fb.author?.name || 'R').charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700">{fb.author?.name || 'Academic Reviewer'}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{fb.author?.role || fb.role || 'Reviewer'}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                  {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
                                <span className="absolute top-2 left-2 text-gray-200 text-2xl font-serif select-none">&ldquo;</span>
                                <p className="text-xs text-gray-600 italic leading-relaxed relative z-10 px-4">
                                  {fb.content}
                                </p>
                                <span className="absolute bottom-2 right-2 text-gray-200 text-2xl font-serif select-none leading-none">&rdquo;</span>
                              </div>
                            </div>
                          ))}
                          {selectedProject.grade && (
                            <div className="flex items-center justify-between pt-2 px-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Status Grade</span>
                              <span className="px-4 py-1 bg-green-600 text-white rounded-lg font-black text-xs shadow-md shadow-green-100">{selectedProject.grade}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">No feedback provided yet.</p>
                      )}
                    </div>

                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Add Review & Grade</p>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Grade</label>
                        <input 
                          type="text" 
                          placeholder="e.g. A+, Excellent, B"
                          value={editingGrade}
                          onChange={(e) => setEditingGrade(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Comments</label>
                        <textarea 
                          placeholder="Provide detailed feedback..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                          rows={4}
                        />
                      </div>
                      <button 
                        onClick={() => handleFeedbackSubmit(selectedProject._id)}
                        disabled={submittingId === `feedback-${selectedProject._id}`}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                      >
                        {submittingId === `feedback-${selectedProject._id}` ? 'Saving...' : 'Save Feedback'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0 z-10 w-full">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Form Modal (Add/Edit) */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    {editingProject ? <Edit2 size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                    <p className="text-xs text-gray-500">Fill in the project details below</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Project Title</label>
                    <input 
                      required
                      type="text" 
                      value={projectForm.title || ''}
                      onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Team Name</label>
                    <input 
                      required
                      type="text" 
                      value={projectForm.teamName || ''}
                      onChange={(e) => setProjectForm({...projectForm, teamName: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Department</label>
                    <select 
                      required
                      value={projectForm.department || ''}
                      onChange={(e) => setProjectForm({...projectForm, department: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Supervisor</label>
                    <select 
                      required
                      value={projectForm.supervisor || ''}
                      onChange={(e) => setProjectForm({...projectForm, supervisor: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Supervisor</option>
                      {users.filter(u => u.role && (u.role.includes('Supervisor') || u.role.includes('HOD'))).map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">HOD</label>
                    <select 
                      required
                      value={projectForm.hod || ''}
                      onChange={(e) => setProjectForm({...projectForm, hod: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select HOD</option>
                      {users.filter(u => u.role === 'HOD').map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Team Leader</label>
                    <select 
                      required
                      value={projectForm.teamLeader || ''}
                      onChange={(e) => setProjectForm({...projectForm, teamLeader: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Team Leader</option>
                      {users.filter(u => u.role === 'Team Leader' || u.role === 'Team Member').map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Team Members</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl max-h-48 overflow-y-auto">
                      {users.filter(u => u.role === 'Team Member' || u.role === 'Team Leader').map(u => (
                        <label key={u._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                          <input 
                            type="checkbox"
                            checked={projectForm.members?.includes(u._id) || false}
                            onChange={(e) => {
                              const currentMembers = projectForm.members || [];
                              const newMembers = e.target.checked 
                                ? [...currentMembers, u._id]
                                : currentMembers.filter(id => id !== u._id);
                              setProjectForm({...projectForm, members: newMembers});
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{u.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic">* Select all students involved in this project</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                  <textarea 
                    rows={3}
                    value={projectForm.description || ''}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Academic Year</label>
                    <input 
                      type="text" 
                      value={projectForm.academicYear || ''}
                      onChange={(e) => setProjectForm({...projectForm, academicYear: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Batch</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2021-2025"
                      value={projectForm.batch || ''}
                      onChange={(e) => setProjectForm({...projectForm, batch: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Status</label>
                    <select 
                      value={projectForm.status || 'Proposed'}
                      onChange={(e) => setProjectForm({...projectForm, status: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {statuses.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Technologies (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="React, Node.js, MongoDB"
                    value={projectForm.technologies || ''}
                    onChange={(e) => setProjectForm({...projectForm, technologies: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">GitHub Link</label>
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      value={projectForm.githubLink || ''}
                      onChange={(e) => setProjectForm({...projectForm, githubLink: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Project File Link</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={projectForm.fileUrl || ''}
                      onChange={(e) => setProjectForm({...projectForm, fileUrl: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Live Demo Link</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={projectForm.liveLink || ''}
                      onChange={(e) => setProjectForm({...projectForm, liveLink: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox" 
                      id="isLiveLinkPublic"
                      checked={projectForm.isLiveLinkPublic}
                      onChange={(e) => setProjectForm({...projectForm, isLiveLinkPublic: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isLiveLinkPublic" className="text-sm font-bold text-gray-700">Make demo link public</label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isPublic"
                    checked={projectForm.isPublic}
                    onChange={(e) => setProjectForm({...projectForm, isPublic: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublic" className="text-sm font-bold text-gray-700">Make this project public</label>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
                  <button 
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingId === 'project-form'}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm disabled:opacity-50"
                  >
                    {submittingId === 'project-form' ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId)}
        title="Delete Project Record"
        message="Are you sure you want to permanently delete this project record? This action will remove all team mappings, documentation, and grades, and cannot be undone."
        confirmText="Yes, Delete Project"
        cancelText="Cancel"
        variant="danger"
        itemName={projects.find(p => p._id === deleteConfirmId)?.title || 'Project'}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc({ isOpen: false, fileUrl: '', title: '' })}
        fileUrl={viewerDoc.fileUrl}
        title={viewerDoc.title}
      />
    </div>
  );
};

export default ProjectRecords;
