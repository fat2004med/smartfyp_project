import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Announcements from '../../components/Announcements';
import UserManagement from '../../components/UserManagement';
import ProjectRecords from '../../components/ProjectRecords';
import TeamManagement from '../../components/TeamManagement';
import SupervisorManagement from '../../components/SupervisorManagement';
import Approvals from '../../components/Approvals';
import Feedback from '../../components/Feedback';
import Notifications from '../../components/Notifications';
import Assignments from '../../components/Assignments';
import ProjectSubmission from '../../components/ProjectSubmission';
import PlagiarismChecker from '../../components/PlagiarismChecker';
import { 
  Users, 
  Briefcase, 
  FileText,
  Eye,
  TrendingUp,
  Activity,
  X,
  ChevronRight,
  Mail,
  Phone,
  Code2,
  Award,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Search,
  Send,
  AlertTriangle,
  Sparkles,
  Gauge,
  Download
} from 'lucide-react';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';
import { triggerDirectDownload } from '../../utils/fileHelpers';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const DashboardOverview = ({ stats, statsData, supervisorStats, deptPerformance, recentAssignments, performanceTrend, allProjects, onViewSupervisorTeams, onViewProjectDetails, onViewDoc }) => {
  const { user } = useAuth();
  const [drilldownSup, setDrilldownSup] = useState(null);
  const [workloadMode, setWorkloadMode] = useState('chart'); // 'chart' | 'matrix'
  const [supSearch, setSupSearch] = useState('');
  const [expandedSupId, setExpandedSupId] = useState(null);
  const [nudgeStatus, setNudgeStatus] = useState({}); // { [teamId]: 'idle' | 'nudging' | 'sent' }
  const [facultyNudge, setFacultyNudge] = useState({}); // { [supId]: 'idle' | 'nudging' | 'sent' }

  const deptProjects = allProjects || [];
  const departmentName = statsData?.departmentName || user?.department?.name || (typeof user?.department === 'string' && user.department.length !== 24 ? user.department : "Information Technology");

  const getCapacityBadge = (groups) => {
    if (groups <= 1) return { label: 'Flexible Capacity', color: 'bg-sky-50 text-sky-600 border-sky-150' };
    if (groups >= 4) return { label: 'High Allocation', color: 'bg-rose-50 text-rose-600 border-rose-150' };
    return { label: 'Optimal Load', color: 'bg-emerald-50 text-emerald-700 border-emerald-150' };
  };

  const nudgeTeam = (teamId) => {
    setNudgeStatus(prev => ({ ...prev, [teamId]: 'nudging' }));
    setTimeout(() => {
      setNudgeStatus(prev => ({ ...prev, [teamId]: 'sent' }));
    }, 1000);
  };

  const nudgeSupervisor = (supId, e) => {
    e?.stopPropagation();
    setFacultyNudge(prev => ({ ...prev, [supId]: 'nudging' }));
    setTimeout(() => {
      setFacultyNudge(prev => ({ ...prev, [supId]: 'sent' }));
    }, 1000);
  };

  const toggleSupExpand = (supId) => {
    setExpandedSupId(expandedSupId === supId ? null : supId);
  };

  // Find lowest progress projects (bottlenecks)
  const atRiskProjects = deptProjects
    .filter(p => p.status !== 'Completed' && p.status !== 'Published')
    .sort((a,b) => (a.progress || 0) - (b.progress || 0))
    .slice(0, 3);

  // Filter supervisors based on search box
  const searchLower = supSearch.toLowerCase();
  const searchFilteredSupervisors = supervisorStats.filter(sup => 
    sup.name.toLowerCase().includes(searchLower) ||
    (sup.interests && sup.interests.toLowerCase().includes(searchLower))
  );

  // Calculate real-time submissions count by academic stage from deptProjects for HOD Overview (Real Data calculation)
  const milestoneCounts = {
    'Proposal Stage': 0,
    'SRS & Analysis': 0,
    'Design Specification': 0,
    'Implementation & Code': 0,
    'Final Thesis Review': 0
  };

  deptProjects.forEach(proj => {
    const phase = proj.currentPhase || 'Proposal';
    if (phase === 'Proposal') milestoneCounts['Proposal Stage']++;
    else if (phase === 'Analysis') milestoneCounts['SRS & Analysis']++;
    else if (phase === 'Design') milestoneCounts['Design Specification']++;
    else if (phase === 'Implementation') milestoneCounts['Implementation & Code']++;
    else if (phase === 'Final') milestoneCounts['Final Thesis Review']++;
    else milestoneCounts['Proposal Stage']++; // Fallback
  });

  const milestonesColorMap = ['#3B82F6', '#6366F1', '#F59E0B', '#10B981', '#EC4899'];
  const finalSubmissionsData = Object.keys(milestoneCounts).map((key, idx) => ({
    name: key,
    count: milestoneCounts[key],
    color: milestonesColorMap[idx]
  }));

  // Calculate HOD's direct Proposal & FYP Evaluation pipeline metrics based on real status
  const totalRegistered = deptProjects.length || 1;
  const pendingSupervisor = deptProjects.filter(p => !p.isApprovedBySupervisor && p.status === 'Proposed').length;
  const pendingHOD = deptProjects.filter(p => p.isApprovedBySupervisor && !p.isApprovedByHOD && p.status === 'Proposed').length;
  const activeOrApproved = deptProjects.filter(p => p.isApprovedByHOD || p.status === 'Active' || p.status === 'Approved').length;
  const completedOrViva = deptProjects.filter(p => p.status === 'Completed' || p.status === 'Published').length;

  const funnelMetrics = [
    { name: 'Awaiting Advisor Sign-off', count: pendingSupervisor, percentage: Math.round((pendingSupervisor / totalRegistered) * 100), color: '#F59E0B' },
    { name: 'Awaiting HOD Panel Approval', count: pendingHOD, percentage: Math.round((pendingHOD / totalRegistered) * 100), color: '#3B82F6' },
    { name: 'Approved & Active Projects', count: activeOrApproved, percentage: Math.round((activeOrApproved / totalRegistered) * 100), color: '#10B981' },
    { name: 'Completed / Ready for Viva', count: completedOrViva, percentage: Math.round((completedOrViva / totalRegistered) * 100), color: '#EC4899' }
  ];

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-none">
        {stats.map((stat, index) => (
          <motion.div
            key={`stat-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interactive Recent Submissions & Documents Requiring Review */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between" id="recent-reviewable-submissions">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 uppercase">
                    {departmentName}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Real-Time Evaluation Feed</span>
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mt-2.5 font-sans tracking-tight">Recent Submissions & Reviews</h2>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Evaluate incoming deliverables, source proposals, and endorse academic drafts from student teams needing HOD clearance</p>
              </div>
            </div>

            {/* Submissions List Container */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {deptProjects.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-150">
                  <FileText className="mx-auto text-gray-300 mb-2.5" size={32} />
                  <p className="text-sm font-bold text-gray-400 italic">No submissions or project records registered yet.</p>
                </div>
              ) : (
                <>
                  {/* Category Status Banner */}
                  {deptProjects.some(p => (p.status === 'Proposed' || p.status === 'Completed') && p.isApprovedBySupervisor && !p.isApprovedByHOD) && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                        ⚠️ Action Required: Projects Seeking HOD Review & Endorsement ({deptProjects.filter(p => (p.status === 'Proposed' || p.status === 'Completed') && p.isApprovedBySupervisor && !p.isApprovedByHOD).length})
                      </span>
                    </div>
                  )}

                  {deptProjects.map((proj, idx) => {
                    const isPendingHOD = (proj.status === 'Proposed' || proj.status === 'Completed') && proj.isApprovedBySupervisor && !proj.isApprovedByHOD;
                    const isPendingSupervisor = (proj.status === 'Proposed' || proj.status === 'Completed') && !proj.isApprovedBySupervisor;
                    const isPendingAdmin = (proj.status === 'Proposed' || proj.status === 'Completed') && proj.isApprovedBySupervisor && proj.isApprovedByHOD && !proj.isApprovedByAdmin;
                    
                    let statusLabel = 'Ongoing Development';
                    let statusColor = 'bg-blue-50 text-blue-700 border-blue-150';
                    if (isPendingHOD) {
                      statusLabel = 'Pending HOD Approval';
                      statusColor = 'bg-amber-50 text-[#D97706] border-amber-150 animate-pulse';
                    } else if (isPendingSupervisor) {
                      statusLabel = 'Pending Advisor Sign-off';
                      statusColor = 'bg-stone-50 text-stone-600 border-stone-150';
                    } else if (isPendingAdmin) {
                      statusLabel = 'Pending Admin Approval';
                      statusColor = 'bg-purple-50 text-purple-700 border-purple-150';
                    } else if (proj.status === 'Completed' || proj.status === 'Published') {
                      statusLabel = 'Completed / Final Viva';
                      statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                    } else if (proj.status === 'Rejected') {
                      statusLabel = 'Returned / Rejected';
                      statusColor = 'bg-rose-50 text-rose-600 border-rose-150';
                    }

                    return (
                      <div 
                        key={proj._id || idx}
                        className={`p-4 bg-white hover:bg-slate-50 border rounded-2.5xl transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isPendingHOD ? 'border-amber-200 bg-amber-50/10 hover:bg-amber-50/20' : 'border-gray-150'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                              {proj.teamName || 'FYP Team'}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <h4 
                            className="font-extrabold text-sm text-gray-900 leading-snug line-clamp-1 cursor-pointer hover:text-indigo-600 hover:underline"
                            onClick={() => onViewProjectDetails && onViewProjectDetails(proj)}
                          >
                            {proj.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-gray-400">
                            <span className="inline-flex items-center gap-1 font-sans text-gray-500">
                              Advisor: <strong className="text-gray-700 font-extrabold">{proj.supervisor?.name || 'Assigned'}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              Milestone: <strong className="text-gray-700 font-extrabold">{proj.currentPhase || 'Proposal'} Stage</strong>
                            </span>
                            {proj.progress !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                Progress: <strong className="text-gray-700 font-extrabold">{proj.progress}%</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Actions Grid */}
                        <div className="flex items-center gap-2 shrink-0">
                          {proj.fileUrl ? (
                            <button 
                              type="button"
                              onClick={() => triggerDirectDownload(proj.fileUrl, `${proj.title || 'Proposal'}`)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black tracking-tight flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                              title="Download original proposal document"
                            >
                              <Download size={13} /> Download Doc
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 italic bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                              No Doc
                            </span>
                          )}

                          <button 
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-tight flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            onClick={() => onViewProjectDetails && onViewProjectDetails(proj)}
                          >
                            <Eye size={14} /> View Details
                          </button>

                          {isPendingHOD && (
                            <Link
                              to="/dashboard/hod/approvals"
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black tracking-tight transition-colors"
                            >
                              Endorse
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Project Status PIE */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Portfolio</h2>
          <p className="text-xs text-gray-400 font-medium mb-8">Status distribution of departmental projects</p>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {deptPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3 mt-6">
            {deptPerformance.map((item, index) => (
              <div key={`dept-perf-${index}`} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-bold text-gray-600">{item.name}</span>
                </div>
                <span className="font-black text-gray-900 text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interactive Supervisor Performance Metrics */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Faculty Advising Load & Capacity</h2>
              <p className="text-xs text-gray-400 font-medium">Comparative portfolio sizes and active supervisor groups across department faculty</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase">Interactive mode:</span>
              <button
                onClick={() => { setWorkloadMode('chart'); setDrilldownSup(null); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold border ${
                  workloadMode === 'chart' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-gray-150 text-gray-500'
                }`}
              >
                Chart Portfolios
              </button>
              <button
                onClick={() => setWorkloadMode('drill')}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold border ${
                  workloadMode === 'drill' 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-gray-150 text-gray-500'
                }`}
              >
                Detailed List
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {workloadMode === 'chart' ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-xs text-indigo-600 font-bold mb-4 flex items-center gap-1">
                  💡 Tip: Click on any advisor bar inside the chart below to drill down into their research group workload!
                </p>
                <div className="w-full overflow-x-auto pb-4 scrollbar-thin">
                  <div style={{ minWidth: `${Math.max(640, supervisorStats.length * 85)}px`, height: '320px' }} className="relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={supervisorStats} 
                        margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                        onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            setDrilldownSup(data.activePayload[0].payload);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} />
                        <Tooltip 
                          cursor={{ fill: '#F9FAFB' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="groups" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40}>
                          {supervisorStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={drilldownSup?._id === entry._id ? '#4F46E5' : '#818CF8'} 
                              className="cursor-pointer hover:opacity-90"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Supervisor Drilldown block */}
                <AnimatePresence>
                  {drilldownSup && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black tracking-widest text-indigo-600 bg-indigo-100/50 px-2.5 py-0.5 rounded-full">Drill-Down Active Profile</span>
                        <h4 className="text-base font-extrabold text-gray-900">{drilldownSup.name}</h4>
                        {drilldownSup.interests && (
                          <p className="text-xs text-indigo-700 italic">Interests: {
                            Array.isArray(drilldownSup.interests) 
                              ? drilldownSup.interests.join(', ') 
                              : (typeof drilldownSup.interests === 'string' 
                                  ? drilldownSup.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                                  : drilldownSup.interests)
                          }</p>
                        )}
                        <div className="flex gap-4 pt-1">
                          <span className="text-xs font-bold text-gray-500">Supervised: <strong className="text-gray-900">{drilldownSup.groups} groups</strong></span>
                          <span className="text-xs font-bold text-gray-500">Score: <strong className="text-indigo-600">{drilldownSup.performance}%</strong></span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <button
                          onClick={() => onViewSupervisorTeams && onViewSupervisorTeams(drilldownSup)}
                          className="px-4 py-2 bg-indigo-600 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-700 shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye size={14} /> Full Active List
                        </button>
                        <button
                          onClick={() => setDrilldownSup(null)}
                          className="text-[10px] text-gray-400 hover:text-gray-900 font-extrabold tracking-wide uppercase leading-none mt-1 hover:underline text-center"
                        >
                          Dismiss drilldown
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="drill"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                  {supervisorStats.map((sup) => (
                    <div key={sup._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{sup.name}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5 break-all">{sup.email}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getCapacityBadge(sup.groups).color}`}>
                            {getCapacityBadge(sup.groups).label}
                          </span>
                        </div>
                        {sup.interests && (
                          <p className="text-[10px] text-gray-500 line-clamp-1 italic">
                            Fields: {
                              Array.isArray(sup.interests) 
                                ? sup.interests.join(', ') 
                                : (typeof sup.interests === 'string' 
                                    ? sup.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                                    : sup.interests)
                            }
                          </p>
                        )}
                        <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-gray-500">
                          <span>Supervising</span>
                          <span>{sup.groups} Teams ({sup.performance}% efficacy)</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${sup.performance}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-150/50 justify-end">
                        <button
                          onClick={() => onViewSupervisorTeams && onViewSupervisorTeams(sup)}
                          className="text-xs text-indigo-600 font-bold tracking-tight hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HOD Evaluation & Approval Pipeline */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between" id="deliverables-funnel-container">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-xl font-extrabold text-gray-900 font-sans tracking-tight">Approved FYP Pipeline</h2>
              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase mt-1">Status pipeline</div>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-6 font-sans">Active review levels and academic gatekeeping lifecycle across department teams</p>
            
            <div className="space-y-4">
              {funnelMetrics.map((metric, idx) => (
                <div key={`funnel-metric-${idx}`} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{metric.name}</span>
                    <span className="font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{metric.count} teams ({metric.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${metric.percentage || 1}%`, 
                        backgroundColor: metric.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Sub-header list of bottlenecks */}
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider mt-8 mb-3">Attention Required (Lowest Progress)</h3>
            <div className="space-y-3">
              {atRiskProjects.map((p, idx) => (
                <div key={p._id || idx} className="p-3 bg-red-50/40 rounded-2xl border border-red-100 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black uppercase bg-red-150 text-red-700 px-1.5 py-0.5 rounded-full leading-none">
                        Progress Lag
                      </span>
                      <span className="text-[10px] font-bold text-gray-500">{p.progress || 0}% Completion</span>
                    </div>
                  </div>
                  <button
                    onClick={() => nudgeTeam(p._id || idx)}
                    disabled={nudgeStatus[p._id || idx] === 'nudging' || nudgeStatus[p._id || idx] === 'sent'}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider cursor-pointer uppercase transition-all shrink-0 ${
                      nudgeStatus[p._id || idx] === 'sent'
                        ? 'bg-emerald-500 text-white'
                        : nudgeStatus[p._id || idx] === 'nudging'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.03]'
                    }`}
                  >
                    {nudgeStatus[p._id || idx] === 'sent' ? '✓ Sent' : nudgeStatus[p._id || idx] === 'nudging' ? 'Wait' : 'Remind'}
                  </button>
                </div>
              ))}
              {atRiskProjects.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">All departmental teams show stable progress.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Faculty Supervision Matrix & Dynamic Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-none">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Faculty Supervision ledger</h2>
              <p className="text-xs text-gray-400 font-semibold tracking-wide">Interactive matrix to inspect supervisor portfolios and status</p>
            </div>
            
            {/* Real Search Bar inside supervisor matrix */}
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search advisor by name/field..."
                value={supSearch}
                onChange={(e) => setSupSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-gray-100 bg-gray-50/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-150 text-xs w-full font-semibold text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Faculty Advisor</th>
                  <th className="px-6 py-4">Active Groups</th>
                  <th className="px-6 py-4">Load Status</th>
                  <th className="px-6 py-4">Supervision Efficacy</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {searchFilteredSupervisors.map((sup, index) => {
                  const isExpanded = expandedSupId === sup._id;
                  const cap = getCapacityBadge(sup.groups);
                  return (
                    <React.Fragment key={sup._id || `sup-${index}`}>
                      <tr 
                        onClick={() => toggleSupExpand(sup._id)}
                        className={`hover:bg-indigo-50/20 transition-all cursor-pointer group ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm relative shrink-0">
                              {sup.name.split(' ')[1]?.charAt(0) || sup.name.charAt(0)}
                              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                            <div>
                              <span className="font-extrabold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{sup.name}</span>
                              <p className="text-[10px] text-gray-400 font-medium leading-none mt-1 truncate max-w-[150px]">{sup.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-150">
                            {sup.groups} groups
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${cap.color}`}>
                            {cap.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600" style={{ width: `${sup.performance}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-indigo-700">{sup.performance}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => onViewSupervisorTeams && onViewSupervisorTeams(sup)}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Explore assigned research groups"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={(e) => nudgeSupervisor(sup._id, e)}
                              disabled={facultyNudge[sup._id] === 'nudging' || facultyNudge[sup._id] === 'sent'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                                facultyNudge[sup._id] === 'sent'
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : facultyNudge[sup._id] === 'nudging'
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'hover:bg-amber-50 text-amber-600'
                              }`}
                              title="Nudge advisor for progress report"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expandable row content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan="5" className="p-0 border-b border-gray-100">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-gray-50/50 p-6 space-y-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <h5 className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Research Interests & Tagging</h5>
                                    <p className="text-xs text-gray-700 font-bold bg-white border border-gray-150 p-3 rounded-xl shadow-xs italic">
                                      {sup.interests ? (
                                        Array.isArray(sup.interests) 
                                          ? sup.interests.join(', ') 
                                          : (typeof sup.interests === 'string' 
                                              ? sup.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                                              : sup.interests)
                                      ) : "No research interests or specializations tags set yet for this advisor."}
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <h5 className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Quick Actions Portal</h5>
                                    <div className="flex gap-2">
                                      {sup.email && (
                                        <a href={`mailto:${sup.email}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700">
                                          <Mail size={13} /> Mail Advisor
                                        </a>
                                      )}
                                      {sup.phone && (
                                        <a href={`tel:${sup.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700">
                                          <Phone size={13} /> Call Advisor
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h5 className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Supervised Project Teams</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {deptProjects.filter(p => {
                                      const repId = p.supervisor?._id || p.supervisor;
                                      return repId?.toString() === sup._id?.toString() || p.supervisor?.name === sup.name;
                                    }).map((team, idx) => (
                                      <div key={team._id || idx} className="p-3 bg-white border border-gray-150 rounded-xl flex items-center justify-between shadow-xs">
                                        <div className="flex-1 min-w-0 pr-2">
                                          <span className="text-[8px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full leading-none">
                                            {team.teamName || 'Active Team'}
                                          </span>
                                          <p className="text-xs font-bold text-gray-900 mt-1 truncate">{team.title}</p>
                                        </div>
                                        <span className="text-xs font-black text-indigo-700 shrink-0 bg-indigo-50/50 px-2.5 py-1 rounded-lg">
                                          {team.progress || 0}% Progress
                                        </span>
                                      </div>
                                    ))}
                                    {deptProjects.filter(p => {
                                      const repId = p.supervisor?._id || p.supervisor;
                                      return repId?.toString() === sup._id?.toString() || p.supervisor?.name === sup.name;
                                    }).length === 0 && (
                                      <p className="text-xs text-gray-400 italic py-2 mt-1">No research teams currently assigned.</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
                {searchFilteredSupervisors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold italic">
                      No faculty advisors match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-gray-900">Recent Assignments</h2>
              <Link to="/dashboard/hod/assignments" className="text-blue-600 text-xs font-black hover:underline uppercase tracking-wide">View All</Link>
            </div>
            <div className="space-y-4">
              {recentAssignments.map((assignment) => (
                <div key={`assign-${assignment.id}`} className="p-4 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all">
                  <h4 className="font-extrabold text-sm text-gray-900 mb-1 leading-tight line-clamp-1">{assignment.title}</h4>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold">Target: <strong className="text-gray-700">{assignment.target}</strong></span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">{assignment.deadline}</span>
                  </div>
                </div>
              ))}
              {recentAssignments.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-gray-300 italic font-medium text-xs">No assignments published.</span>
                </div>
              )}
            </div>
          </div>
          <Link
            to="/dashboard/hod/assignments"
            className="w-full mt-6 text-center py-3 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-2xl block text-xs font-black text-blue-700 transition-all uppercase tracking-widest inline-flex items-center justify-center gap-1.5 shadow-xs"
          >
            Create a New Assignment <Plus size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const HODDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`/api/dashboard/hod?t=${Date.now()}`);
        setStatsData(data);
      } catch (error) {
        console.error('Error fetching HOD stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchAllProjects = async () => {
      try {
        const { data } = await axios.get(`/api/projects?t=${Date.now()}`);
        setAllProjects(data);
      } catch (err) {
        console.error('Error fetching all department projects:', err);
      }
    };

    const isRoot = location.pathname === '/dashboard/hod' || location.pathname === '/dashboard/hod/';
    fetchStats();
    fetchAllProjects();

    let intervalId;
    if (isRoot) {
      intervalId = setInterval(() => {
        fetchStats();
        fetchAllProjects();
      }, 8000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [location.pathname]);

  const deptPerformance = [
    { name: 'Active', value: statsData?.activeTeams ?? 0, color: '#3B82F6' },
    { name: 'Completed', value: statsData?.completedProjects ?? 0, color: '#10B981' },
    { name: 'Pending Approvals', value: statsData?.pendingApprovals ?? 0, color: '#F59E0B' },
  ];

  const supervisorStats = statsData?.supervisorStats || [];
  const recentAssignments = statsData?.recentAssignments || [];
  const performanceTrend = statsData?.performanceTrend || [
    { name: 'Mon', performance: 0 },
    { name: 'Tue', performance: 0 },
    { name: 'Wed', performance: 0 },
    { name: 'Thu', performance: 0 },
    { name: 'Fri', performance: 0 },
  ];

  const stats = [
    { label: 'Total Projects', value: String(statsData?.totalProjects ?? 0), icon: Briefcase, color: 'blue' },
    { label: 'Active Teams', value: String(statsData?.activeTeams ?? 0), icon: Users, color: 'blue' },
    { label: 'Completed Projects', value: String(statsData?.completedProjects ?? 0), icon: CheckCircle2, color: 'blue' },
    { label: 'Pending Approvals', value: String(statsData?.pendingApprovals ?? 0), icon: FileText, color: 'blue' },
  ];

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="pb-12 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <Routes>
        <Route path="/" element={
          <DashboardOverview 
            stats={stats} 
            statsData={statsData}
            supervisorStats={supervisorStats} 
            deptPerformance={deptPerformance} 
            recentAssignments={recentAssignments} 
            performanceTrend={performanceTrend}
            allProjects={allProjects}
            onViewSupervisorTeams={(sup) => setSelectedSupervisor(sup)}
            onViewProjectDetails={(proj) => setSelectedTeam(proj)}
            onViewDoc={(fileUrl, title) => triggerDirectDownload(fileUrl, title)}
          />
        } />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/projects" element={<ProjectRecords />} />
        <Route path="/teams" element={<TeamManagement />} />
        <Route path="/supervisors" element={<SupervisorManagement />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/submissions" element={<ProjectSubmission />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/plagiarism" element={<PlagiarismChecker />} />
      </Routes>

      {/* Supervisor Monitored Teams Modal */}
      <AnimatePresence>
        {selectedSupervisor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSupervisor(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl relative z-10 max-h-[85vh] flex flex-col overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedSupervisor.name || 'Supervisor'}&apos;s Teams</h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {allProjects.filter(p => {
                        const supIdOfP = p.supervisor?._id || p.supervisor;
                        const targetSupId = selectedSupervisor._id || selectedSupervisor.id;
                        return (supIdOfP && supIdOfP.toString() === targetSupId?.toString()) || p.supervisor?.name === selectedSupervisor.name;
                      }).length || 0} teams currently active
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSupervisor(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Grid */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Supervisor Detail Information */}
                <div className="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Supervisor Profile Information</h4>
                    <p className="text-lg font-bold text-gray-900">{selectedSupervisor.name}</p>
                    {selectedSupervisor.interests && (
                      <p className="text-xs font-semibold text-indigo-600 italic">Interests: {
                        Array.isArray(selectedSupervisor.interests) 
                          ? selectedSupervisor.interests.join(', ') 
                          : (typeof selectedSupervisor.interests === 'string' 
                              ? selectedSupervisor.interests.split(',').map(i => i.trim()).filter(Boolean).join(', ') 
                              : selectedSupervisor.interests)
                      }</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end gap-1.5 text-xs text-gray-700 font-semibold">
                    {selectedSupervisor.email && (
                      <a href={`mailto:${selectedSupervisor.email}`} className="flex items-center gap-2 hover:text-blue-600 transition-colors break-all">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        {selectedSupervisor.email}
                      </a>
                    )}
                    {selectedSupervisor.phone ? (
                      <a href={`tel:${selectedSupervisor.phone}`} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        {selectedSupervisor.phone}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-gray-400 italic">
                        <Phone size={14} className="text-gray-300 flex-shrink-0" />
                        No phone listed
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-50">Supervised Teams</h4>

                {allProjects.filter(p => {
                  const supIdOfP = p.supervisor?._id || p.supervisor;
                  const targetSupId = selectedSupervisor._id || selectedSupervisor.id;
                  return (supIdOfP && supIdOfP.toString() === targetSupId?.toString()) || p.supervisor?.name === selectedSupervisor.name;
                }).length === 0 ? (
                  <div className="text-center py-12 text-gray-400 font-bold italic">
                    No teams are currently assigned to this supervisor.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allProjects.filter(p => {
                      const supIdOfP = p.supervisor?._id || p.supervisor;
                      const targetSupId = selectedSupervisor._id || selectedSupervisor.id;
                      return (supIdOfP && supIdOfP.toString() === targetSupId?.toString()) || p.supervisor?.name === selectedSupervisor.name;
                    }).map((team, idx) => (
                      <div key={team._id || idx} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                              {team.teamName || 'Crew'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              team.status === 'Completed' ? 'bg-green-100 text-green-600' :
                              team.status === 'Active' || team.status === 'Approved' ? 'bg-blue-100 text-blue-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {team.status}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 line-clamp-1">{team.title}</h4>
                            <p className="text-xs text-gray-400 font-medium">TL: {team.teamLeader?.name || 'Unassigned'}</p>
                          </div>
                          {/* Progress slider representation */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                              <span>Progress</span>
                              <span>{team.progress || 0}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${team.progress || 0}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end pt-3 mt-3 border-t border-gray-100/50">
                          <button 
                            onClick={() => setSelectedTeam(team)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            View Details
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Details Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTeam(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl relative z-20 max-h-[90vh] flex flex-col overflow-hidden text-left"
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
                    <p className="text-sm sm:text-base md:text-lg font-black text-gray-800 break-all">{selectedTeam.status}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Current Phase</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-emerald-600 break-words">Completed</p>
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
                            onClick={() => triggerDirectDownload(selectedTeam.fileUrl, `${selectedTeam.title || 'Proposal Document'} (${selectedTeam.teamName || 'FYP Team'})`)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer"
                            title="Download Proposal Document"
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

export default HODDashboard;
