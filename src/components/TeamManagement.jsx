import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  ChevronDown,
  Search,
  Mail, 
  Phone, 
  FileText, 
  Code2, 
  Award, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  Eye, 
  ChevronRight,
  Edit2,
  Download
} from 'lucide-react';
import { DocumentViewerModal } from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';
import ConfirmModal from './ConfirmModal';

const TeamManagement = () => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('Team Created Successfully!');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });

  const [teams, setTeams] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [potentialLeaders, setPotentialLeaders] = useState([]);
  const [potentialMembers, setPotentialMembers] = useState([]);
  const [depts, setDepts] = useState([]);

  const [newTeam, setNewTeam] = useState({
    teamName: '',
    title: '',
    supervisor: '',
    teamLeader: '',
    members: [],
    department: currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '',
    description: '',
    batch: '',
    academicYear: new Date().getFullYear().toString(),
    githubLink: '',
    fileUrl: '',
    liveLink: '',
    isLiveLinkPublic: false
  });

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, usersRes, deptsRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/users'),
        axios.get('/api/departments')
      ]);
      setTeams(projectsRes.data);
      const allUsers = usersRes.data;
      setSupervisors(allUsers.filter(u => u.role && (u.role.includes('Supervisor') || u.role.includes('HOD'))));
      setPotentialLeaders(allUsers.filter(u => u.role === 'Team Leader'));
      setPotentialMembers(allUsers.filter(u => u.role === 'Team Member'));
      setDepts(deptsRes.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
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

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Validate unique Team ID (case-insensitive check)
      if (newTeam.teamName && newTeam.teamName.trim() !== '') {
        const matchName = newTeam.teamName.trim().toLowerCase();
        const dupTeam = teams.find(t => 
          t.teamName && t.teamName.trim().toLowerCase() === matchName && 
          (!editingTeamId || t._id !== editingTeamId)
        );
        if (dupTeam) {
          throw new Error(`Team ID "${newTeam.teamName}" already exists. Please choose a unique Team ID.`);
        }
      }

      if (editingTeamId) {
        const { data } = await axios.put(`/api/projects/${editingTeamId}`, newTeam);
        setSuccessMessage('Team Updated Successfully!');
        setIsModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        if (selectedTeam && selectedTeam._id === editingTeamId) {
          setSelectedTeam(data);
        }
      } else {
        await axios.post('/api/projects', newTeam);
        setSuccessMessage('Team Created Successfully!');
        setIsModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      setNewTeam({ 
        teamName: '', 
        title: '', 
        supervisor: '', 
        teamLeader: '', 
        members: [], 
        department: currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '', 
        description: '',
        batch: '',
        academicYear: new Date().getFullYear().toString(),
        githubLink: '',
        fileUrl: '',
        liveLink: '',
        isLiveLinkPublic: false
      });
      setEditingTeamId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving team details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTeamClick = (team) => {
    setError(null);
    setEditingTeamId(team._id);
    setNewTeam({
      teamName: team.teamName || '',
      title: team.title || '',
      supervisor: team.supervisor?._id || team.supervisor || '',
      teamLeader: team.teamLeader?._id || team.teamLeader || '',
      members: team.members?.map(m => m._id || m) || [],
      department: team.department?._id || team.department || '',
      description: team.description || '',
      batch: team.batch || '',
      academicYear: team.academicYear || new Date().getFullYear().toString(),
      githubLink: team.githubLink || '',
      fileUrl: team.fileUrl || '',
      liveLink: team.liveLink || '',
      isLiveLinkPublic: team.isLiveLinkPublic ?? false
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setEditingTeamId(null);
    setNewTeam({ 
      teamName: '', 
      title: '', 
      supervisor: '', 
      teamLeader: '', 
      members: [], 
      department: currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '', 
      description: '',
      batch: '',
      academicYear: new Date().getFullYear().toString(),
      githubLink: '',
      fileUrl: '',
      liveLink: '',
      isLiveLinkPublic: false
    });
  };

  const handleDeleteTeam = async (id) => {
    setError(null);
    const toastId = toast.loading('Deleting team...');
    try {
      await axios.delete(`/api/projects/${id}`);
      toast.success('Team deleted successfully!', { id: toastId });
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error deleting team';
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    }
  };

  const toggleMember = (memberId) => {
    setNewTeam(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(m => m !== memberId)
        : [...prev.members, memberId]
    }));
  };

  const assignedLeaderIds = new Set();
  const assignedMemberIds = new Set();

  teams.forEach(team => {
    if (editingTeamId && team._id === editingTeamId) {
      return;
    }
    
    if (team.teamLeader) {
      const leaderId = typeof team.teamLeader === 'object' ? team.teamLeader._id : team.teamLeader;
      if (leaderId) assignedLeaderIds.add(leaderId.toString());
    }
    
    if (team.members && Array.isArray(team.members)) {
      team.members.forEach(m => {
        const memberId = typeof m === 'object' ? m._id : m;
        if (memberId) assignedMemberIds.add(memberId.toString());
      });
    }
  });

  const filteredLeaders = potentialLeaders.filter(l => {
    const leaderIdStr = l._id?.toString();
    if (editingTeamId && newTeam.teamLeader && newTeam.teamLeader === leaderIdStr) {
      return true;
    }
    return !assignedLeaderIds.has(leaderIdStr) && !assignedMemberIds.has(leaderIdStr);
  });

  const filteredMembers = potentialMembers.filter(m => {
    const memberIdStr = m._id?.toString();
    if (editingTeamId && newTeam.members && newTeam.members.includes(memberIdStr)) {
      return true;
    }
    return !assignedLeaderIds.has(memberIdStr) && !assignedMemberIds.has(memberIdStr);
  });

  const filteredTeams = teams.filter(team => 
    (team.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.teamName && team.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-[1700px] mx-auto space-y-6 pb-10 relative px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
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
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 size={20} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage project teams and their progress</p>
        </div>
         <button 
          onClick={() => {
            setError(null);
            setEditingTeamId(null);
            const userDeptId = currentUser?.role !== 'Admin' ? (currentUser?.department?._id || currentUser?.department || '') : '';
            setNewTeam({
              teamName: '', 
              title: '', 
              supervisor: '', 
              teamLeader: '', 
              members: [], 
              department: userDeptId, 
              description: '',
              batch: '',
              academicYear: new Date().getFullYear().toString(),
              githubLink: '',
              fileUrl: '',
              liveLink: '',
              isLiveLinkPublic: false
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search teams or projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm shadow-sm"
        />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTeams.map((team) => (
          <motion.div 
            layout
            key={team._id}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4 relative group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{team.title}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-600 mt-1">
                  {team.status}
                </span>
                {team.teamName && <p className="text-xs text-blue-600 font-bold mt-1">Team ID: {team.teamName}</p>}
              </div>
              <div className="flex items-center gap-2 transition-all">
                <button className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors" onClick={() => handleEditTeamClick(team)} title="Edit Team">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" onClick={() => setDeleteConfirmId(team._id)} title="Delete Team">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</p>
                <p className="text-sm font-bold text-gray-800">{team.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supervisor</p>
                <p className="text-sm font-bold text-gray-800">{team.supervisor?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Leader</p>
                <p className="text-sm font-bold text-gray-800">{team.teamLeader?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Members ({team.members?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {team.members?.map((member, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                      {member.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-indigo-600">{team.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${team.progress || 0}%` }} />
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                <div className="flex items-center gap-2">
                  {team.teamLeader?.email && (
                    <a href={`mailto:${team.teamLeader.email}`} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors">
                      <Mail size={16} />
                    </a>
                  )}
                  {team.teamLeader?.phone && (
                    <a href={`tel:${team.teamLeader.phone}`} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors">
                      <Phone size={16} />
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedTeam(team)}
                  className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-gray-900">{editingTeamId ? 'Edit Team Details' : 'Create New Team'}</h2>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="p-6 space-y-5 overflow-y-auto flex-1">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Project Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter project title"
                    value={newTeam.title || ''}
                    onChange={(e) => setNewTeam({...newTeam, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Team ID</label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter Team ID"
                    value={newTeam.teamName || ''}
                    onChange={(e) => setNewTeam({...newTeam, teamName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Department</label>
                  <div className="relative">
                    <select 
                      required
                      disabled={currentUser?.role !== 'Admin'}
                      value={newTeam.department || ''}
                      onChange={(e) => setNewTeam({...newTeam, department: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none disabled:bg-gray-100 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Department</option>
                      {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Supervisor</label>
                    <div className="relative">
                      <select 
                        required
                        value={newTeam.supervisor || ''}
                        onChange={(e) => setNewTeam({...newTeam, supervisor: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Select Supervisor</option>
                        {supervisors.map(s => <option key={s._id} value={s._id}>{s.name} ({s.department?.name})</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Team Leader</label>
                    <div className="relative">
                      <select 
                        required
                        value={newTeam.teamLeader || ''}
                        onChange={(e) => setNewTeam({...newTeam, teamLeader: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Select Team Leader</option>
                        {filteredLeaders.map(l => <option key={l._id} value={l._id}>{l.name} ({l.department?.name})</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Batch</label>
                    <input 
                      type="text"
                      placeholder="e.g. 2021-2025"
                      value={newTeam.batch || ''}
                      onChange={(e) => setNewTeam({...newTeam, batch: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Academic Year</label>
                    <input 
                      type="text"
                      placeholder="e.g. 2024"
                      value={newTeam.academicYear || ''}
                      onChange={(e) => setNewTeam({...newTeam, academicYear: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea 
                    required
                    placeholder="Briefly describe the project goals..."
                    value={newTeam.description || ''}
                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">GitHub Repository Link</label>
                    <input 
                      type="url"
                      placeholder="https://github.com/username/project"
                      value={newTeam.githubLink || ''}
                      onChange={(e) => setNewTeam({...newTeam, githubLink: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Project File Link</label>
                    <input 
                      type="url"
                      placeholder="Link to project zip or document"
                      value={newTeam.fileUrl || ''}
                      onChange={(e) => setNewTeam({...newTeam, fileUrl: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Live Project Link (Optional)</label>
                    <input 
                      type="url"
                      placeholder="https://my-live-project.com"
                      value={newTeam.liveLink || ''}
                      onChange={(e) => setNewTeam({...newTeam, liveLink: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-3 px-1">
                    <input 
                      type="checkbox"
                      id="isLiveLinkPublic"
                      checked={newTeam.isLiveLinkPublic || false}
                      onChange={(e) => setNewTeam({...newTeam, isLiveLinkPublic: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="isLiveLinkPublic" className="text-sm font-bold text-gray-600 cursor-pointer select-none">
                      Show Link Publicly on Portal
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Team Members</label>
                  <div className="grid grid-cols-1 gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                    {filteredMembers.map(member => (
                      <label key={member._id} className="flex items-center gap-2 cursor-pointer group p-1 hover:bg-white rounded transition-colors">
                        <input 
                          type="checkbox"
                          style={{ accentColor: '#4f46e5' }}
                          checked={newTeam.members.includes(member._id)}
                          onChange={() => toggleMember(member._id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{member.name}</span>
                          <span className="text-[10px] text-gray-400">{member.department?.name || 'No Dept'} • {member.studentRegNo || 'No Reg No'}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:flex-1 px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <X size={20} />
                      </motion.div>
                    ) : (
                      editingTeamId ? 'Update Details' : 'Create Team'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Details Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTeam(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                      {selectedTeam.teamName || 'Active Team'}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1.5 select-all">{selectedTeam.title}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTeam(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* Visual Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Progress</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-indigo-600 break-all">{selectedTeam.progress || 0}% Done</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedTeam.progress || 0}%` }} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Status</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-indigo-600 break-all">
                      {(() => {
                        const status = selectedTeam.status || 'Proposed';
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
                        const status = selectedTeam.status || 'Proposed';
                        const hasSubmissions = selectedTeam.finalDocumentations && selectedTeam.finalDocumentations.length > 0;
                        if (status === 'Proposed' || status === 'Rejected') return 'Proposal';
                        if (status === 'Completed') return 'Completed (Final)';
                        if (status === 'Published') return 'Published';
                        return hasSubmissions ? 'In Progress' : 'Started';
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Batch</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-gray-800 break-all">{selectedTeam.batch || 'N/A'}</p>
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
                        {selectedTeam.description || selectedTeam.abstract || 'No description or abstract provided for this project.'}
                      </p>
                    </div>

                    {selectedTeam.outcomes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Outcomes / Key Deliverables
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                          {selectedTeam.outcomes}
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
                          {selectedTeam.technologies && selectedTeam.technologies.length > 0 ? (
                            selectedTeam.technologies.map((tech, i) => (
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
                          {selectedTeam.tags && selectedTeam.tags.length > 0 ? (
                            selectedTeam.tags.map((tag, i) => (
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
                        {selectedTeam.githubLink ? (
                          <a 
                            href={selectedTeam.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
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

                        {selectedTeam.liveLink ? (
                          <a 
                            href={selectedTeam.liveLink}
                            target="_blank"
                            rel="noopener noreferrer"
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

                        {selectedTeam.fileUrl ? (
                          <button 
                            type="button"
                            onClick={() => triggerDirectDownload(selectedTeam.fileUrl, `${selectedTeam.name || selectedTeam.teamName || 'Proposal Document'}`)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer"
                            title="Download Original Proposal Document"
                          >
                            <Download size={14} /> Download Proposal Doc
                          </button>
                        ) : (
                          <div className="p-3 bg-gray-50 border border-gray-100 text-gray-400 rounded-xl text-center text-xs font-medium italic">
                            No document file
                          </div>
                        )}
                      </div>
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
                          <span className="font-bold">{selectedTeam.department?.name || 'Computer Science'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Academic Year:</span>
                          <span className="font-bold">{selectedTeam.academicYear || new Date().getFullYear().toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">Project Batch:</span>
                          <span className="font-bold">{selectedTeam.batch || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Contact Block */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-500" /> Supervisor Info
                      </h4>
                      {selectedTeam.supervisor ? (
                        <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl border border-emerald-100 space-y-3">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            {selectedTeam.supervisor.name}
                          </div>
                          
                          <div className="space-y-1.5 text-xs">
                            <a 
                              href={`mailto:${selectedTeam.supervisor.email}`} 
                              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium break-all select-all transition-colors"
                            >
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              {selectedTeam.supervisor.email}
                            </a>
                            {selectedTeam.supervisor.phone ? (
                              <a 
                                href={`tel:${selectedTeam.supervisor.phone}`} 
                                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium select-all transition-colors"
                              >
                                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                {selectedTeam.supervisor.phone}
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
                      {selectedTeam.teamLeader ? (
                        <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl border border-indigo-100 space-y-3">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            {selectedTeam.teamLeader.name}
                          </div>
                          
                          <div className="space-y-1.5 text-xs">
                            <a 
                              href={`mailto:${selectedTeam.teamLeader.email}`} 
                              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium break-all select-all transition-colors"
                            >
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              {selectedTeam.teamLeader.email}
                            </a>
                            {selectedTeam.teamLeader.phone && (
                              <a 
                                href={`tel:${selectedTeam.teamLeader.phone}`} 
                                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium select-all transition-colors"
                              >
                                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                {selectedTeam.teamLeader.phone}
                              </a>
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
                        <Users size={14} /> Team Members ({selectedTeam.members?.length || 0})
                      </h4>
                      <div className="space-y-3">
                        {selectedTeam.members && selectedTeam.members.length > 0 ? (
                          selectedTeam.members.map((member, i) => (
                            <div key={`member-contact-${i}`} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                              <div className="font-bold text-gray-900 text-sm">
                                {member.name}
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <a 
                                  href={`mailto:${member.email}`} 
                                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium break-all select-all transition-colors"
                                >
                                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                  {member.email}
                                </a>
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

              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                <button 
                  onClick={() => setSelectedTeam(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl text-center transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDeleteTeam(deleteConfirmId)}
        title="Delete Team"
        message="Are you sure you want to permanently delete this team? This action will remove the team, its project information, and cannot be undone."
        confirmText="Yes, Delete Team"
        cancelText="Cancel"
        variant="danger"
        itemName={teams.find(t => t._id === deleteConfirmId)?.title || teams.find(t => t._id === deleteConfirmId)?.name || 'Team'}
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

export default TeamManagement;
