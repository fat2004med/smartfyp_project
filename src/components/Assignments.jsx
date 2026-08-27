import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Plus, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2, 
  Clock, 
  X, 
  Search, 
  Link as LinkIcon, 
  ChevronRight, 
  History, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  XCircle,
  Edit3,
  Eye
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const Assignments = () => {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');
  const [activeTab, setActiveTab] = useState(activeRole === 'Admin' ? 'Creation History' : 'Assigned to Me');
  const [loading, setLoading] = useState(true);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    feedback: '',
    grade: '',
    status: 'Approved'
  });

  const [assignments, setAssignments] = useState([]);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    targetRoles: [],
    startDate: '',
    endDate: '',
    template: null
  });

  const [submissionData, setSubmissionData] = useState({
    file: null,
    link: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAllocatedTeam, setHasAllocatedTeam] = useState(true);

  const getTargetRoles = () => {
    const rolesHierarchy = ['Admin', 'HOD', 'Supervisor', 'Team Leader', 'Team Member'];
    const userIndex = rolesHierarchy.indexOf(activeRole);
    if (userIndex === -1) return [];
    return rolesHierarchy.slice(userIndex + 1);
  };

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/assignments');
      setAssignments(data);
      setSelectedAssignment(prev => {
        if (!prev) return null;
        const found = data.find(a => a._id === prev._id);
        return found || prev;
      });
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkTeamAllocation = useCallback(async () => {
    if (activeRole === 'Supervisor' || activeRole === 'Team Leader') {
      try {
        const { data } = await axios.get('/api/projects');
        setHasAllocatedTeam(data && data.length > 0);
      } catch (error) {
        console.error('Error checking project allocation:', error);
      }
    } else {
      setHasAllocatedTeam(true);
    }
  }, [activeRole]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchAssignments(),
        checkTeamAllocation()
      ]);
    };
    load();
  }, [fetchAssignments, checkTeamAllocation]);

  const filteredAssignments = useMemo(() => {
    let list = [];
    const currentUserId = (user?._id || user)?.toString();
    
    if (activeTab === 'Assigned to Me') {
      list = assignments.filter(a => {
        const creatorId = (a.createdBy?._id || a.createdBy || a.creator?._id || a.creator)?.toString();
        const cRole = a.createdAsRole || a.publisherRole || a.creatorRole;
        
        // If created by this user in this same role capacity, don't show under "Assigned to Me" (belongs in "Creation History")
        if (creatorId === currentUserId && cRole === activeRole) {
          return false;
        }

        // Only show assignments created at or after the user's registration for non-Admin roles
        if (user?.createdAt && a.createdAt && user.role !== 'Admin') {
          const userCreatedTime = new Date(user.createdAt).getTime();
          const assignmentCreatedTime = new Date(a.createdAt).getTime();
          if (creatorId !== currentUserId && assignmentCreatedTime < userCreatedTime) {
            return false;
          }
        }

        const matchesTarget = (a.targetRoles && a.targetRoles.includes(activeRole)) || 
                              a.targetRole === activeRole || 
                              (a.assignedTo && a.assignedTo.some(id => (id?._id || id)?.toString() === currentUserId));
        return matchesTarget;
      });
    } else {
      // "Creation History" / "Created by Me"
      list = assignments.filter(a => {
        const creatorId = (a.createdBy?._id || a.createdBy || a.creator?._id || a.creator)?.toString();
        // ONLY show assignments created by this user
        if (creatorId !== currentUserId) return false;

        const cRole = a.createdAsRole || a.publisherRole || a.creatorRole;
        if (cRole) {
          return cRole === activeRole;
        }
        return true;
      });
    }

    return list.filter(a => 
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignments, activeTab, activeRole, user, searchQuery]);

  const handleReviewSubmission = async (e) => {
    if (e) e.preventDefault();
    if (!reviewData.assignmentId) {
      toast.error('Assignment not selected');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/assignments/${reviewData.assignmentId}/feedback`, {
        assignmentId: reviewData.assignmentId,
        submissionId: reviewData.submissionId,
        studentId: reviewData.studentId,
        feedback: reviewData.feedback,
        grade: reviewData.grade,
        status: reviewData.status
      });

      const updatedAssignment = response.data?.assignment;
      toast.success(response.data?.message || `Submission ${reviewData.status.toLowerCase()}ed successfully`);
      setIsReviewModalOpen(false);

      // Refresh assignments
      await fetchAssignments();

      // Update selectedAssignment in details view if open
      if (updatedAssignment) {
        setSelectedAssignment(updatedAssignment);
      } else {
        setSelectedAssignment(prev => {
          if (!prev || prev._id !== reviewData.assignmentId) return prev;
          const updatedSubs = (prev.submissions || []).map(s => {
            const isMatch = (reviewData.submissionId && s._id?.toString() === reviewData.submissionId?.toString()) ||
                            (reviewData.studentId && (s.student?._id || s.student)?.toString() === reviewData.studentId?.toString());
            if (isMatch) {
              return {
                ...s,
                feedback: reviewData.feedback,
                grade: reviewData.grade,
                status: reviewData.status
              };
            }
            return s;
          });
          return { ...prev, submissions: updatedSubs };
        });
      }
    } catch (error) {
      console.error('Error reviewing assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newAssignment.title);
      formData.append('description', newAssignment.description);
      formData.append('targetRoles', JSON.stringify(newAssignment.targetRoles));
      formData.append('startDate', newAssignment.startDate);
      formData.append('endDate', newAssignment.endDate);
      if (newAssignment.template) {
        formData.append('template', newAssignment.template);
      }

      await axios.post('/api/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment created successfully!');
      setIsCreateModalOpen(false);
      setNewAssignment({ title: '', description: '', targetRoles: [], startDate: '', endDate: '', template: null });
      fetchAssignments();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('link', submissionData.link);
      if (submissionData.file) {
        formData.append('attachment', submissionData.file);
      }

      await axios.post(`/api/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Work submitted successfully!');
      setIsSubmitModalOpen(false);
      setSelectedAssignment(null);
      setSubmissionData({ file: null, link: '' });
      fetchAssignments();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTargetRole = (role) => {
    setNewAssignment(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  const getUserSubmission = (assignment) => {
    return assignment.submissions?.find(s => s.student?._id === user?._id || s.student === user?._id);
  };

  const getAssignmentReviewStatus = (assignment) => {
    const submissions = assignment.submissions || [];
    if (submissions.length === 0) {
      return {
        hasSubmissions: false,
        isAllReviewed: false,
        pendingCount: 0,
        reviewedCount: 0,
        totalCount: 0
      };
    }
    const pending = submissions.filter(s => s.status !== 'Approved' && s.status !== 'Rejected');
    const reviewed = submissions.filter(s => s.status === 'Approved' || s.status === 'Rejected');
    return {
      hasSubmissions: true,
      isAllReviewed: pending.length === 0,
      pendingCount: pending.length,
      reviewedCount: reviewed.length,
      totalCount: submissions.length
    };
  };

  const getStatusStyle = (assignment) => {
    if (activeTab === 'Creation History') {
      const reviewStatus = getAssignmentReviewStatus(assignment);
      if (!reviewStatus.hasSubmissions) {
        return 'bg-gray-100 text-gray-500';
      }
      if (reviewStatus.isAllReviewed) {
        return 'bg-green-100 text-green-700 font-bold';
      }
      return 'bg-amber-100 text-amber-700 font-bold';
    }
    const submission = getUserSubmission(assignment);
    if (submission) {
      switch (submission.status) {
        case 'Approved': return 'bg-green-100 text-green-600';
        case 'Rejected': return 'bg-red-100 text-red-600';
        default: return 'bg-blue-100 text-blue-600';
      }
    }
    
    if (new Date(assignment.endDate) < new Date()) return 'bg-red-100 text-red-600';
    return 'bg-amber-100 text-amber-600';
  };

  const getStatusLabel = (assignment) => {
    if (activeTab === 'Creation History') {
      const reviewStatus = getAssignmentReviewStatus(assignment);
      if (!reviewStatus.hasSubmissions) {
        return '0 Submissions';
      }
      if (reviewStatus.isAllReviewed) {
        return `All Reviewed (${reviewStatus.reviewedCount}/${reviewStatus.totalCount})`;
      }
      return `${reviewStatus.pendingCount} Pending Review`;
    }
    const submission = getUserSubmission(assignment);
    if (submission) {
      if (submission.status === 'Submitted') return 'Pending Approval';
      return submission.status || 'Submitted';
    }
    if (new Date(assignment.endDate) < new Date()) return 'Overdue';
    return 'Pending';
  };

  return (
    <div className="w-full max-w-none space-y-6 pb-12 px-0 lg:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments & Tasks</h1>
          <p className="text-gray-500 mt-1">Manage, assign, and submit academic project requirements</p>
        </div>
        {activeRole !== 'Team Member' && (
          <button 
            onClick={() => {
              if (!hasAllocatedTeam) {
                toast.error("You cannot create assignments until a team/project is allocated to you.");
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              hasAllocatedTeam 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer' 
                : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
            }`}
          >
            <Plus size={20} />
            Create Assignment
          </button>
        )}
      </div>

      {/* Warning Alert for Unallocated Supervisor / Team Leader */}
      {!hasAllocatedTeam && (activeRole === 'Supervisor' || activeRole === 'Team Leader') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 shadow-sm">
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold shrink-0 text-sm">!</div>
          <div className="text-sm leading-relaxed">
            <span className="font-bold block text-amber-900 mb-0.5">Team Allocation Required</span>
            You are currently not allocated to any active student teams or projects. You will be able to create, award, and manage assignments once the Head of Department (HOD) or Admin assigns you to a project record in the system.
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="bg-gray-100/50 p-1 rounded-2xl flex gap-1 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('Assigned to Me')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'Assigned to Me' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={18} />
            Assigned to Me
          </button>
          {activeRole !== 'Team Member' && (
            <button
              onClick={() => setActiveTab('Creation History')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'Creation History' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History size={18} />
              Creation History
            </button>
          )}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search assignments..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Assignment Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {activeTab === 'Assigned to Me' ? 'Assigned By' : 'Target Role'}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                {activeTab === 'Assigned to Me' && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Feedback</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getUserSubmission(assignment) ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{assignment.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{assignment.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">
                            {assignment.creator?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{(assignment.creator?.name || assignment.createdBy?.name || 'System')}</p>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold">
                              {assignment.createdAsRole || assignment.publisherRole || assignment.creatorRole || (assignment.creator?.role ? assignment.creator.role.split(',')[0].trim() : 'Admin')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[8px] text-gray-400 font-bold uppercase block w-full mb-0.5">Audience:</span>
                          {assignment.targetRoles?.map(role => (
                            <span key={role} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${role === activeRole ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                          <Clock size={12} />
                          Due: {new Date(assignment.endDate).toLocaleDateString()}
                        </div>
                        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(assignment)}`}>
                      {getStatusLabel(assignment)}
                    </span>
                  </td>
                  {activeTab === 'Assigned to Me' && (
                    <td className="px-6 py-4">
                       {getUserSubmission(assignment)?.feedback ? (
                         <div className="flex items-center gap-1.5 text-xs text-gray-500 italic max-w-[150px]">
                            <MessageSquare size={12} className="flex-shrink-0" />
                            <span className="truncate">{getUserSubmission(assignment).feedback}</span>
                         </div>
                       ) : (
                         <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">No Feedback</span>
                       )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {activeTab === 'Assigned to Me' && (
                        <>
                          {(!getUserSubmission(assignment) || getUserSubmission(assignment).status === 'Rejected') ? (
                            <button 
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setIsSubmitModalOpen(true);
                                setSubmissionData({ file: null, link: getUserSubmission(assignment)?.link || '' });
                              }}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-1.5"
                            >
                              {getUserSubmission(assignment) ? <History size={14} /> : <Upload size={14} />}
                              {getUserSubmission(assignment) ? 'Resubmit' : 'Submit'}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold border border-gray-100">
                               <CheckCircle2 size={12} />
                               {getUserSubmission(assignment).status === 'Approved' ? 'COMPLETED' : 'AWAITING REVIEW'}
                            </div>
                          )}
                        </>
                      )}
                      {activeTab === 'Creation History' && (
                        <>
                          {assignment.submissions?.length > 0 && (
                            <div className="flex -space-x-2 mr-2">
                               {assignment.submissions.slice(0, 3).map((s, i) => (
                                 <div 
                                   key={i} 
                                   className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${
                                     s.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                     s.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-600'
                                   }`} 
                                   title={`${s.student?.name || 'Student'} • ${s.status || 'Submitted'}`}
                                 >
                                   {s.student?.name?.charAt(0) || 'S'}
                                 </div>
                               ))}
                               {assignment.submissions.length > 3 && (
                                 <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                   +{assignment.submissions.length - 3}
                                 </div>
                               )}
                            </div>
                          )}

                          {(() => {
                            const reviewStatus = getAssignmentReviewStatus(assignment);
                            if (reviewStatus.hasSubmissions && reviewStatus.isAllReviewed) {
                              return (
                                <button 
                                  onClick={() => setSelectedAssignment(assignment)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold border border-green-200 transition-all cursor-pointer shadow-sm active:scale-95"
                                  title="All submissions reviewed. Click to view or edit review"
                                >
                                  <CheckCircle2 size={13} className="text-green-600" />
                                  <span>Reviewed</span>
                                </button>
                              );
                            } else if (reviewStatus.hasSubmissions && !reviewStatus.isAllReviewed) {
                              return (
                                <button 
                                  onClick={() => setSelectedAssignment(assignment)}
                                  className="bg-blue-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer active:scale-95"
                                  title={`${reviewStatus.pendingCount} submission(s) awaiting review`}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Review {reviewStatus.pendingCount > 1 ? `(${reviewStatus.pendingCount})` : ''}</span>
                                </button>
                              );
                            } else {
                              return (
                                <button 
                                  onClick={() => setSelectedAssignment(assignment)}
                                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <span>View</span>
                                </button>
                              );
                            }
                          })()}
                        </>
                      )}
                      <button 
                        onClick={() => setSelectedAssignment(assignment)}
                        className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FileText size={48} strokeWidth={1} />
                      <p className="font-medium">No assignments found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assignment Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Create New Assignment</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="p-6 space-y-5 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Assignment Title</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g., Final Documentation Phase 1"
                    value={newAssignment.title || ''}
                    onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea 
                    required
                    rows="3"
                    placeholder="Provide detailed instructions..."
                    value={newAssignment.description || ''}
                    onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Target Roles</label>
                  <div className="grid grid-cols-2 gap-3">
                    {getTargetRoles().map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => toggleTargetRole(role)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            newAssignment.targetRoles.includes(role) 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-300 group-hover:border-blue-400'
                          }`}
                        >
                          {newAssignment.targetRoles.includes(role) && <CheckCircle2 size={12} />}
                        </div>
                        <span className="text-xs text-gray-600">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Template (Optional)</label>
                  <div className="relative">
                    <input 
                      type="file"
                      className="hidden"
                      id="template-upload"
                      onChange={(e) => setNewAssignment({...newAssignment, template: e.target.files[0]})}
                    />
                    <label 
                      htmlFor="template-upload"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-100 transition-all"
                    >
                      <Download size={18} />
                      {newAssignment.template ? newAssignment.template.name : 'Upload Template'}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Start Date</label>
                    <input 
                      required
                      type="date"
                      value={newAssignment.startDate || ''}
                      onChange={(e) => setNewAssignment({...newAssignment, startDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">End Date (Deadline)</label>
                    <input 
                      required
                      type="date"
                      value={newAssignment.endDate || ''}
                      onChange={(e) => setNewAssignment({...newAssignment, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Work Modal */}
      <AnimatePresence>
        {isSubmitModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubmitModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Submit Assignment</h2>
                  <p className="text-xs text-gray-500">{selectedAssignment.title}</p>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitWork} className="p-6 space-y-5 overflow-y-auto">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Download className="text-blue-600" size={18} />
                    <span className="text-sm font-bold text-blue-700">Required Template</span>
                  </div>
                  <p className="text-xs text-blue-600 mb-3">Please download and use the provided template for your submission.</p>
                  {selectedAssignment.templateUrl && (
                    <a 
                      href={selectedAssignment.templateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white text-blue-600 py-2 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-50 transition-all flex justify-center items-center gap-2"
                    >
                      <Download size={14} />
                      Download Template
                    </a>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Upload Document</label>
                  <div className="relative">
                    <input 
                      required
                      type="file"
                      className="hidden"
                      id="doc-upload"
                      onChange={(e) => setSubmissionData({...submissionData, file: e.target.files[0]})}
                    />
                    <label 
                      htmlFor="doc-upload"
                      className="w-full px-4 py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {submissionData.file ? submissionData.file.name : 'Click to upload document'}
                      </span>
                      <span className="text-[10px] text-gray-400">PDF, DOCX up to 10MB</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Project Link (Optional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="url"
                      placeholder="e.g., GitHub Repository Link"
                      value={submissionData.link || ''}
                      onChange={(e) => setSubmissionData({...submissionData, link: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isSubmitting ? 'Submitting...' : (
                      <>
                        <Send size={18} />
                        Submit Work
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {selectedAssignment && !isSubmitModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAssignment(null)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                    <p className="text-xs text-gray-500">Created by {selectedAssignment.creator?.name || 'System'} • {selectedAssignment.creatorRole || (selectedAssignment.creator?.role ? selectedAssignment.creator.role.split(',')[0].trim() : 'Admin')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Roles</p>
                    <p className="text-sm font-bold text-gray-700">{selectedAssignment.targetRoles?.join(', ')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</p>
                    <p className="text-sm font-bold text-red-600">{new Date(selectedAssignment.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instructions</p>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {selectedAssignment.description}
                  </p>
                </div>

                {activeTab === 'Assigned to Me' && getUserSubmission(selectedAssignment) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Submission</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(selectedAssignment)}`}>
                        {getStatusLabel(selectedAssignment)}
                      </span>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                             <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">Submitted Document</p>
                            <p className="text-[10px] text-gray-500">{new Date(getUserSubmission(selectedAssignment).submittedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {getUserSubmission(selectedAssignment).fileUrl && (
                          <button
                            type="button"
                            onClick={() => triggerDirectDownload(getUserSubmission(selectedAssignment).fileUrl, `${selectedAssignment.title} Submission`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Download size={14} />
                            Download Submitted Doc
                          </button>
                        )}
                      </div>
                      
                      {getUserSubmission(selectedAssignment).link && (
                        <div className="p-3 bg-white/50 rounded-xl border border-blue-100/50 flex items-center gap-2">
                           <LinkIcon size={14} className="text-gray-400" />
                           <a href={getUserSubmission(selectedAssignment).link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                             {getUserSubmission(selectedAssignment).link}
                           </a>
                        </div>
                      )}

                      {getUserSubmission(selectedAssignment).feedback && (
                        <div className="mt-4 pt-4 border-t border-blue-100">
                           <div className="flex items-center justify-between mb-2">
                             <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Feedback & Grade</p>
                             <span className="text-[9px] font-bold text-indigo-600 uppercase">
                               By: {selectedAssignment.creator?.name || 'Academic Creator'} • {selectedAssignment.creatorRole || (selectedAssignment.creator?.role ? selectedAssignment.creator.role.split(',')[0].trim() : 'Reviewer')}
                             </span>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-blue-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-900 italic break-words flex-1">&quot;{getUserSubmission(selectedAssignment).feedback}&quot;</span>
                                {getUserSubmission(selectedAssignment).grade && (
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-black">{getUserSubmission(selectedAssignment).grade}</span>
                                )}
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'Creation History' && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submission History ({selectedAssignment.submissions?.length || 0})</p>
                    <div className="space-y-3">
                      {selectedAssignment.submissions?.length > 0 ? (
                        selectedAssignment.submissions.map((sub, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                  {sub.student?.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{sub.student?.name || 'Unknown Student'}</p>
                                  <p className="text-[10px] text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                sub.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                sub.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {sub.status || 'Submitted'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-4">
                               <div className="flex items-center gap-2">
                                  {sub.fileUrl && (
                                    <button
                                      type="button"
                                      onClick={() => triggerDirectDownload(sub.fileUrl, `${selectedAssignment.title} - ${sub.student?.name || 'Student'}`)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
                                      title="Download Submission File"
                                    >
                                      <Download size={13} /> Download Doc
                                    </button>
                                  )}
                                  {sub.link && (
                                    <a href={sub.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors border border-gray-200 shadow-sm">
                                      <LinkIcon size={14} /> Link
                                    </a>
                                  )}
                               </div>
                               {sub.status !== 'Approved' && sub.status !== 'Rejected' && (
                                 <button 
                                   onClick={() => {
                                     setSelectedAssignment(selectedAssignment);
                                     setReviewData({
                                       assignmentId: selectedAssignment._id,
                                       submissionId: sub._id,
                                       studentId: sub.student?._id || sub.student,
                                       feedback: sub.feedback || '',
                                       grade: sub.grade || '',
                                       status: 'Approved'
                                     });
                                     setIsReviewModalOpen(true);
                                   }}
                                   className="bg-blue-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer active:scale-95"
                                 >
                                   <CheckCircle2 size={13} />
                                   <span>Review & Grade</span>
                                 </button>
                               )}
                            </div>
                            
                            {sub.feedback && (
                              <div className="p-3 bg-white rounded-xl border border-gray-100">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase ">Feedback Given:</p>
                                  <span className="text-[9px] font-bold text-indigo-600 uppercase mb-1 block">
                                    By: {selectedAssignment.creator?.name || 'Academic Creator'} • {selectedAssignment.creatorRole || (selectedAssignment.creator?.role ? selectedAssignment.creator.role.split(',')[0].trim() : 'Reviewer')}
                                  </span>
                                 <p className="text-xs text-gray-600 italic">&quot;{sub.feedback}&quot; {sub.grade && <span className="font-bold text-blue-600">[{sub.grade}]</span>}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                           <Clock className="mx-auto text-gray-300 mb-2" size={24} />
                           <p className="text-xs text-gray-400 font-medium">No submissions received yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setSelectedAssignment(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm"
                >
                  Close
                </button>
                {activeTab === 'Assigned to Me' && (!getUserSubmission(selectedAssignment) || getUserSubmission(selectedAssignment).status === 'Rejected') && (
                  <button 
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm"
                  >
                    {getUserSubmission(selectedAssignment) ? 'Resubmit Work' : 'Submit Work'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[110] flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${reviewData.status === 'Approved' ? 'bg-green-600' : 'bg-red-600'}`}>
                      {reviewData.status === 'Approved' ? <ThumbsUp size={20} /> : <ThumbsDown size={20} />}
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-gray-900">Review & Grade Submission</h2>
                      <p className="text-xs text-gray-500">Provide feedback, grade, and set status to Approved or Rejected</p>
                   </div>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
                   <button 
                     type="button"
                     onClick={() => setReviewData({...reviewData, status: 'Approved'})}
                     className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        reviewData.status === 'Approved' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
                     }`}
                   >
                     <ThumbsUp size={14} /> Approve
                   </button>
                   <button 
                     type="button"
                     onClick={() => setReviewData({...reviewData, status: 'Rejected'})}
                     className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        reviewData.status === 'Rejected' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
                     }`}
                   >
                     <ThumbsDown size={14} /> Reject
                   </button>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                         <MessageSquare size={14} className="text-gray-400" />
                         Feedback / Comments
                      </label>
                      <textarea 
                        rows="3"
                        placeholder="What do you think of this work?"
                        value={reviewData.feedback || ''}
                        onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none italic"
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                         <CheckCircle2 size={14} className="text-gray-400" />
                         Grade / Score (Optional)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g., A, 85/100, Good"
                        value={reviewData.grade || ''}
                        onChange={(e) => setReviewData({...reviewData, grade: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                      />
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => setIsReviewModalOpen(false)}
                     className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm cursor-pointer"
                   >
                     Cancel
                   </button>
                   <button 
                     type="button"
                     onClick={handleReviewSubmission}
                     disabled={isSubmitting}
                     className={`flex-1 py-3 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                        reviewData.status === 'Approved' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                     }`}
                   >
                     {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Review...</span>
                        </>
                     ) : (
                        reviewData.status === 'Approved' ? 'Save & Approve' : 'Save & Reject'
                     )}
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

export default Assignments;
