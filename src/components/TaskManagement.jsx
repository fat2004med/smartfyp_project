import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit2,
  Trash2,
  Users, 
  Calendar, 
  Search, 
  Filter,
  ChevronRight,
  Target,
  Send,
  X,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  File as FileIcon,
  Download
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import ConfirmModal from './ConfirmModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const TaskManagement = () => {
  const { user } = useAuth();
  const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState([]);
  const [potentialAssignees, setPotentialAssignees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewData, setReviewData] = useState({ grade: '', feedback: '' });
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    project: '',
    assignee: '',
    deadline: '',
    priority: 'Medium',
    description: '',
    category: 'Development'
  });

  const fetchData = useCallback(async () => {
    try {
      const requests = [
        axios.get('/api/tasks'),
        axios.get('/api/projects')
      ];

      // Only fetch users if authorized (Admin, HOD, Supervisor, Team Leader)
      const canViewUsers = ['Admin', 'HOD', 'Supervisor', 'Team Leader'].includes(activeRole);
      if (canViewUsers) {
        requests.push(axios.get('/api/users'));
      }

      const results = await Promise.all(requests);
      
      const fetchedTasks = results[0].data;
      const fetchedProjects = results[1].data;
      setTasks(fetchedTasks);
      
      let filteredProjects = fetchedProjects;
      if (activeRole === 'Supervisor') {
        filteredProjects = fetchedProjects.filter(p => (p.supervisor?._id || p.supervisor) === user?._id);
      } else if (activeRole === 'HOD') {
        const deptId = user?.department?._id || user?.department;
        filteredProjects = fetchedProjects.filter(p => (p.department?._id || p.department) === deptId);
      } else if (activeRole === 'Team Leader') {
        const myProj = fetchedProjects.find(p => (p.teamLeader?._id || p.teamLeader) === user?._id);
        filteredProjects = myProj ? [myProj] : [];
      }
      setProjects(filteredProjects);
      
      if (canViewUsers && results[2]) {
        const allUsers = results[2].data;
        if (activeRole === 'Team Leader') {
          const myProject = fetchedProjects.find(p => (p.teamLeader?._id || p.teamLeader) === user?._id);
          if (myProject) {
            const memberIds = (myProject.members || []).map(m => m._id || m);
            const teamAssignees = allUsers.filter(u => memberIds.includes(u._id));
            setPotentialAssignees(teamAssignees);
            setNewTask(prev => ({ ...prev, project: myProject._id }));
          } else {
            setPotentialAssignees([]);
          }
        } else if (activeRole === 'Supervisor') {
          // supervisor should assign only to members/TLs of projects they supervise
          const supervisedProjects = fetchedProjects.filter(p => (p.supervisor?._id || p.supervisor) === user?._id);
          const allowedUserIds = new Set();
          supervisedProjects.forEach(p => {
            if (p.teamLeader) allowedUserIds.add(p.teamLeader._id || p.teamLeader);
            (p.members || []).forEach(m => allowedUserIds.add(m._id || m));
          });
          const teamAssignees = allUsers.filter(u => allowedUserIds.has(u._id));
          setPotentialAssignees(teamAssignees);
        } else if (activeRole === 'HOD') {
          // HOD assigns to users in their department
          const deptId = user?.department?._id || user?.department;
          const deptProjects = fetchedProjects.filter(p => (p.department?._id || p.department) === deptId);
          const allowedUserIds = new Set();
          deptProjects.forEach(p => {
            if (p.teamLeader) allowedUserIds.add(p.teamLeader._id || p.teamLeader);
            (p.members || []).forEach(m => allowedUserIds.add(m._id || m));
          });
          const teamAssignees = allUsers.filter(u => allowedUserIds.has(u._id) || (u.department?._id || u.department) === deptId);
          setPotentialAssignees(teamAssignees);
        } else {
          setPotentialAssignees(allUsers.filter(u => ['Team Member', 'Team Leader'].includes(u.role)));
        }
      }
    } catch (error) {
      console.error('Error fetching task management data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, activeRole]);

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, [fetchData]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        project: newTask.project
      };
      if (newTask._id) {
        await axios.put(`/api/tasks/${newTask._id}`, taskData);
        toast.success('Task updated successfully');
      } else {
        await axios.post('/api/tasks', taskData);
        toast.success('Task assigned successfully');
      }
      setIsAssignModalOpen(false);
      const myProject = projects.find(p => (p.teamLeader?._id || p.teamLeader) === user?._id);
      setNewTask({
        title: '',
        project: myProject ? myProject._id : '',
        assignee: '',
        deadline: '',
        priority: 'Medium',
        description: '',
        category: 'Development'
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing task');
    }
  };

  const handleDeleteTask = async (taskToDelete) => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/tasks/${taskToDelete._id}`);
      toast.success('Task deleted successfully');
      setDeleteConfirmTask(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-600 border-red-200';
      case 'High': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'Medium': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleReview = async (taskId, status) => {
    try {
      await axios.put(`/api/tasks/${taskId}/review`, { 
        status, 
        grade: reviewData.grade, 
        feedback: reviewData.feedback 
      });
      toast.success(`Task ${status === 'Completed' ? 'Approved' : 'Sent back for changes'}`);
      setIsReviewModalOpen(false);
      setReviewData({ grade: '', feedback: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating status');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-[1700px] mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500 mt-1">Assign and monitor tasks for your team members or groups</p>
        </div>
        <button 
          onClick={() => {
            const myProject = projects.find(p => (p.teamLeader?._id || p.teamLeader) === user?._id);
            setNewTask({
              title: '',
              project: myProject ? myProject._id : '',
              assignee: '',
              deadline: '',
              priority: 'Medium',
              description: '',
              category: 'Development'
            });
            setIsAssignModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Assign New Task
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search tasks by title or assignee..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter || 'All'}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Reviewing">To Review</option>
            <option value="Completed">Completed</option>
          </select>
          <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center justify-center gap-3 shadow-sm">
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Active</p>
            <p className="text-lg font-bold text-gray-900 leading-none">{tasks.filter(t => t.status !== 'Completed').length}</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Done</p>
            <p className="text-lg font-bold text-green-600 leading-none">{tasks.filter(t => t.status === 'Completed').length}</p>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTasks.map((task) => (
          <motion.div
            layout
            key={task._id}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${getPriorityStyle(task.priority)}`}>
                  {task.priority || 'Medium'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{task.category || 'Task'}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setNewTask({
                      _id: task._id,
                      title: task.title,
                      project: task.project?._id || '',
                      assignee: task.assignee?._id || '',
                      deadline: task.deadline ? task.deadline.split('T')[0] : '',
                      priority: task.priority,
                      description: task.description,
                      category: task.category || 'Development'
                    });
                    setIsAssignModalOpen(true);
                  }}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
                  title="Edit Task"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setDeleteConfirmTask(task)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" 
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.title}</h3>
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 font-bold text-gray-700">
                    <Users size={14} className="text-blue-500" />
                    {task.assignee?.name || 'Unassigned'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {task.project?.title && (
                   <span className="text-[10px] font-medium text-gray-400 italic">Project: {task.project.title}</span>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  task.status === 'Completed' ? 'bg-green-500' : 
                  task.status === 'Reviewing' ? 'bg-purple-500' :
                  'bg-blue-500'
                }`} />
                <span className={`text-[10px] font-bold uppercase ${
                   task.status === 'Completed' ? 'text-green-600' : 
                   task.status === 'Reviewing' ? 'text-purple-600' :
                   'text-blue-600'
                }`}>{task.status}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {task.status === 'Reviewing' && (task.assignedBy?._id === user?._id || task.assignedBy === user?._id || activeRole === 'Admin') && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                      setIsReviewModalOpen(true);
                    }}
                    className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-100 ring-2 ring-amber-200 ring-offset-1"
                  >
                    <MessageSquare size={14} className="animate-pulse" />
                    REVIEW & FEEDBACK
                  </button>
                )}
                {task.status === 'Completed' && task.submission?.feedback && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                      setIsDetailsModalOpen(true);
                    }}
                    className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-all flex items-center gap-1.5 border border-green-100"
                  >
                    <MessageSquare size={12} />
                    FEEDBACK SENT
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedTask(task);
                    setIsDetailsModalOpen(true);
                  }}
                  className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">No tasks found. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto border border-blue-100 flex flex-col max-h-[95vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Target size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{newTask._id ? 'Edit Task' : 'Assign New Task'}</h2>
                </div>
                <button 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <form id="assign-task-form" onSubmit={handleAssignTask} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., Finalize System Architecture"
                      value={newTask.title || ''}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project</label>
                      <select 
                        required
                        disabled={activeRole === 'Team Leader'}
                        value={newTask.project || ''}
                        onChange={(e) => setNewTask({...newTask, project: e.target.value})}
                        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${activeRole === 'Team Leader' ? 'opacity-75 cursor-not-allowed bg-gray-100' : ''}`}
                      >
                        <option value="">Select Project</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign To</label>
                      <select 
                        required
                        value={newTask.assignee || ''}
                        onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="">Select Assignee</option>
                        {potentialAssignees.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Due Date</label>
                      <input 
                        type="date"
                        required
                        value={newTask.deadline || ''}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                      <select 
                        value={newTask.priority || 'Medium'}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      placeholder="Provide detailed instructions for the task..."
                      value={newTask.description || ''}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      rows={4}
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  form="assign-task-form"
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm flex items-center gap-2"
                >
                  <Send size={18} />
                  {newTask._id ? 'Update Task' : 'Assign Task'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Review Work Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedTask && (
          <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Task Review & Feedback</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Project: {selectedTask.project?.title}</p>
                  </div>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submission Link</p>
                      <a 
                        href={selectedTask.submission?.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:underline break-all"
                      >
                        <ExternalLink size={14} />
                        View Work
                      </a>
                    </div>
                    {selectedTask.submission?.fileUrl && (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attached File</p>
                        <button 
                          type="button"
                          onClick={() => triggerDirectDownload(selectedTask.submission.fileUrl, `${selectedTask.title} Submission File`)}
                          className="text-white font-bold text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                          title="Download Original File"
                        >
                          <Download size={13} />
                          Download Attached File
                        </button>
                      </div>
                    )}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitter</p>
                       <p className="text-sm font-bold text-gray-800">{selectedTask.assignee?.name}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review Comments / Feedback</p>
                    <textarea 
                      placeholder="Write your feedback here... (Required for completion)"
                      rows={4}
                      required
                      value={reviewData.feedback || ''}
                      onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                    disabled={!reviewData.feedback.trim()}
                    onClick={() => handleReview(selectedTask._id, 'Completed')}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                  >
                    <CheckCircle size={20} />
                    Post Feedback & Complete Task
                  </button>
                  <button 
                    onClick={() => handleReview(selectedTask._id, 'In Progress')}
                    className="w-full bg-white text-gray-500 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Request Changes (In Progress)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Task Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedTask && (
          <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <Target size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">{selectedTask.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityStyle(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-blue-50 text-blue-600 border-blue-100">
                      {selectedTask.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assignee</p>
                      <p className="font-bold text-gray-800">{selectedTask.assignee?.name || 'Unassigned'}</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Project</p>
                      <p className="font-bold text-gray-800">{selectedTask.project?.title || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedTask.status === 'Reviewing' && (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare size={14} />
                          Needs Your Review
                        </p>
                        <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-black">PENDING</span>
                      </div>
                      <p className="text-xs text-amber-600">This task has work submitted and is waiting for your feedback and approval.</p>
                      <button 
                        onClick={() => {
                          setIsDetailsModalOpen(false);
                          setReviewData({ grade: selectedTask.submission?.grade || '', feedback: selectedTask.submission?.feedback || '' });
                          setIsReviewModalOpen(true);
                        }}
                        className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        START REVIEW & GIVE FEEDBACK
                      </button>
                    </div>
                  )}

                  {selectedTask.submission && (
                    <div className="p-6 bg-purple-50 border border-purple-100 rounded-2xl space-y-4">
                      <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Submission Status</p>
                      <div className="space-y-3">
                        {selectedTask.submission.link && (
                          <a 
                            href={selectedTask.submission.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 bg-white p-3 rounded-xl border border-blue-100 hover:bg-blue-50 transition-all font-bold text-xs"
                          >
                            <ExternalLink size={14} />
                            View Attached Work
                          </a>
                        )}
                        {selectedTask.submission.fileUrl && (
                          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100">
                            <span className="text-xs font-bold text-gray-700 truncate mr-2">Attached File</span>
                            <button 
                              type="button"
                              onClick={() => triggerDirectDownload(selectedTask.submission.fileUrl, `${selectedTask.title} Submission File`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                              title="Download Attached File"
                            >
                              <Download size={13} />
                              Download File
                            </button>
                          </div>
                        )}
                        {selectedTask.submission.grade && (
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-gray-500">Grade:</span>
                             <span className="text-sm font-bold text-green-600">{selectedTask.submission.grade}</span>
                          </div>
                        )}
                        {selectedTask.submission.feedback && (
                          <div className="bg-white/50 p-3 rounded-xl border border-purple-100">
                             <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Review Feedback</p>
                             <p className="text-xs text-gray-700 italic border-l-2 border-purple-200 pl-3">
                               &quot;{selectedTask.submission.feedback}&quot;
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 -mx-8 -mb-8 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
                  <button 
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-8 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc({ isOpen: false, fileUrl: '', title: '' })}
        fileUrl={viewerDoc.fileUrl}
        title={viewerDoc.title}
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmTask}
        onClose={() => setDeleteConfirmTask(null)}
        onConfirm={() => handleDeleteTask(deleteConfirmTask)}
        isLoading={isDeleting}
        title="Confirm Task Deletion"
        message="Are you sure you want to delete this task? Any submissions or feedback associated with this task will be permanently removed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmTask ? deleteConfirmTask.title : null}
      />
    </div>
  );
};

export default TaskManagement;
