import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronRight
} from 'lucide-react';

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showToast, setShowToast] = useState(null);

  const [approvals, setApprovals] = useState([
    {
      id: 1,
      type: 'Project Title',
      title: 'Smart Agriculture using IoT and Edge Computing',
      submittedBy: 'Team Alpha',
      leader: 'Sarah Johnson',
      date: '2024-04-08',
      status: 'Pending',
      priority: 'High',
      description: 'A system to monitor soil moisture and weather conditions to optimize irrigation using low-power IoT devices.',
      supervisor: 'Dr. Michael Brown'
    },
    {
      id: 2,
      type: 'Team Registration',
      title: 'Blockchain for Secure Voting',
      submittedBy: 'Team Nexus',
      leader: 'David Kim',
      date: '2024-04-07',
      status: 'Pending',
      priority: 'Medium',
      description: 'Decentralized voting platform ensuring transparency and immutability of election results.',
      supervisor: 'Prof. Emily Watson'
    },
    {
      id: 3,
      type: 'Document Submission',
      title: 'SRS - AI Health Assistant',
      submittedBy: 'Team Vital',
      leader: 'Lisa Wang',
      date: '2024-04-08',
      status: 'Pending',
      priority: 'High',
      description: 'Software Requirements Specification for the AI-driven health monitoring application.',
      supervisor: 'Dr. Robert Smith'
    },
    {
      id: 4,
      type: 'Project Title',
      title: 'Autonomous Delivery Drone',
      submittedBy: 'SkyLink Team',
      leader: 'Kevin Liu',
      date: '2024-04-05',
      status: 'Approved',
      priority: 'Medium',
      description: 'Development of a drone capable of navigating urban environments for small package delivery.',
      supervisor: 'Dr. Sarah Johnson'
    }
  ]);

  const handleAction = (id, newStatus) => {
    setApprovals(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
    setShowToast({ 
      message: `Request ${newStatus.toLowerCase()} successfully!`, 
      type: newStatus === 'Approved' ? 'success' : 'error' 
    });
    setSelectedApproval(null);
    setTimeout(() => setShowToast(null), 3000);
  };

  const filteredApprovals = approvals.filter(app => {
    const matchesTab = activeTab === 'All' || app.status === activeTab;
    const matchesSearch = (app.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (app.submittedBy || '').toLowerCase().includes(searchQuery.toLowerCase());
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
    switch (type) {
      case 'Team Registration': return <Users size={18} />;
      case 'Document Submission': return <FileText size={18} />;
      default: return <CheckCircle2 size={18} />;
    }
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
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Review and manage project-related requests</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full lg:w-auto justify-between lg:justify-start overflow-x-auto">
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 lg:flex-initial whitespace-nowrap ${
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
            placeholder="Search by title or team name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm font-medium"
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm w-full sm:w-auto">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Approvals List */}
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
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Users size={14} /> {approval.submittedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {approval.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end md:justify-start gap-3 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t border-gray-50 md:border-t-0">
              {approval.status === 'Pending' ? (
                <>
                  <button 
                    onClick={() => handleAction(approval.id, 'Rejected')}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                    title="Reject"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={() => handleAction(approval.id, 'Approved')}
                    className="p-2.5 text-green-500 hover:bg-green-50 rounded-xl transition-colors border border-transparent hover:border-green-100"
                    title="Approve"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => setSelectedApproval(approval)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex-1 md:flex-initial text-center"
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
                    {approval.status}
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
              <p className="text-gray-500">All caught up! No pending approvals at the moment.</p>
            </div>
          </div>
        )}
      </div>

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
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(selectedApproval.priority)}`}>
                        {selectedApproval.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description / Abstract</p>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-100">
                    {selectedApproval.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Review Comments (Optional)</p>
                  <textarea 
                    placeholder="Provide feedback for the team..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 shrink-0">
                <button 
                  onClick={() => handleAction(selectedApproval.id, 'Rejected')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all text-sm text-center"
                >
                  Reject Request
                </button>
                <button 
                  onClick={() => handleAction(selectedApproval.id, 'Approved')}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm text-center"
                >
                  Approve Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Approvals;
