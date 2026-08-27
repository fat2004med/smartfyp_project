import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Star, 
  ChevronRight, 
  Search, 
  Filter, 
  CheckCircle2,
  AlertCircle,
  FileText,
  MoreVertical
} from 'lucide-react';

const Feedback = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/submissions/my-feedback');
        
        const mappedFeedbacks = response.data.map((fb, idx) => {
          const createdAt = new Date(fb.createdAt);
          return {
            id: fb._id || idx,
            from: fb.author?.name || 'Academic Reviewer',
            role: fb.author?.role || 'Reviewer',
            project: fb.submission?.project?.title || 'System Review',
            message: fb.content || '',
            date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            rating: fb.rating || 4,
            status: fb.status || 'New',
            category: fb.category || 'General'
          };
        });
        setFeedbacks(mappedFeedbacks);
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleMarkFeedbackRead = async (feedback) => {
    try {
      if (feedback.id && !String(feedback.id).startsWith('proj-fb-')) {
        await axios.patch(`/api/submissions/feedback/${feedback.id}/read`);
      }
      setFeedbacks(prev => prev.map(f => f.id === feedback.id ? { ...f, status: 'Read' } : f));
      toast.success('Feedback marked as read successfully');
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Failed to mark feedback as read:', error);
      toast.error('Failed to update feedback status');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesTab = activeTab === 'All' || f.status === activeTab;
    const matchesSearch = (f.from || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (f.project || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="w-full max-w-none space-y-6 sm:space-y-8 pb-12 px-0 lg:px-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Feedback Hub</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Global correspondence and project evaluation reviews</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-full lg:w-auto justify-between lg:justify-start">
          {['All', 'New', 'Read'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-1 lg:flex-initial ${
                activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search feedback by project, person or keywords..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm shadow-sm"
          />
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Syncing correspondence...</span>
            </div>
          ) : (
            <>
              {filteredFeedbacks.map((feedback) => (
                <motion.div
                  layout
                  key={feedback.id}
                  onClick={() => setSelectedFeedback(feedback)}
                  className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all cursor-pointer group hover:shadow-xl ${
                    feedback.status === 'New' ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-gray-100 hover:border-blue-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-5">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      feedback.status === 'New' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                      <User className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 w-full">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate max-w-[150px] sm:max-w-none">{feedback.from}</h3>
                          <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider shrink-0">
                            {feedback.role}
                          </span>
                          {feedback.status === 'New' && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[8px] sm:text-[10px] font-black uppercase shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 font-bold shrink-0 self-start sm:self-auto">
                          <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                          {feedback.date}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-50/50 inline-block px-2.5 py-1 rounded-lg max-w-full break-words">
                          {feedback.project}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed font-medium break-words">
                        {feedback.message}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-gray-400 flex items-center gap-1 group-hover:text-blue-600 transition-colors uppercase tracking-widest self-end sm:self-auto">
                          Expand Review <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredFeedbacks.length === 0 && (
                <div className="py-24 text-center space-y-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 px-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-gray-200 shadow-sm">
                    <MessageSquare size={36} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Zero Feedback</h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-md mx-auto">Everything looks clear! No messages match your current filters.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeedback(null)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-gray-50/50">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{selectedFeedback.from}</h2>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium truncate">{selectedFeedback.role} • {selectedFeedback.category} Feedback</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFeedback(null)}
                  className="p-1.5 px-3 hover:bg-gray-200 rounded-xl transition-colors text-gray-500 text-xs font-bold shrink-0 self-start sm:self-auto"
                >
                  Close
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider self-start break-words max-w-full">
                      {selectedFeedback.project}
                    </span>
                    <div className="flex items-center gap-0.5 self-start sm:self-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < selectedFeedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold italic bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100 whitespace-pre-wrap break-words">
                    &quot;{selectedFeedback.message}&quot;
                  </p>
                  <div className="flex items-center gap-4 text-[10px] sm:text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> Received {selectedFeedback.date} at {selectedFeedback.time}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between shrink-0">
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-750 font-bold text-xs transition-colors py-1 self-start sm:self-auto">
                  <FileText size={16} />
                  View Related Document
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                  {selectedFeedback.status === 'New' && (
                    <button 
                      onClick={() => handleMarkFeedbackRead(selectedFeedback)}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-xs flex-1 sm:flex-none"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedFeedback(null)}
                    className="bg-white border border-gray-200 text-gray-650 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-all text-xs flex-1 sm:flex-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for X icon since it was missing in local imports but used in modal
const X = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

export default Feedback;
