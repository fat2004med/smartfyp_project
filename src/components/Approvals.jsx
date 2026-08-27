import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const Approvals = () => {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const [showToast, setShowToast] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsRes, submissionsRes] = await Promise.all([
        axios.get(`/api/projects?t=${Date.now()}`),
        axios.get(`/api/submissions?t=${Date.now()}`)
      ]);

      const projectsData = projectsRes.data || [];
      const submissionsData = submissionsRes.data || [];

      const list = [];

      // Process Projects
      projectsData.forEach(p => {
        // For Admin in hierarchical flow, only projects approved by HOD are pending Admin action
        if (activeRole === 'Admin' && !p.isApprovedByHOD && p.status !== 'Approved' && p.status !== 'Rejected') {
          return;
        }

        let status = 'Pending';
        if (p.status === 'Approved' || (p.isApprovedBySupervisor && p.isApprovedByHOD && p.isApprovedByAdmin)) {
          status = 'Approved';
        } else if (p.status === 'Rejected') {
          status = 'Rejected';
        } else if (activeRole === 'HOD' && p.isApprovedByHOD) {
          status = 'Approved';
        } else if (activeRole === 'Supervisor' && p.isApprovedBySupervisor) {
          status = 'Approved';
        } else {
          status = 'Pending';
        }

        list.push({
          id: p._id,
          rawId: p._id,
          rawStatus: p.status,
          category: 'project',
          type: 'Project Proposal',
          title: p.title,
          submittedBy: p.teamLeader?.name || 'Student Team',
          leader: p.teamLeader?.name || 'N/A',
          date: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : 'Recent',
          status,
          priority: 'High',
          description: p.description || p.abstract || 'Project Proposal submission seeking faculty endorsement.',
          supervisor: p.supervisor?.name || 'Unassigned',
          department: p.department?.name || 'Computer Science',
          isApprovedBySupervisor: p.isApprovedBySupervisor,
          isApprovedByHOD: p.isApprovedByHOD,
          isApprovedByAdmin: p.isApprovedByAdmin
        });
      });

      // Process Submissions
      submissionsData.forEach(s => {
        const isFinal = s.isFinalDocumentation === true || s.phase === 'Final';
        const isHodApproved = s.status === 'Pending Admin' || 
                              s.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved') ||
                              s.status === 'Approved' ||
                              s.status === 'Rejected';

        // For HOD: show final documentation or submissions pending HOD
        if (activeRole === 'HOD' && !isFinal && s.status !== 'Pending HOD') return;

        // For Admin: ONLY final documentation submissions after approved by HOD, or pending Admin
        if (activeRole === 'Admin' && (!isFinal || !isHodApproved) && s.status !== 'Pending Admin') return;

        let status = 'Pending';
        if (s.status === 'Approved') {
          status = 'Approved';
        } else if (s.status === 'Rejected') {
          status = 'Rejected';
        } else if (activeRole === 'HOD') {
          if (s.status === 'Pending HOD') {
            status = 'Pending';
          } else if (s.status === 'Pending Admin' || s.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved')) {
            status = 'Approved';
          } else {
            status = 'Pending';
          }
        } else if (activeRole === 'Supervisor') {
          if (s.status === 'Pending Supervisor' || s.status === 'Pending' || s.status === 'Submitted') {
            status = 'Pending';
          } else if (s.status === 'Pending HOD' || s.status === 'Pending Admin' || s.approvals?.some(a => a.role === 'Supervisor' && a.status === 'Approved')) {
            status = 'Approved';
          } else {
            status = 'Pending';
          }
        } else if (activeRole === 'Admin') {
          if (s.status === 'Pending Admin') {
            status = 'Pending';
          } else if (s.status === 'Approved' || s.approvals?.some(a => a.role === 'Admin' && a.status === 'Approved')) {
            status = 'Approved';
          } else {
            status = 'Pending';
          }
        } else {
          status = 'Pending';
        }

        list.push({
          id: s._id,
          rawId: s._id,
          rawStatus: s.status,
          category: 'submission',
          type: s.isFinalDocumentation ? 'Final Documentation' : (s.title || 'Deliverable Submission'),
          title: s.title,
          submittedBy: s.submittedBy?.name || s.project?.teamLeader?.name || 'Team Member',
          leader: s.project?.teamLeader?.name || 'N/A',
          date: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'Recent',
          status,
          priority: s.isFinalDocumentation ? 'High' : 'Medium',
          description: s.description || `Submission under ${s.project?.title || 'Academic Project'} (Phase: ${s.phase || 'Progress'})`,
          supervisor: s.project?.supervisor?.name || 'Supervisor',
          department: s.project?.department?.name || 'Department',
          fileUrl: s.fileUrl,
          grade: s.grade,
          score: s.score
        });
      });

      setApprovals(list);
    } catch (err) {
      console.error('Error fetching approval items:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = async (item, action) => {
    try {
      if (item.category === 'project') {
        if (action === 'Approved') {
          await axios.put(`/api/projects/${item.rawId}/approve`, { feedback: feedbackText });
        } else {
          await axios.put(`/api/projects/${item.rawId}/reject`, { feedback: feedbackText || 'Project proposal rejected.' });
        }
      } else {
        if (action === 'Approved') {
          await axios.put(`/api/submissions/${item.rawId}/approve`, { feedback: feedbackText });
        } else {
          await axios.put(`/api/submissions/${item.rawId}/reject`, { feedback: feedbackText || 'Submission rejected.' });
        }
      }

      setShowToast({ 
        message: `${item.title} ${action.toLowerCase()} successfully!`, 
        type: action === 'Approved' ? 'success' : 'error' 
      });
      setSelectedApproval(null);
      setFeedbackText('');
      fetchApprovals();
      setTimeout(() => setShowToast(null), 3000);
    } catch (err) {
      console.error('Error performing approval action:', err);
      setShowToast({
        message: err.response?.data?.message || 'Failed to update status',
        type: 'error'
      });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const filteredApprovals = approvals.filter(app => {
    const matchesTab = activeTab === 'All' || app.status === activeTab;
    const matchesSearch = (app.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (app.submittedBy || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (app.supervisor || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-amber-600 bg-amber-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getTypeIcon = (type) => {
    if (type.includes('Team')) return <Users size={18} />;
    if (type.includes('Document') || type.includes('Final')) return <FileText size={18} />;
    return <CheckCircle2 size={18} />;
  };

  return (
    <div className="max-w-[1700px] mx-auto space-y-6 pb-10 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${
              showToast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {showToast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Approvals & Evaluations</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Review and endorse project proposals and academic documentation deliverables</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full lg:w-auto justify-between lg:justify-start overflow-x-auto">
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 lg:flex-initial whitespace-nowrap cursor-pointer ${
                activeTab === tab 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by title, team, or supervisor..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm font-medium"
          />
        </div>
        <button 
          onClick={fetchApprovals}
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto cursor-pointer"
        >
          <Filter size={18} />
          Refresh
        </button>
      </div>

      {/* Approvals List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-bold">
          Loading approval queue...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApprovals.map((approval) => (
            <motion.div
              layout
              key={approval.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 group"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  approval.status === 'Approved' ? 'bg-green-50 text-green-600' : 
                  approval.status === 'Rejected' ? 'bg-red-50 text-red-600' : 
                  'bg-blue-50 text-blue-600'
                }`}>
                  {getTypeIcon(approval.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{approval.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(approval.priority)}`}>
                      {approval.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{approval.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Users size={14} /> {approval.submittedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {approval.date}
                    </span>
                    {approval.fileUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerDirectDownload(approval.fileUrl, `${approval.title} (${approval.submittedBy || 'Submitted Doc'})`);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer ml-1"
                        title="Download Document"
                      >
                        <Download size={11} /> Download Doc
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end md:justify-start gap-3 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t border-gray-50 md:border-t-0">
                {approval.status === 'Pending' ? (
                  <>
                    <button 
                      onClick={() => handleAction(approval, 'Rejected')}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                      title="Reject"
                    >
                      <X size={20} />
                    </button>
                    <button 
                      onClick={() => handleAction(approval, 'Approved')}
                      className="p-2.5 text-green-500 hover:bg-green-50 rounded-xl transition-colors border border-transparent hover:border-green-100 cursor-pointer"
                      title="Approve"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setSelectedApproval(approval)}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex-1 md:flex-initial text-center cursor-pointer"
                    >
                      Review
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 w-full md:w-auto justify-center md:justify-start">
                    {approval.status === 'Approved' ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                    <span className={`text-sm font-bold ${
                      approval.status === 'Approved' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activeRole === 'HOD' && approval.rawStatus === 'Pending Admin' ? 'Reviewed (Pending Admin)' : approval.status}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filteredApprovals.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">No requests found</h3>
                <p className="text-gray-500">All caught up! No items found matching this filter.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approval Details Modal */}
      <AnimatePresence>
        {selectedApproval && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApproval(null)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    {getTypeIcon(selectedApproval.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Review Request</h2>
                    <p className="text-xs text-gray-500">{selectedApproval.type} • Submitted on {selectedApproval.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedApproval(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{selectedApproval.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted By</p>
                      <p className="text-sm font-bold text-gray-700">{selectedApproval.submittedBy}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Leader</p>
                      <p className="text-sm font-bold text-gray-700">{selectedApproval.leader}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supervisor</p>
                      <p className="text-sm font-bold text-gray-700">{selectedApproval.supervisor}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-bold text-gray-700">{selectedApproval.department}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description / Abstract</p>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-100">
                    {selectedApproval.description}
                  </p>
                </div>

                {selectedApproval.fileUrl && (
                  <button 
                    type="button"
                    onClick={() => triggerDirectDownload(selectedApproval.fileUrl, `${selectedApproval.title || 'Submitted Document'} (${selectedApproval.teamName || 'FYP Team'})`)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Download size={15} />
                    Download Document
                  </button>
                )}

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review Comments (Optional)</p>
                  <textarea 
                    value={feedbackText || ''}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide feedback or guidance for the team..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 shrink-0">
                <button 
                  onClick={() => handleAction(selectedApproval, 'Rejected')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all text-sm text-center cursor-pointer"
                >
                  Reject Request
                </button>
                <button 
                  onClick={() => handleAction(selectedApproval, 'Approved')}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm text-center cursor-pointer"
                >
                  Approve Request
                </button>
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

export default Approvals;
