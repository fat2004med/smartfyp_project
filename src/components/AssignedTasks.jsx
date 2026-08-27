import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  ArrowRight,
  Search,
  Upload,
  X,
  Link as LinkIcon,
  Send,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  File as FileIcon,
  Eye,
  Download
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const AssignedTasks = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const [submissionData, setSubmissionData] = useState({ link: '', file: null, comments: '' });
  const [reviewData, setReviewData] = useState({ status: 'Completed', feedback: '', grade: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
    };
    init();
  }, [fetchTasks]);

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await axios.put(`/api/tasks/${taskId}/status`, { status });
      toast.success(`Task status updated to ${status}`);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating task status');
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (submissionData.link) formData.append('link', submissionData.link);
      if (submissionData.comments) formData.append('comments', submissionData.comments);
      if (submissionData.file) formData.append('file', submissionData.file);

      await axios.put(`/api/tasks/${selectedTask._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Task submitted for review');
      setIsSubmitModalOpen(false);
      setSubmissionData({ link: '', file: null, comments: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting task');
    }
  };

  const handleReview = async (taskId, status) => {
    try {
      setIsSubmittingReview(true);
      await axios.put(`/api/tasks/${taskId}/review`, { 
        status, 
        grade: reviewData.grade, 
        feedback: reviewData.feedback 
      });
      toast.success(status === 'Completed' ? 'Task Approved' : 'Feedback Sent');
      setIsReviewModalOpen(false);
      setReviewData({ status: 'Completed', feedback: '', grade: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error reviewing task');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Reviewing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Blocked': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const taskAssigneeId = typeof task.assignee === 'object' && task.assignee !== null
      ? (task.assignee._id || task.assignee.id)?.toString()
      : task.assignee?.toString();
    const currentUserId = user?._id?.toString() || user?.id?.toString();

    // Only show tasks assigned to the logged-in user (unless viewing the 'To Review' tab)
    if (activeTab !== 'To Review') {
      const isAssignedToMe = taskAssigneeId === currentUserId;
      if (!isAssignedToMe) return false;
    }

    const statusMap = {
      'Pending': ['Pending', 'Not Started'],
      'In Progress': ['In Progress'],
      'Completed': ['Completed', 'Reviewing']
    };
    
    let matchesTab = activeTab === 'All' || 
                       (statusMap[activeTab] ? statusMap[activeTab].includes(task.status) : task.status === activeTab);
    
    // Custom logic for "To Review" tab
    if (activeTab === 'To Review') {
      const taskAssignedById = typeof task.assignedBy === 'object' && task.assignedBy !== null
        ? (task.assignedBy._id || task.assignedBy.id)?.toString()
        : task.assignedBy?.toString();
      const isAssignedByMe = taskAssignedById === currentUserId;
      matchesTab = task.status === 'Reviewing' && isAssignedByMe;
    }
    
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (task.assignedBy?.name && task.assignedBy.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-full max-w-none space-y-8 pb-12 px-0 lg:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assigned Tasks</h1>
          <p className="text-gray-500 mt-1">Track and complete tasks assigned to you</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          {(['Pending', 'In Progress', 'Completed'].concat(
            (['Admin', 'HOD', 'Supervisor', 'Team Leader'].includes(user?.role)) ? ['To Review'] : []
          ).concat(['All'])).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab === 'To Review' ? (
                <span className="flex items-center gap-2">
                  {tab}
                  {tasks.filter(t => t.status === 'Reviewing' && (t.assignedBy?._id === user?._id || t.assignedBy === user?._id)).length > 0 && (
                    <span className="w-4 h-4 bg-amber-400 text-amber-900 rounded-full flex items-center justify-center text-[8px] animate-pulse">
                      {tasks.filter(t => t.status === 'Reviewing' && (t.assignedBy?._id === user?._id || t.assignedBy === user?._id)).length}
                    </span>
                  )}
                </span>
              ) : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Search tasks..."
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
        />
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <motion.div
            layout
            key={task._id}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                task.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                task.status === 'Reviewing' ? 'bg-purple-50 text-purple-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {task.status === 'Completed' ? <CheckCircle2 size={28} /> : 
                 task.status === 'Reviewing' ? <Clock size={28} /> :
                 <CheckSquare size={28} />}
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadgeStyle(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium whitespace-nowrap">
                    <Clock size={14} />
                    Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    {task.description || "No description provided."}
                  </p>
                  
                  {task.status === 'Completed' && task.submission?.feedback && (
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                          <MessageSquare size={14} />
                          Reviewer&apos;s Feedback
                        </p>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black uppercase">Complete</span>
                      </div>
                      <p className="text-xs text-gray-800 font-medium italic border-l-2 border-amber-300 pl-3 leading-relaxed">
                        &quot;{task.submission.feedback}&quot;
                      </p>
                    </div>
                  )}

                  {task.submission?.link && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <LinkIcon size={12} className="text-blue-500" />
                        Your Submission
                      </p>
                      <a 
                        href={task.submission.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold text-xs truncate hover:underline flex items-center gap-1.5"
                      >
                        {task.submission.link}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold ring-2 ring-white">
                        {task.assignedBy?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Assigner</span>
                        <span className="text-xs font-bold text-gray-700">{task.assignedBy?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    {task.project?.title && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Project</span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {task.project.title}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {task.status === 'Reviewing' && (task.assignedBy?._id === user?._id || task.assignedBy === user?._id || user?.role === 'Admin') ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setReviewData({ status: 'Completed', feedback: '', grade: '' });
                          setIsReviewModalOpen(true);
                        }}
                        className="bg-amber-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2 ring-2 ring-amber-200 ring-offset-1"
                      >
                        <MessageSquare size={14} className="animate-pulse" />
                        GIVE FEEDBACK
                      </button>
                    ) : task.status === 'Reviewing' ? (
                      <div className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-[10px] font-bold border border-purple-100 flex items-center gap-1.5 whitespace-nowrap">
                        <Clock size={12} />
                        Under Review
                      </div>
                    ) : null}

                    {task.status === 'Not Started' || task.status === 'Pending' ? (
                      <button 
                        onClick={() => handleStatusUpdate(task._id, 'In Progress')}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                      >
                        Start Task
                        <ArrowRight size={14} />
                      </button>
                    ) : task.status === 'In Progress' ? (
                      <button 
                        onClick={() => {
                          setSelectedTask(task);
                          setIsSubmitModalOpen(true);
                        }}
                        className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                      >
                        <Upload size={14} />
                        Submit Work
                      </button>
                    ) : null}
                    
                    {task.status === 'Completed' && (
                      <button 
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsModalOpen(true);
                        }}
                        className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-amber-100 transition-all border border-amber-100 flex items-center gap-2 group/fb"
                      >
                        <MessageSquare size={14} className="group-hover/fb:scale-110 transition-transform" />
                        READ FEEDBACK
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDetailsModalOpen(true);
                      }}
                      className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-blue-600" title="View Details">
                      <ExternalLink size={18} />
                    </button>
                    <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400" title="Comments">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </div>

                {task.status === 'Reviewing' && (
                  <div className="mt-2 text-xs bg-purple-50 text-purple-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-purple-100">
                    <AlertCircle size={14} />
                    Ongoing review by {task.assignedBy?.name}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <CheckSquare size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
              <p className="text-gray-500">You&apos;re all caught up! No tasks match your current filter.</p>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
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
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Project: {selectedTask.project?.title || 'Personal'}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 uppercase tracking-tight">{selectedTask.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadgeStyle(selectedTask.status)}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned By</p>
                      <p className="text-sm font-bold text-gray-900">{selectedTask.assignedBy?.name || 'Unknown'}</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deadline</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedTask.submission && (
                    <div className="p-6 bg-green-50 border border-green-100 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Submission Info</p>
                        <span className="text-[10px] text-green-600 font-bold uppercase">
                          {selectedTask.submission.submittedAt ? new Date(selectedTask.submission.submittedAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedTask.submission.link && (
                          <a 
                            href={selectedTask.submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-white p-3 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors break-all"
                          >
                            <LinkIcon size={16} />
                            {selectedTask.submission.link}
                          </a>
                        )}
                        {selectedTask.submission.fileUrl && (
                          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-purple-100">
                            <span className="text-xs font-bold text-gray-700 truncate mr-2">Attached File</span>
                            <button 
                              type="button"
                              onClick={() => triggerDirectDownload(selectedTask.submission.fileUrl, `${selectedTask.title} Submission`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                              title="Download Attached File"
                            >
                              <Download size={14} />
                              Download File
                            </button>
                          </div>
                        )}
                        {selectedTask.submission.comments && (
                          <p className="text-xs text-gray-600 italic leading-relaxed">
                            &quot;{selectedTask.submission.comments}&quot;
                          </p>
                        )}
                        {(selectedTask.submission.grade || selectedTask.submission.feedback) && (
                          <div className="pt-4 border-t border-green-200 mt-4 space-y-2">
                             <p className="text-[10px] font-bold text-green-700 uppercase">Review Feedback</p>
                             {selectedTask.submission.grade && (
                               <p className="text-sm font-bold text-gray-900">Grade: <span className="text-green-600">{selectedTask.submission.grade}</span></p>
                             )}
                             {selectedTask.submission.feedback && (
                               <p className="text-xs text-gray-700 italic border-l-2 border-green-200 pl-3">
                                 &quot;{selectedTask.submission.feedback}&quot;
                               </p>
                             )}
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

      {/* Submit Work Modal */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubmitModalOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-100">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Submit Work</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Task: {selectedTask?.title}</p>
                  </div>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitWork} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon size={14} className="text-blue-500" />
                    Submission Link (Google Drive, GitHub, etc)
                  </label>
                  <input 
                    type="url"
                    placeholder="https://..."
                    value={submissionData.link || ''}
                    onChange={(e) => setSubmissionData({...submissionData, link: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileIcon size={14} className="text-purple-500" />
                    Attach File (Optional)
                  </label>
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file"
                      onChange={(e) => setSubmissionData({...submissionData, file: e.target.files[0]})}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center gap-3 px-5 py-4 bg-purple-50/50 border border-purple-100 rounded-2xl group-hover:bg-purple-50 transition-all border-dashed underline-offset-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                        <Upload size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-purple-900 truncate">
                          {submissionData.file ? submissionData.file.name : "Select or drag file here"}
                        </p>
                        <p className="text-[10px] text-purple-500 font-medium">PDF, ZIP, DOCX, etc.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Additional Comments</label>
                  <textarea 
                    placeholder="Describe your submission..."
                    rows={4}
                    value={submissionData.comments || ''}
                    onChange={(e) => setSubmissionData({...submissionData, comments: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-gray-300"
                  />
                </div>

                <div className="p-6 -mx-8 -mb-8 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm flex items-center gap-2"
                  >
                    <Send size={18} />
                    Confirm Submission
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Task Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedTask && (
          <div className="fixed inset-0 z-[120] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto border border-amber-100"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Provide Feedback</h2>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Reviewing work from: {selectedTask.assignee?.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-amber-100 rounded-xl transition-colors text-amber-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {selectedTask.submission && (
                  <div className="bg-amber-50/30 border border-amber-100 p-4 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Work Submitted</p>
                    {selectedTask.submission.link && (
                      <a href={selectedTask.submission.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold flex items-center gap-1.5 hover:underline">
                        <LinkIcon size={12} />
                        View Link
                      </a>
                    )}
                    {selectedTask.submission.comments && (
                      <p className="text-xs text-gray-600 italic leading-relaxed">
                        &quot;{selectedTask.submission.comments}&quot;
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Feedback / Comments</label>
                    <textarea 
                      placeholder="Share your thoughts on the work... what should be changed or improved?"
                      rows={4}
                      value={reviewData.feedback || ''}
                      onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Grade (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. A, Excellent"
                        value={reviewData.grade || ''}
                        onChange={(e) => setReviewData({...reviewData, grade: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    disabled={isSubmittingReview || !reviewData.feedback.trim()}
                    onClick={() => handleReview(selectedTask._id, 'Completed')}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                    Approve & Post Feedback
                  </button>
                  <button 
                    disabled={isSubmittingReview || !reviewData.feedback.trim()}
                    onClick={() => handleReview(selectedTask._id, 'In Progress')}
                    className="w-full bg-white text-gray-500 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-200 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Request Changes
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
    </div>
  );
};

export default AssignedTasks;
