import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Announcements from '../../components/Announcements';
import ProjectRecords from '../../components/ProjectRecords';
import Feedback from '../../components/Feedback';
import Notifications from '../../components/Notifications';
import SupervisorTeams from '../../components/SupervisorTeams';
import TaskManagement from '../../components/TaskManagement';
import Assignments from '../../components/Assignments';
import ProjectSubmission from '../../components/ProjectSubmission';
import PlagiarismChecker from '../../components/PlagiarismChecker';
import { 
  Briefcase, 
  FileText, 
  Clock,
  Users as UsersIcon,
  TrendingUp,
  Activity,
  Check,
  X,
  Send,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';

const DashboardOverview = ({ stats, monthlyTrend, reviews = [], projects = [], onReviewSuccess }) => {
  const [activeReview, setActiveReview] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewScore, setReviewScore] = useState('85');
  const [reviewGrade, setReviewGrade] = useState('A');
  const [reviewStatus, setReviewStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'
  const [nudgeStatus, setNudgeStatus] = useState({}); // { [teamId]: 'idle' | 'nudging' | 'sent' }

  const handleAction = async (actionType) => {
    if (!activeReview) return;
    const reviewId = activeReview.id || activeReview._id;
    if (!reviewId) {
      toast.error("Submission ID not found.");
      return;
    }
    setReviewStatus('submitting');
    try {
      if (actionType === 'approve') {
        await axios.put(`/api/submissions/${reviewId}/approve`, {
          grade: reviewGrade || undefined,
          score: reviewScore ? Number(reviewScore) : undefined,
          feedback: reviewFeedback
        });
        toast.success("Submission approved successfully!");
      } else {
        await axios.put(`/api/submissions/${reviewId}/reject`, {
          feedback: reviewFeedback || "Changes requested by Supervisor."
        });
        toast.success("Submission rejected.");
      }
      setReviewStatus('success');
      setTimeout(() => {
        setActiveReview(null);
        setReviewStatus('idle');
        if (onReviewSuccess) onReviewSuccess();
      }, 1200);
    } catch (err) {
      console.error("Error submitting review action:", err);
      toast.error(err.response?.data?.message || "Failed to process review.");
      setReviewStatus('idle');
    }
  };

  const handleNudge = (teamId) => {
    setNudgeStatus(prev => ({ ...prev, [teamId]: 'nudging' }));
    setTimeout(() => {
      setNudgeStatus(prev => ({ ...prev, [teamId]: 'sent' }));
    }, 1200);
  };

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-none">
        {stats.map((stat, idx) => (
          <motion.div
            key={`sup-stat-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            <div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:rotate-6 transition-transform">
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
                </div>
              </div>
            </div>
            {stat.extra && (
              <div className="mt-4 border-t border-gray-150 pt-3 relative z-10">
                {stat.extra}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Supervision Vitality - Area Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <TrendingUp size={120} className="text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Supervision Vitality</h2>
                <p className="text-xs text-gray-400 font-medium">Monitoring group submission rates over time</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <Activity size={14} />
                Consistent Trend
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSup" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="activity" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorSup)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* REPLACEMENT 1: Interactive Submission Approval Console */}
        <div id="quick-approval-console" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-[470px]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles size={20} className="text-amber-500 fill-amber-500 animate-pulse" />
                    Review Desk
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">Evaluate pending student documentations</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {reviews.length} pending
                </span>
              </div>

              <AnimatePresence mode="wait">
                {activeReview ? (
                  <motion.div 
                    key="active-review"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3 relative"
                  >
                    {reviewStatus !== 'success' && (
                      <button 
                        onClick={() => setActiveReview(null)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      >
                        <X size={16} />
                      </button>
                    )}
                    
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded-md">
                        {activeReview.group}
                      </span>
                      <h3 className="text-sm font-extrabold text-gray-900 mt-2 line-clamp-1">{activeReview.doc}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Submitted: {activeReview.submitted}</p>
                    </div>

                    {reviewStatus === 'success' ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                          <Check size={20} />
                        </div>
                        <p className="text-xs font-bold text-green-700">Review Processed!</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5">
                          <div>
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Comments / Feedback</label>
                            <textarea 
                              value={reviewFeedback || ''}
                              onChange={(e) => setReviewFeedback(e.target.value)}
                              placeholder="Add helpful mentoring commentary..."
                              rows={2}
                              className="w-full mt-1 px-3 py-1.5 bg-white text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Score (0-100)</label>
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                value={reviewScore || ''}
                                onChange={(e) => setReviewScore(e.target.value)}
                                placeholder="80"
                                className="w-full mt-1 px-3 py-1.5 bg-white text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Grade</label>
                              <select
                                value={reviewGrade || 'A'}
                                onChange={(e) => setReviewGrade(e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 bg-white text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                              >
                                <option value="A">Grade A</option>
                                <option value="B">Grade B</option>
                                <option value="C">Grade C</option>
                                <option value="D">Grade D</option>
                                <option value="F">Grade F</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {reviewStatus === 'submitting' ? (
                          <div className="text-center py-2 text-xs font-bold text-blue-600 animate-pulse">
                            Submitting review...
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleAction('approve')}
                              className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleAction('reject')}
                              className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="reviews-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3 max-h-[300px] overflow-y-auto pr-1"
                  >
                    {reviews.length > 0 ? (
                      reviews.map((rev) => (
                        <div 
                          key={rev.id}
                          onClick={() => {
                            setActiveReview(rev);
                            setReviewFeedback('');
                            setReviewScore('85');
                            setReviewGrade('A');
                          }}
                          className="p-3 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-150 border border-gray-100 rounded-2xl transition-all flex flex-col gap-2 cursor-pointer group/rev"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase">
                                {rev.group}
                              </span>
                              <h4 className="text-xs font-bold text-gray-900 group-hover/rev:text-blue-600 transition-colors truncate mt-0.5">
                                {rev.doc}
                              </h4>
                              <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {rev.submitted}
                              </p>
                            </div>
                            <span className="text-[8px] font-black tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase">
                              Docs
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-blue-600 group-hover/rev:underline">
                              Evaluate &rarr;
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-150 animate-bounce">
                          <Check size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Review Box Clear!</p>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto">No student documentation uploads are pending your response.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* REPLACEMENT 2: Assigned Supervised Groups & Team Health Monitor */}
      <div id="supervised-teams-monitor" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assigned Supervised Projects</h2>
            <p className="text-xs text-gray-400 font-medium">Monitor real-time implementation completion, active milestone phases, and leader feedback</p>
          </div>
          <div className="flex bg-gray-50 border border-gray-150 p-1.5 rounded-2xl w-fit">
            <span className="px-4 py-1.5 text-xs font-extrabold rounded-xl bg-blue-600 text-white shadow-sm flex items-center gap-2">
              <UsersIcon size={14} />
              {projects.length} Supervised Groups
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((proj, idx) => {
              const teamId = proj._id || idx;
              const progressVal = proj.progress || 0;
              const phaseName = proj.currentPhase || proj.phase || "Proposal";
              
              const phaseColors = {
                Proposal: 'bg-amber-50 text-amber-600 border-amber-100',
                Analysis: 'bg-sky-50 text-sky-600 border-sky-100',
                Design: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                Implementation: 'bg-violet-50 text-violet-600 border-violet-100',
                Final: 'bg-emerald-50 text-emerald-600 border-emerald-100'
              };
              const currentColorClass = phaseColors[phaseName] || 'bg-gray-50 text-gray-600 border-gray-100';

              return (
                <motion.div
                  key={`proj-card-${teamId}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 rounded-2xl border border-gray-100 hover:border-blue-200 bg-gray-50/50 hover:bg-white hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${currentColorClass}`}>
                        {phaseName} Phase
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        proj.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        proj.status === 'In Progress' || proj.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {proj.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1">{proj.teamName || 'Research Group'}</h4>
                      <p className="text-xs text-gray-400 font-bold line-clamp-2 mt-1 min-h-[32px]">
                        {proj.title}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-gray-400 uppercase tracking-widest">Progress</span>
                        <span className="font-black text-gray-900">{progressVal}%</span>
                      </div>
                      <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                        {proj.teamLeader?.name ? proj.teamLeader.name[0] : 'L'}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">PM / Leader</p>
                        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{proj.teamLeader?.name || 'Unassigned'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNudge(teamId)}
                      disabled={nudgeStatus[teamId] === 'nudging' || nudgeStatus[teamId] === 'sent'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
                        nudgeStatus[teamId] === 'sent' 
                          ? 'bg-green-50 text-green-600 border-green-150' 
                          : nudgeStatus[teamId] === 'nudging'
                            ? 'bg-gray-100 text-gray-400 border-gray-200 animate-pulse'
                            : 'bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 border-gray-200 hover:border-rose-100'
                      }`}
                    >
                      {nudgeStatus[teamId] === 'sent' ? (
                        <>✓ Nudged</>
                      ) : nudgeStatus[teamId] === 'nudging' ? (
                        <>In progress...</>
                      ) : (
                        <>
                          <Send size={11} />
                          Nudge
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-50 border border-gray-150 rounded-2xl p-82 text-center text-gray-500">
              <AlertCircle className="mx-auto text-gray-400 mb-2" size={24} />
              No active teams assigned to your supervision yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SupervisorDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    let isMounted = true;
    const fetchStatsAndProjects = async () => {
      try {
        const statsRes = await axios.get(`/api/dashboard/supervisor?t=${Date.now()}`);
        if (isMounted) setStatsData(statsRes.data);
        
        const projectsRes = await axios.get('/api/projects');
        if (isMounted) setProjects(projectsRes.data);
      } catch (error) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          console.error('Error fetching supervisor dashboard info:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatsAndProjects();

    const isRoot = location.pathname === '/dashboard/supervisor' || location.pathname === '/dashboard/supervisor/';
    let intervalId;
    if (isRoot) {
      intervalId = setInterval(fetchStatsAndProjects, 8000);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [location.pathname, refreshTrigger]);

  const groupProgress = statsData?.groupProgress || [];
  const monthlyTrend = statsData?.monthlyTrend || [
    { month: 'Week 1', activity: 0 },
    { month: 'Week 2', activity: 0 },
    { month: 'Week 3', activity: 0 },
    { month: 'Week 4', activity: 0 },
  ];

  const totalTasks = statsData?.totalTasks ?? 0;
  const completedTasks = statsData?.completedTasks ?? 0;
  const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    { 
      label: 'Assigned Groups', 
      value: String(statsData?.totalGroups ?? 0), 
      icon: Briefcase, 
      color: 'blue',
      extra: (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Active Supervised Projects</span>
          <span className="font-semibold text-blue-600">Live</span>
        </div>
      )
    },
    { 
      label: 'Pending Reviews', 
      value: String(statsData?.pendingReviews ?? 0), 
      icon: FileText, 
      color: 'blue',
      extra: (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Awaiting supervisor action</span>
          {statsData?.pendingReviews > 0 ? (
            <span className="font-bold text-amber-500 animate-pulse">Action Required</span>
          ) : (
            <span className="font-semibold text-green-500">All Clear</span>
          )}
        </div>
      )
    },
    { 
      label: 'Supervised Tasks', 
      value: `${completedTasks} / ${totalTasks}`, 
      icon: Clock, 
      color: 'blue',
      extra: (
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Overall Progress</span>
            <span className="text-blue-600">{taskCompletionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${taskCompletionPercentage}%` }}
            />
          </div>
        </div>
      )
    },
    { 
      label: 'Completed Projects', 
      value: String(statsData?.completedProjects ?? 0), 
      icon: UsersIcon, 
      color: 'blue',
      extra: (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg w-max mt-0.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Published by Admin
        </div>
      )
    },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading supervisor dashboard...</div>;

  return (
    <div className="pb-12 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <Routes>
        <Route 
          path="/" 
          element={
            <DashboardOverview 
              stats={stats} 
              groupProgress={groupProgress} 
              monthlyTrend={monthlyTrend} 
              reviews={statsData?.reviews || []}
              projects={projects}
              onReviewSuccess={triggerRefresh}
            />
          } 
        />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/projects" element={<ProjectRecords />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/teams" element={<SupervisorTeams />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/submissions" element={<ProjectSubmission />} />
        <Route path="/plagiarism" element={<PlagiarismChecker />} />
      </Routes>
    </div>
  );
};

export default SupervisorDashboard;
