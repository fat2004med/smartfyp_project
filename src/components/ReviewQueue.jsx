import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Eye
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const ReviewQueue = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const activeRole = localStorage.getItem('activeDashboardRole') || user?.role?.split(',')[0]?.trim() || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');

  const [reviewScore, setReviewScore] = useState('');
  const [reviewGrade, setReviewGrade] = useState('');

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get('/api/submissions');
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const isPendingStatus = (status) => {
    return status?.startsWith('Pending') || status === 'Submitted';
  };

  const handleReviewAction = async (submissionId, status) => {
    try {
      if (status === 'Rejected') {
        if (!feedbackText.trim()) {
          return toast.error('Feedback comment is required when rejecting a submission');
        }
        await axios.put(`/api/submissions/${submissionId}/reject`, { 
          feedback: feedbackText.trim() 
        });
        toast.success('Submission rejected successfully');
      } else {
        await axios.put(`/api/submissions/${submissionId}/approve`, { 
          status: 'Approved', 
          feedback: feedbackText.trim(),
          score: reviewScore ? Number(reviewScore) : undefined,
          grade: reviewGrade || undefined
        });
        toast.success('Submission approved successfully');
      }
      await fetchReviews();
      setSelectedReview(null);
      setFeedbackText('');
      setReviewScore('');
      setReviewGrade('');
    } catch (error) {
       console.error('Action error:', error);
       toast.error(error.response?.data?.message || `Failed to ${status.toLowerCase()} submission`);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const title = review.project?.title || review.title || review.phase || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (review.phase && review.phase.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (filterStatus === 'All') {
      matchesFilter = true;
    } else if (filterStatus === 'Pending') {
      matchesFilter = isPendingStatus(review.status);
    } else {
      matchesFilter = review.status === filterStatus;
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Reviewing': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const pendingCount = reviews.filter(r => isPendingStatus(r.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Queue</h2>
          <p className="text-gray-500">Manage and evaluate project submissions from your assigned groups.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-200">
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by group or document name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select 
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 text-sm"
            value={filterStatus || 'All'}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">All Pending</option>
            <option value="Pending Supervisor">Pending Supervisor</option>
            <option value="Pending HOD">Pending HOD</option>
            <option value="Pending Admin">Pending Admin</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredReviews.map((review, index) => {
            const userAlreadyReviewed = review.feedbacks?.some(fb => {
              const authorId = fb.author?._id || fb.author;
              return authorId && currentUserId && authorId.toString() === currentUserId.toString();
            });

            return (
              <motion.div
                key={review._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  selectedReview === review._id ? 'border-blue-500 shadow-xl ring-1 ring-blue-500' : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setSelectedReview(selectedReview === review._id ? null : review._id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    selectedReview === review._id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{review.phase}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm text-blue-600 font-bold">{review.project?.title}</span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {review.submittedBy && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            By: <span className="font-semibold text-gray-700">{review.submittedBy.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-600 border border-blue-100 rounded font-bold uppercase tracking-wide">
                              {review.submittedBy.role}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-blue-50 text-blue-600`}>
                      {review.project?.department?.name || 'Group Member'}
                    </p>
                  </div>
                  {selectedReview === review._id ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {selectedReview === review._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50 border-t border-gray-100"
                  >
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          {review.submittedBy && (
                            <div>
                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Submitted By</h5>
                              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl text-xs text-blue-700 shadow-sm font-sans">
                                <span className="font-bold">{review.submittedBy.name}</span>
                                <span className="text-blue-300">|</span>
                                <span className="text-[10px] font-extrabold uppercase bg-white border border-blue-150 px-2 py-0.5 rounded-md text-blue-600 font-sans tracking-wide">
                                  {review.submittedBy.role}
                                </span>
                              </div>
                            </div>
                          )}
                          <div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Team Members</h5>
                            <div className="flex flex-wrap gap-2">
                               {review.project?.members?.map((member, i) => (
                                <span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                                  {typeof member === 'object' ? member.name : 'Member'}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {review.feedbacks?.length > 0 && (
                            <div>
                               <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Existing Feedback</h5>
                               <div className="space-y-2">
                                 {review.feedbacks.map((fb, i) => (
                                   <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                     <div className="flex justify-between items-center mb-1">
                                       <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 flex-wrap"><span>{fb.author?.name || 'Reviewer'}</span><span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 rounded px-1.5 py-0.2 uppercase font-black">{fb.author?.role || fb.role || 'Reviewer'}</span></span>
                                       <span className="text-[10px] text-gray-400">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'Recently'}</span>
                                     </div>
                                     <p className="text-xs text-gray-700 italic font-medium">&quot;{fb.content}&quot;</p>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Actions</h5>
                          <div className="flex flex-wrap items-center gap-3">
                            {review.fileUrl && (
                              <button 
                                type="button"
                                onClick={() => triggerDirectDownload(review.fileUrl, review.title || review.team?.name || 'Submission Document')}
                                className="flex items-center justify-center gap-2 bg-blue-600 border border-blue-600 p-3 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-xs cursor-pointer flex-1"
                              >
                                <Download size={17} />
                                Download Document
                              </button>
                            )}
                            {review.link && (
                              <a 
                                href={review.link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm flex-1"
                              >
                                <ExternalLink size={18} />
                                View Link
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Review Comments / Feedback</label>
                        <textarea 
                          className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium min-h-[100px]"
                          placeholder="Provide feedback to the team (required for rejection)..."
                          value={feedbackText || ''}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score (Optional)</label>
                          <input 
                            type="number"
                            placeholder="e.g. 85"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                            value={reviewScore || ''}
                            onChange={(e) => setReviewScore(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grade (Optional)</label>
                          <input 
                            type="text"
                            placeholder="e.g. A, B+"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                            value={reviewGrade || ''}
                            onChange={(e) => setReviewGrade(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                        <button 
                          onClick={async () => {
                            if (!feedbackText.trim()) return;
                            try {
                              await axios.post(`/api/submissions/${review._id}/feedback`, { content: feedbackText.trim() });
                              toast.success('Feedback posted successfully');
                              setFeedbackText('');
                              fetchReviews();
                            } catch (error) {
                              toast.error(error.response?.data?.message || 'Failed to post feedback');
                            }
                          }}
                          disabled={!feedbackText.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition-all border border-amber-100 cursor-pointer"
                        >
                          <MessageSquare size={18} />
                          Post Feedback Only
                        </button>

                        {review.status === 'Approved' || review.status === 'Rejected' || (activeRole === 'Supervisor' && review.approvals?.some(a => a.role === 'Supervisor' && a.status === 'Approved')) || (activeRole === 'HOD' && review.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved')) || (activeRole === 'Admin' && review.approvals?.some(a => a.role === 'Admin' && a.status === 'Approved')) ? (
                          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-gray-600 border border-gray-200 font-bold text-xs select-none">
                            <span>Status: {review.status === 'Pending HOD' && activeRole === 'Supervisor' ? 'Reviewed (Pending HOD)' : review.status === 'Pending Admin' && activeRole === 'HOD' ? 'Reviewed (Pending Admin)' : review.status}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleReviewAction(review._id, 'Rejected')}
                              disabled={!feedbackText.trim()}
                              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all border border-red-200 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <XCircle size={18} />
                              Reject
                            </button>
                            <button 
                              onClick={() => handleReviewAction(review._id, 'Approved')}
                              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 cursor-pointer"
                            >
                              <CheckCircle size={18} />
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ); })}
        </AnimatePresence>

        {filteredReviews.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No submissions found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">We couldn&apos;t find any documents matching your current search or filter criteria.</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterStatus('All'); }}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc({ isOpen: false, fileUrl: '', title: '' })}
        fileUrl={viewerDoc.fileUrl}
        title={viewerDoc.title}
      />
    </div>
  );
};

export default ReviewQueue;
