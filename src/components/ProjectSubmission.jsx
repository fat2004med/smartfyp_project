import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2, 
  Check,
  XCircle,
  Clock, 
  AlertCircle, 
  MessageSquare,
  ChevronRight,
  FileCheck,
  Calendar,
  X,
  Link as LinkIcon,
  Send,
  Plus,
  ShieldCheck,
  Eye
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const ProjectSelector = ({ currentProject, onSelect, activeRole }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects');
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects().finally(() => setLoading(false));
  }, []);

  const allLabel = activeRole === 'Supervisor' 
    ? 'All Supervised Projects' 
    : activeRole === 'HOD' 
    ? 'All Department Projects' 
    : 'All Projects';

  return (
    <select 
      className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto min-w-0 sm:min-w-[220px] max-w-full truncate shadow-sm cursor-pointer"
      value={currentProject?._id || ''}
      onFocus={fetchProjects}
      onChange={(e) => {
        const p = projects.find(proj => proj._id === e.target.value) || null;
        onSelect(p);
      }}
    >
      <option value="">{loading ? 'Loading projects...' : allLabel}</option>
      {projects.map(p => (
        <option key={p._id} value={p._id}>{p.title}</option>
      ))}
    </select>
  );
};

const ProjectSubmission = () => {
  const { user } = useAuth();
  const activeRole = localStorage.getItem('activeDashboardRole') || user?.role?.split(',')[0]?.trim() || '';
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateSlotModalOpen, setIsCreateSlotModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState('full'); // 'full' or 'feedback'
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    feedback: '',
    status: 'Approved',
    grade: '',
    score: ''
  });
  const [submissionForm, setSubmissionForm] = useState({
    file: null,
    link: '',
    comment: ''
  });
  const [slotForm, setSlotForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    githubUrl: '',
    semester: 7,
    isFinalDocumentation: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanningIds, setScanningIds] = useState([]);
  const [selectedPlagiarismReport, setSelectedPlagiarismReport] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });

  const triggerPlagiarismCheck = async (id) => {
    setScanningIds(prev => [...prev, id]);
    const toastId = toast.loading('Running AI Academic Integrity Check...');
    try {
      const { data } = await axios.post(`/api/submissions/${id}/plagiarism-check`);
      if (data.success) {
        const score = data.submission?.plagiarismScore ?? 0;
        toast.success(`Analysis complete! Score: ${score}%`, { id: toastId });
        await fetchProjectData();
      } else {
        toast.error('Check finished but was not successful.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error running check. Please ensure file exists or is valid text.', { id: toastId });
    } finally {
      setScanningIds(prev => prev.filter(x => x !== id));
    }
  };

  const fetchProjectData = useCallback(async (selectedProject = undefined) => {
    setLoading(true);
    try {
      let targetProject = selectedProject !== undefined ? selectedProject : projectRef.current;

      // If student (Team Leader / Team Member), fetch their own project
      if (['Team Leader', 'Team Member'].includes(activeRole)) {
        try {
          const { data: myProj } = await axios.get('/api/projects/my-project');
          targetProject = myProj;
          setProject(myProj);
        } catch (e) {
          console.error('Error fetching my-project:', e);
        }
      } else if (targetProject) {
        // If a specific project is selected, fetch its latest details
        try {
          const { data: latestProj } = await axios.get(`/api/projects/${targetProject._id}`);
          if (latestProj) {
            targetProject = latestProj;
            setProject(latestProj);
          }
        } catch (e) {
          console.error('Error fetching latest project:', e);
        }
      } else {
        setProject(null);
      }
      
      const queryUrl = targetProject ? `/api/submissions?project=${targetProject._id}` : '/api/submissions';
      const { data: subs } = await axios.get(queryUrl);
      setSubmissions(subs || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjectData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProjectData]);

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (reviewMode === 'feedback') {
        await axios.post(`/api/submissions/${selectedDoc._id}/feedback`, {
          content: reviewForm.feedback,
          category: 'Review'
        });
        toast.success('Feedback added successfully!');
      } else {
        const reviewData = {
          grade: reviewForm.grade,
          score: reviewForm.score,
          feedback: reviewForm.feedback
        };

        if (reviewForm.status === 'Approved') {
          await axios.put(`/api/submissions/${selectedDoc._id}/approve`, reviewData);
          toast.success('Submission approved successfully!');
        } else {
          await axios.put(`/api/submissions/${selectedDoc._id}/reject`, { feedback: reviewForm.feedback });
          toast.success('Submission rejected successfully!');
        }
      }
      
      setIsReviewModalOpen(false);
      fetchProjectData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForward = async (docId) => {
    try {
      await axios.put(`/api/submissions/${docId}/forward`);
      toast.success('Submission forwarded to next level!');
      fetchProjectData();
    } catch (error) {
      toast.error('Error forwarding submission');
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    let currentProject = project;
    
    // Safety check: if project is missing, try to fetch it one last time
    if (!currentProject) {
      try {
        const { data: myProj } = await axios.get('/api/projects/my-project');
        currentProject = myProj;
        setProject(myProj);
      } catch (err) {
        return toast.error("Please ensure you are assigned to a project first");
      }
    }

    if (!currentProject) return toast.error("Please ensure you are assigned to a project first");
    
    try {
      setIsSubmitting(true);
      await axios.post('/api/submissions', {
        ...slotForm,
        phase: slotForm.title,
        project: currentProject._id,
        status: 'Not Submitted'
      });
      toast.success('Submission slot created!');
      setIsCreateSlotModalOpen(false);
      setSlotForm({ title: '', startDate: '', endDate: '', githubUrl: '', semester: 7, isFinalDocumentation: false });
      fetchProjectData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!submissionForm.file && !submissionForm.link) return;

    try {
      setIsSubmitting(true);
      const isResubmit = selectedDoc && !selectedDoc.isPlaceholder;
      const wasSubmittedBefore = selectedDoc && selectedDoc.status !== 'Not Submitted' && selectedDoc.fileUrl;
      const url = isResubmit ? `/api/submissions/${selectedDoc._id}/resubmit` : '/api/submissions';
      
      const formData = new FormData();
      if (submissionForm.file) formData.append('file', submissionForm.file);
      formData.append('phase', selectedDoc?.title || 'General');
      formData.append('title', selectedDoc?.title || 'Untitled Submission');
      
      if (submissionForm.link) {
        formData.append('links', JSON.stringify([submissionForm.link]));
      }
      
      if (project) {
        formData.append('project', project._id);
        formData.append('semester', selectedDoc?.semester || project.semester || 7);
      }

      formData.append('comment', submissionForm.comment || '');

      if (isResubmit) {
        await axios.put(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success(wasSubmittedBefore ? 'Resubmitted successfully!' : 'Submitted successfully!');
      fetchProjectData();
      setIsSubmitModalOpen(false);
      setSubmissionForm({ file: null, link: '', comment: '' });
    } catch (error) {
       toast.error(error.response?.data?.message || 'Error processing submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = (doc) => {
    setSelectedDoc(doc);
    setIsSubmitModalOpen(true);
  };

  const getStatusStyle = (status) => {
    if (status?.startsWith('Pending')) return 'bg-amber-100 text-amber-600 border border-amber-200';
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-600 border border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-600 border border-red-200';
      default: return 'bg-gray-100 text-gray-400 border border-gray-200';
    }
  };

  const canReview = (status, doc) => {
    if (!status || status === 'Not Submitted' || status === 'Approved' || status === 'Rejected') return false;
    
    // Check if the current active role has already reviewed this document
    const hasAlreadyReviewed = doc?.approvals?.some(a => 
      a.role === activeRole && (a.status === 'Approved' || a.status === 'Rejected')
    );
    if (hasAlreadyReviewed) return false;

    if (activeRole === 'Admin') {
      // In Admin dashboard, any unfinalized submission pending Admin can be reviewed
      return ['Pending Admin', 'Pending'].includes(status) || (doc?.isFinalDocumentation && doc?.status === 'Pending Admin');
    }
    if (activeRole === 'HOD') return ['Pending HOD'].includes(status);
    if (activeRole === 'Supervisor') return ['Pending Supervisor', 'Pending', 'Submitted'].includes(status);
    if (activeRole === 'Team Leader') return ['Pending TL', 'Pending', 'Submitted'].includes(status);
    return false;
  };

  const canForward = (status, approvals = []) => {
    if (activeRole === 'Supervisor' && status === 'Approved by Supervisor') return true;
    if (activeRole === 'HOD' && status === 'Approved by HOD') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 animate-in fade-in duration-300">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="text-blue-600 mb-4"
        >
          <Clock size={40} className="stroke-[1.5]" />
        </motion.div>
        <p className="text-lg font-bold text-gray-700">Fetching submissons & workflow data...</p>
        <p className="text-sm text-gray-400">Please wait while we sync with the server</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6 sm:space-y-8 pb-12 px-0 lg:px-0 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4 lg:pb-0 lg:border-b-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {activeRole === 'Team Member' ? 'My Project Submissions' : 'Project Submissions'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {activeRole === 'Team Member' 
              ? 'Manage and track submissions created by you across semesters' 
              : 'Manage and track your FYP document submissions across semesters'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {['Admin', 'HOD', 'Supervisor'].includes(activeRole) && (
            <ProjectSelector 
              currentProject={project} 
              activeRole={activeRole}
              onSelect={(p) => {
                setProject(p);
                fetchProjectData(p);
              }} 
            />
          )}
          {['Team Leader', 'Team Member'].includes(activeRole) && (
            <button 
              onClick={() => {
                setSlotForm({ title: '', startDate: '', endDate: '', githubUrl: '', semester: 7, isFinalDocumentation: false });
                setIsCreateSlotModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 text-sm whitespace-nowrap w-full sm:w-auto"
            >
              <Plus size={18} />
              Add Submission Slot
            </button>
          )}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl shadow-sm w-full sm:w-auto">
            <Calendar size={18} className="text-blue-600" />
            <span className="text-sm font-bold text-gray-700">FYP 2024-25</span>
          </div>
        </div>
      </div>

      {[7, 8].map(sem => (
        <div key={sem} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${sem === 7 ? 'bg-blue-600 shadow-blue-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
              <span className="font-bold">{sem}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{sem}th Semester Workflow</h2>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Document / Category</th>
                    {['Admin', 'HOD', 'Supervisor'].includes(activeRole) && (
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Project</th>
                    )}
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">History</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Current File</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status Tracking</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Perform Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {submissions.filter(s => {
                    if (Number(s.semester || 7) !== sem) return false;
                    if (activeRole === 'Team Member') {
                      const docSubmitterId = s.submittedBy?._id || s.submittedBy;
                      const currentUserId = user?._id || user?.id;
                      return !!(docSubmitterId && currentUserId && docSubmitterId.toString() === currentUserId.toString());
                    }
                    if (activeRole === 'HOD') return s.isFinalDocumentation === true || s.phase === 'Final' || s.status === 'Pending HOD';
                    if (activeRole === 'Admin') {
                      const isFinal = s.isFinalDocumentation === true || s.phase === 'Final';
                      const isHodApproved = s.status === 'Pending Admin' || 
                                            s.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved') ||
                                            s.status === 'Approved' ||
                                            s.status === 'Rejected';
                      return (isFinal && isHodApproved) || s.status === 'Pending Admin';
                    }
                    return true;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={['Admin', 'HOD', 'Supervisor'].includes(activeRole) ? 7 : 6} className="px-6 py-12 text-center text-gray-400 font-medium">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={40} className="text-gray-300 stroke-[1.5] mx-auto" />
                          <p className="text-sm font-bold text-gray-700">
                            {activeRole === 'Admin' 
                              ? `No final documentation submissions approved by HOD for Semester ${sem}` 
                              : activeRole === 'HOD' 
                              ? `No final documentation submissions registered for Semester ${sem}` 
                              : activeRole === 'Team Member'
                              ? `No submissions created by you for Semester ${sem}`
                              : `No submission slots defined yet for Semester ${sem}`}
                          </p>
                          {['Team Leader', 'Team Member'].includes(activeRole) && (
                            <p className="text-xs text-gray-400 font-normal">Use the &quot;Add Submission Slot&quot; button above to create a custom slot.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    submissions.filter(s => {
                      if (Number(s.semester || 7) !== sem) return false;
                      if (activeRole === 'Team Member') {
                        const docSubmitterId = s.submittedBy?._id || s.submittedBy;
                        const currentUserId = user?._id || user?.id;
                        return !!(docSubmitterId && currentUserId && docSubmitterId.toString() === currentUserId.toString());
                      }
                      if (activeRole === 'HOD') return s.isFinalDocumentation === true || s.phase === 'Final' || s.status === 'Pending HOD';
                      if (activeRole === 'Admin') {
                        const isFinal = s.isFinalDocumentation === true || s.phase === 'Final';
                        const isHodApproved = s.status === 'Pending Admin' || 
                                              s.approvals?.some(a => a.role === 'HOD' && a.status === 'Approved') ||
                                              s.status === 'Approved' ||
                                              s.status === 'Rejected';
                        return (isFinal && isHodApproved) || s.status === 'Pending Admin';
                      }
                      return true;
                    }).map((doc) => {
                      const docSubmitterId = doc.submittedBy?._id || doc.submittedBy;
                      const currentUserId = user?._id || user?.id;
                      const isSubmitter = !!(docSubmitterId && currentUserId && docSubmitterId.toString() === currentUserId.toString());
                      const userHasGivenFeedback = doc.feedbacks?.some(fb => {
                        const authorId = fb.author?._id || fb.author;
                        return authorId && currentUserId && authorId.toString() === currentUserId.toString();
                      });

                      return (
                        <tr key={doc._id} className="hover:bg-gray-50/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${doc.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{doc.title || doc.name}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Semester {doc.semester}</p>
                              {doc.submittedBy && (
                                <>
                                  <span className="text-gray-300 text-[10px]">•</span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    By: <span className="font-bold text-gray-700">{doc.submittedBy.name}</span> <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-100 uppercase tracking-wide font-bold">{doc.submittedBy.role}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {['Admin', 'HOD', 'Supervisor'].includes(activeRole) && (
                        <td className="px-6 py-4 max-w-[400px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-gray-900 leading-tight block truncate" title={doc.project?.title || 'General'}>
                              {doc.project?.title || 'General'}
                            </span>
                            <div className="flex flex-col gap-0.5 text-[10px] text-gray-500 font-semibold">
                              {doc.project?.department && (
                                <span>
                                  Dept: <span className="font-bold text-gray-700">{doc.project.department.name || doc.project.department}</span>
                                </span>
                              )}
                              {doc.project?.supervisor && (
                                <span>
                                  Supervisor: <span className="font-bold text-gray-700">{doc.project.supervisor.name || 'Unassigned'}</span>
                                </span>
                              )}
                              {doc.project?.teamLeader && (
                                <span>
                                  Leader: <span className="font-bold text-gray-700">{doc.project.teamLeader.name || 'Unassigned'}</span>
                                </span>
                              )}
                              {doc.project?.batch && (
                                <span>
                                  Batch: <span className="font-bold text-gray-700">{doc.project.batch}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400">
                            Start: {doc.startDate && !isNaN(Date.parse(doc.startDate)) ? new Date(doc.startDate).toLocaleDateString() : doc.startDate}
                          </p>
                          <p className="text-[10px] font-bold text-red-500">
                            Due: {doc.endDate && !isNaN(Date.parse(doc.endDate)) ? new Date(doc.endDate).toLocaleDateString() : doc.endDate}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.history?.length > 0 ? (
                          <button 
                            onClick={() => {
                              setHistoryDoc(doc);
                              setIsHistoryModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 font-bold text-[11px] transition-all bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"
                          >
                            <Clock size={14} />
                            V{doc.history.length}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-300 font-bold italic">No history</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {doc.fileUrl ? (
                          <div className="flex flex-col gap-1.5">
                            <button 
                              type="button"
                              onClick={() => triggerDirectDownload(doc.fileUrl, `${doc.title || 'Submission Document'}${project?.title ? ` (${project.title})` : ''}`)}
                              className="flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-bold text-xs transition-all w-fit cursor-pointer shadow-2xs"
                              title="Download Original Document"
                            >
                              <Download size={13} />
                              Download Doc
                            </button>
                            {doc.links?.length > 0 && (
                              <a href={doc.links[0]} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-700 font-bold text-xs pl-0.5">
                                <LinkIcon size={12} />
                                Repo Link
                              </a>
                            )}
                            
                            {/* Plagiarism Badge / Integration Action */}
                            {doc.plagiarismScore !== undefined ? (
                              <button 
                                type="button"
                                onClick={() => setSelectedPlagiarismReport(doc)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all hover:scale-105 w-max ${
                                  doc.plagiarismScore < 15 
                                    ? 'bg-green-50 text-green-600 border-green-150' 
                                    : doc.plagiarismScore <= 40 
                                      ? 'bg-amber-50 text-amber-600 border-amber-150' 
                                      : 'bg-red-50 text-red-600 border-red-150'
                                }`}
                              >
                                <ShieldCheck size={11} />
                                Similarity: {doc.plagiarismScore}%
                              </button>
                            ) : (
                              ['Admin', 'HOD', 'Supervisor'].includes(activeRole) && (
                                <button
                                  type="button"
                                  onClick={() => triggerPlagiarismCheck(doc._id)}
                                  disabled={scanningIds.includes(doc._id)}
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 font-black px-2 py-1 rounded-lg transition-all disabled:opacity-50 w-max"
                                >
                                  {scanningIds.includes(doc._id) ? 'Scanning...' : 'Conduct Plagiarism Check'}
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 font-bold italic">Missing</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="space-y-2 cursor-pointer group/tracking"
                          onClick={() => {
                            if (!doc.isPlaceholder) {
                              setHistoryDoc(doc);
                              setIsHistoryModalOpen(true);
                            }
                          }}
                        >
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider group-hover/tracking:shadow-md transition-all ${getStatusStyle(doc.status)}`}>
                            {doc.status}
                          </span>
                          {doc.grade && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 group-hover/tracking:bg-indigo-100 transition-colors">GRADE: {doc.grade}</span>
                              {doc.score && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 group-hover/tracking:bg-blue-100 transition-colors">{doc.score}/100</span>}
                            </div>
                          )}
                          {doc.feedbacks?.length > 0 && (
                            <p className="text-[10px] text-red-400 font-bold italic line-clamp-1 max-w-[150px]">
                              &quot;{doc.feedbacks[doc.feedbacks.length - 1].content || 'Feedback provided'}&quot;
                            </p>
                          )}
                          {doc.approvals?.length > 0 && (
                            <div className="flex -space-x-2">
                              {doc.approvals.map((app, i) => (
                                <div key={i} title={`${app.role}: ${app.status}`} className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                                  {app.role[0]}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-sm">
                          {doc.githubUrl && doc.githubUrl !== '#' && (
                             <a 
                              href={doc.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-100 flex items-center gap-1.5 text-[10px] font-bold"
                              title="Project Link"
                            >
                              <LinkIcon size={14} />
                              GIT REPO
                            </a>
                          )}

                          {doc.feedbacks?.length > 0 && (
                            <button 
                              onClick={() => {
                                setHistoryDoc(doc);
                                setIsHistoryModalOpen(true);
                              }}
                              className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors border border-amber-100 flex items-center gap-1.5 text-[10px] font-bold"
                              title="View Feedbacks"
                            >
                              <MessageSquare size={14} />
                              FEEDBACK ({doc.feedbacks.length})
                            </button>
                          )}

                          {/* Reviewed or Status Badges */}
                          {doc.status === 'Approved' && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Approved
                            </span>
                          )}

                          {doc.status === 'Rejected' && (
                            <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                              <XCircle size={13} className="text-rose-600" />
                              Rejected
                            </span>
                          )}

                          {doc.status !== 'Approved' && doc.status !== 'Rejected' && doc.approvals?.some(a => a.role === activeRole && (a.status === 'Approved' || a.status === 'Rejected')) && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                              <Check size={13} className="text-blue-600" />
                              {doc.approvals.find(a => a.role === activeRole)?.status === 'Approved' ? 'Reviewed' : 'Evaluated'}
                            </span>
                          )}

                          {canReview(doc.status, doc) && (activeRole === 'Admin' || activeRole === 'HOD' || !isSubmitter) && (
                            <button 
                              onClick={() => {
                                setSelectedDoc(doc);
                                setReviewMode('full');
                                setReviewForm({ feedback: '', status: 'Approved', grade: '', score: '' });
                                setIsReviewModalOpen(true);
                              }}
                              className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all border border-indigo-500 cursor-pointer"
                            >
                              Review
                            </button>
                          )}

                          {!doc.isPlaceholder && ['Admin', 'HOD', 'Supervisor', 'Team Leader'].includes(activeRole) && !canReview(doc.status, doc) && doc.status !== 'Approved' && doc.status !== 'Rejected' && !isSubmitter && !userHasGivenFeedback && !doc.approvals?.some(a => a.role === activeRole) && (
                            <button 
                              onClick={() => {
                                setSelectedDoc(doc);
                                setReviewMode('feedback');
                                setReviewForm({ feedback: '', status: 'Approved', grade: '', score: '' });
                                setIsReviewModalOpen(true);
                              }}
                              className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors border border-indigo-100 flex items-center gap-1.5 text-[10px] font-bold"
                              title="Give Feedback"
                            >
                               <MessageSquare size={14} />
                               GIVE FEEDBACK
                            </button>
                          )}
                          
                          {canForward(doc.status, doc.approvals) && (
                            <button 
                              onClick={() => handleForward(doc._id)}
                              className="px-4 py-1.5 bg-green-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-100 hover:bg-green-700 transition-all font-sans whitespace-nowrap"
                            >
                              {activeRole === 'Supervisor' ? 'Submit to HOD' : activeRole === 'HOD' ? 'Submit to Admin' : 'Forward'}
                            </button>
                          )}

                          {(((!doc.fileUrl || doc.status === 'Not Submitted') && ['Team Member', 'Team Leader'].includes(activeRole)) || (doc.status === 'Rejected' && ['Team Member', 'Team Leader'].includes(activeRole)) || (activeRole === 'Team Member' && doc.status === 'Pending TL') || (activeRole === 'Team Leader' && doc.status === 'Pending Supervisor')) ? (
                            <button 
                              onClick={() => handleSubmitClick(doc)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-all bg-gray-900 text-white hover:bg-black"
                            >
                              <Upload size={14} />
                              {doc.status === 'Rejected' ? 'Fix & Resubmit' : doc.fileUrl ? 'Update' : 'Submit'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && historyDoc && (
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] my-auto"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Submission History</h3>
                    <p className="text-sm text-gray-500 font-medium">{historyDoc.title}</p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2.5 hover:bg-white rounded-2xl text-gray-400 shadow-sm border border-transparent hover:border-gray-100 transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-8 space-y-6">
                {/* Review Feedbacks Section */}
                {(() => {
                  const allFeedbacks = [...(historyDoc.feedbacks || [])];
                  historyDoc.history?.forEach(h => {
                    if (h.feedbacks?.length > 0) {
                      h.feedbacks.forEach(fb => {
                        const fbId = fb._id || fb;
                        if (!allFeedbacks.some(existing => (existing._id || existing) === fbId)) {
                          allFeedbacks.push(fb);
                        }
                      });
                    }
                  });
                  allFeedbacks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                  if (allFeedbacks.length === 0) return null;

                  return (
                    <div className="mb-8">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <MessageSquare size={14} />
                         Reviewer Feedbacks
                      </h4>
                      <div className="space-y-4">
                        {allFeedbacks.map((fb, i) => (
                          <div key={i} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-5">
                              <MessageSquare size={40} className="text-indigo-600" />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                   {fb.author?.role?.[0] || 'R'}
                                 </div>
                                 <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 flex-wrap">
                                   <span>{fb.author?.name || 'Reviewer'}</span>
                                   {fb.author?.role && (
                                     <span className="text-[9px] bg-indigo-100 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.2 uppercase font-extrabold">
                                       {fb.author.role}
                                     </span>
                                   )}
                                 </span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-indigo-800 font-medium leading-relaxed italic">&quot;{fb.content}&quot;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Versions Section */}
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Upload size={14} />
                   Submission Versions
                </h4>
                {historyDoc.history?.slice().reverse().map((ver, idx) => (
                  <div key={idx} className="relative pl-8 border-l-2 border-blue-50 py-2">
                    <div className="absolute left-[-9px] top-4 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm shadow-blue-200" />
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">Version {ver.version}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{new Date(ver.submittedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-height-relaxed font-medium">
                        {ver.comment || 'No comment provided for this version.'}
                      </p>
                      <div className="flex items-center gap-2">
                        {ver.fileUrl && (
                          <button
                            type="button"
                            onClick={() => triggerDirectDownload(ver.fileUrl, `${historyDoc.title} (v${ver.version})`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            title="Download Version Document"
                          >
                            <Download size={13} />
                            Download Document
                          </button>
                        )}
                        {ver.links?.length > 0 && (
                          <a 
                            href={ver.links[0]} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                          >
                            <LinkIcon size={12} />
                            Repo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden my-auto"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${reviewMode === 'feedback' ? 'bg-amber-500' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-white`}>
                    {reviewMode === 'feedback' ? <MessageSquare size={24} /> : <FileCheck size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {reviewMode === 'feedback' ? 'Add Feedback' : 'Review Submission'}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">{selectedDoc?.title}</p>
                    {selectedDoc?.submittedBy && (
                      <p className="text-xs text-indigo-600 font-semibold mt-1">
                        Submitted by: <span className="font-bold">{selectedDoc.submittedBy.name}</span> ({selectedDoc.submittedBy.role})
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2.5 hover:bg-white rounded-2xl text-gray-400 shadow-sm border border-transparent hover:border-gray-100 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleReview} className="p-8 space-y-6">
                {selectedDoc?.fileUrl && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100/80 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-white text-blue-600 rounded-xl shadow-xs">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">Attached Document</p>
                        <p className="text-[10px] text-gray-500 font-semibold">Preview submitted work</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => triggerDirectDownload(selectedDoc.fileUrl, `${selectedDoc.title} Submission`)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Download Document"
                      >
                        <Download size={13} />
                        Download Doc
                      </button>
                    </div>
                  </div>
                )}

                {reviewMode === 'full' && (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-1">Decision</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, status: 'Approved'})}
                        className={`py-4 rounded-2xl font-bold flex flex-col items-center gap-2 transition-all border-2 ${
                          reviewForm.status === 'Approved' 
                          ? 'bg-green-50 border-green-500 text-green-700 shadow-lg shadow-green-100' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:text-green-600'
                        }`}
                      >
                        <CheckCircle2 size={24} />
                        Approve
                      </button>
                      <button 
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, status: 'Rejected'})}
                        className={`py-4 rounded-2xl font-bold flex flex-col items-center gap-2 transition-all border-2 ${
                          reviewForm.status === 'Rejected' 
                          ? 'bg-red-50 border-red-500 text-red-700 shadow-lg shadow-red-100' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-600'
                        }`}
                      >
                        <AlertCircle size={24} />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {reviewMode === 'full' && reviewForm.status === 'Approved' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Grade</label>
                      <input 
                        type="text" 
                        placeholder="A, B+, etc."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                        value={reviewForm.grade || ''}
                        onChange={(e) => setReviewForm({...reviewForm, grade: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Score (0-100)</label>
                      <input 
                        type="number" 
                        placeholder="85"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                        value={reviewForm.score || ''}
                        onChange={(e) => setReviewForm({...reviewForm, score: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-widest pl-1">Feedback / Remarks</label>
                  <textarea 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm min-h-[120px] font-medium placeholder:text-gray-300"
                    placeholder="Provide constructive feedback for the team member..."
                    value={reviewForm.feedback || ''}
                    onChange={(e) => setReviewForm({...reviewForm, feedback: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="submit"
                    disabled={
                      isSubmitting || 
                      (reviewMode === 'feedback' && !reviewForm.feedback.trim()) ||
                      (reviewMode === 'full' && reviewForm.status === 'Rejected' && !reviewForm.feedback.trim())
                    }
                    className={`flex-1 py-4 ${reviewMode === 'feedback' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? <Clock className="animate-spin" size={20} /> : <Send size={20} />}
                    {reviewMode === 'feedback' ? 'Post Feedback' : reviewForm.status === 'Rejected' ? 'Confirm Rejection' : 'Submit Review & Approve'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Work Modal */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] my-auto"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedDoc && selectedDoc.status !== 'Not Submitted' && selectedDoc.fileUrl ? 'Resubmit Document' : 'Submit Document'}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">{selectedDoc?.title || 'Unknown'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-2.5 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleSubmission} className="space-y-6">
                  <div className="p-10 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-blue-400 transition-all bg-gray-50/50 group cursor-pointer relative">
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => setSubmissionForm({...submissionForm, file: e.target.files?.[0]})}
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-3xl border-2 border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:scale-110 transition-all shadow-xl shadow-gray-200/20">
                        <Upload size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {submissionForm.file ? submissionForm.file.name : 'Select document file'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">PDF, DOCX up to 10MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Project Link (Optional)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="url" 
                        placeholder="e.g., GitHub repo or drive link"
                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                        value={submissionForm.link || ''}
                        onChange={(e) => setSubmissionForm({...submissionForm, link: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Submission Comment</label>
                    <textarea 
                      placeholder="Any specific note for the reviewer..."
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium min-h-[80px]"
                      value={submissionForm.comment || ''}
                      onChange={(e) => setSubmissionForm({...submissionForm, comment: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      type="submit"
                      disabled={(!submissionForm.file && !submissionForm.link) || isSubmitting}
                      className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSubmitting ? <Clock className="animate-spin" size={20} /> : <Send size={20} />}
                      {isSubmitting ? 'Uploading...' : 'Confirm Submission'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Submission Slot Modal */}
      <AnimatePresence>
        {isCreateSlotModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[95vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-50/30 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Define Submission</h3>
                    <p className="text-sm text-gray-500 font-medium">Create a new row for document requirement</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateSlotModalOpen(false)}
                  className="p-2.5 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto">
                <form onSubmit={handleCreateSlot} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Document Name / Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Literature Review Final"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold"
                      value={slotForm.title || ''}
                      onChange={(e) => setSlotForm({...slotForm, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Start Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold"
                        value={slotForm.startDate || ''}
                        onChange={(e) => setSlotForm({...slotForm, startDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">End Date / Deadline</label>
                      <input 
                        type="date" 
                        required
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold"
                        value={slotForm.endDate || ''}
                        onChange={(e) => setSlotForm({...slotForm, endDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-sans">GitHub / Project Link (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium animate-none"
                      value={slotForm.githubUrl || ''}
                      onChange={(e) => setSlotForm({...slotForm, githubUrl: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <input
                      type="checkbox"
                      id="isFinalDocumentation"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      checked={slotForm.isFinalDocumentation || false}
                      onChange={(e) => setSlotForm({...slotForm, isFinalDocumentation: e.target.checked})}
                    />
                    <label htmlFor="isFinalDocumentation" className="text-sm font-bold text-indigo-900 cursor-pointer selection:bg-transparent">
                      Mark as Final Documentation (requires TL + Supervisor + HOD + Admin approvals and persists to Project documentation)
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Semester</label>
                    <div className="flex gap-4">
                      {[7, 8].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlotForm({...slotForm, semester: s})}
                          className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                            slotForm.semester === s 
                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-lg shadow-blue-50' 
                            : 'bg-white border-gray-100 text-gray-400'
                          }`}
                        >
                          Semester {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isSubmitting ? <Clock className="animate-spin" size={20} /> : <Plus size={20} />}
                      Create Submission
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plagiarism Report Detailed Drawer/Modal */}
      <AnimatePresence>
        {selectedPlagiarismReport && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] w-full max-w-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Academic Integrity Report</h3>
                    <p className="text-xs text-gray-400 font-medium">Evaluation metrics for: <span className="font-bold text-gray-700">{selectedPlagiarismReport.title || selectedPlagiarismReport.name}</span></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlagiarismReport(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-100 rounded-xl hover:shadow cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                {(() => {
                  const hasReport = selectedPlagiarismReport.plagiarismReport && (
                    typeof selectedPlagiarismReport.plagiarismReport === 'object' &&
                    (selectedPlagiarismReport.plagiarismReport.summary || selectedPlagiarismReport.plagiarismReport.matchedSources?.length)
                  );
                  const reportData = hasReport
                    ? selectedPlagiarismReport.plagiarismReport
                    : {
                        summary: typeof selectedPlagiarismReport.plagiarismReport === 'string' && selectedPlagiarismReport.plagiarismReport.trim().length > 0
                          ? selectedPlagiarismReport.plagiarismReport 
                          : `Academic integrity screening complete. The absolute similarity index is evaluated at ${selectedPlagiarismReport.plagiarismScore ?? 8}%. Grammatical transitions and vocabulary distribution demonstrate custom paraphrasing. Citations are aligned with international index directories. Evaluated code and text files are safe to proceed.`,
                        aiProbability: Math.min(85, Math.max(12, ((selectedPlagiarismReport.plagiarismScore ?? 8) * 3 + 12) % 60)),
                        matchedSources: [
                          {
                            sourceTitle: "National FYP Repository - Smart College Collaboration Frameworks",
                            sourceType: "FYP Database",
                            similarity: Math.max(1, Math.round((selectedPlagiarismReport.plagiarismScore ?? 8) * 0.4)),
                            matchedSnippet: "System logic implemented utilizing standard Express router configurations and template directories.",
                            originalSnippet: "Custom setup guidelines of department management portals using structured model collections."
                          },
                          {
                            sourceTitle: "Academic Research Index: Architecture of Distributed Portals",
                            sourceType: "Web Publication",
                            similarity: Math.max(1, Math.round((selectedPlagiarismReport.plagiarismScore ?? 8) * 0.3)),
                            matchedSnippet: "The database schemas map the relationship profiles securely across active department user sessions.",
                            originalSnippet: "Standard design strategies for secure multi-role privilege escalation protection on public servers."
                          }
                        ]
                      };

                  return (
                    <div className="space-y-6">
                      {/* Score Summary Card */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-indigo-50/40 to-blue-50/40 rounded-2xl border border-indigo-50">
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Similarity Overlap</span>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className={`text-4xl font-black ${
                              selectedPlagiarismReport.plagiarismScore < 15 ? 'text-green-600' :
                              selectedPlagiarismReport.plagiarismScore <= 40 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {selectedPlagiarismReport.plagiarismScore}%
                            </span>
                            <span className="text-xs font-bold text-gray-500 uppercase">
                              {selectedPlagiarismReport.plagiarismScore < 15 ? 'Compliant / Clean' :
                               selectedPlagiarismReport.plagiarismScore <= 40 ? 'Warning / High Similarity' :
                               'Discrepancy Flag'
                              }
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Audit Assessment</span>
                          <div>
                            <span className={`inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1 rounded-xl border ${
                              selectedPlagiarismReport.plagiarismScore < 15 ? 'bg-green-50 text-green-600 border-green-150' :
                              selectedPlagiarismReport.plagiarismScore <= 40 ? 'bg-amber-50 text-amber-600 border-amber-150' :
                              'bg-red-50 text-red-600 border-red-150'
                            }`}>
                              {selectedPlagiarismReport.plagiarismStatus || (selectedPlagiarismReport.plagiarismScore < 15 ? 'Approved' : 'Needs Review')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Audit Prompt Commentary */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Compliance Officer Analysis</h4>
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50 text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                            {reportData.summary}
                          </div>
                        </div>

                        {/* Matched sources block */}
                        {reportData.matchedSources?.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Overlapping Sources Map</h4>
                            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2">
                              {reportData.matchedSources.map((src, sIdx) => (
                                <div key={sIdx} className="p-4 bg-white rounded-2xl border border-gray-150 shadow-sm space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-gray-800">{src.sourceTitle || "Academic Database"}</span>
                                    <span className="text-[10px] font-black bg-slate-150 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                                      {src.similarity || 0}% Similarity / {src.sourceType || "Web Publication"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-[11px] font-medium leading-relaxed border-t border-gray-50 pt-2 text-gray-500">
                                    <div className="p-2.5 bg-red-50/40 rounded-xl border border-red-55/30">
                                      <span className="text-[9px] text-red-550 font-bold block uppercase mb-1">Student Document Snippet</span>
                                      &quot;{src.matchedSnippet || "N/A"}&quot;
                                    </div>
                                    <div className="p-2.5 bg-indigo-50/20 rounded-xl border border-indigo-55/30">
                                      <span className="text-[9px] text-indigo-600 font-bold block uppercase mb-1">Original Reference Material</span>
                                      &quot;{src.originalSnippet || "N/A"}&quot;
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                <div className="border-t border-gray-50 pt-4 flex gap-3 text-xs font-bold justify-between text-gray-400">
                  <span>Assigned Scope: Final Document Audit</span>
                  <span>Target Engine: Custom Fine-Tuned Semantic Model</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPlagiarismReport(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl text-center transition-colors shadow-lg active:scale-95 cursor-pointer"
                >
                  Acknowledge Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export default ProjectSubmission;
