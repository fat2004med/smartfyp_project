import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Feedback from '../../components/Feedback';
import Notifications from '../../components/Notifications';
import AssignedTasks from '../../components/AssignedTasks';
import ProjectSubmission from '../../components/ProjectSubmission';
import Assignments from '../../components/Assignments';
import Announcements from '../../components/Announcements';
import AnnouncementFeed from '../../components/AnnouncementFeed';
import MyTeamPage from '../../components/MyTeamPage';
import PlagiarismChecker from '../../components/PlagiarismChecker';
import { 
  CheckSquare, 
  Clock, 
  FileText, 
  TrendingUp, 
  ChevronRight,
  Loader2,
  User,
  Users,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
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

const DashboardOverview = ({ stats, weeklyProgress, taskData, pendingAssignments, recentFeedbacks, recentTasks, deadlineProximity, submissions = [] }) => {
  const lessThan2d = deadlineProximity?.lessThan2d ?? 0;
  const between2And5d = deadlineProximity?.between2And5d ?? 0;
  const oneWeekPlus = deadlineProximity?.oneWeekPlus ?? 0;
  const totalActive = deadlineProximity?.totalActive ?? 0;

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={`tm-stat-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-3xl border-2 border-blue-100 bg-white transition-all hover:shadow-2xl hover:-translate-y-2 group relative overflow-hidden active:scale-95"
            id={`stat-card-${idx}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:opacity-10" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 transition-all transform group-hover:rotate-12 group-hover:scale-110">
                <stat.icon size={32} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-6xl font-black tracking-tighter text-blue-900 group-hover:text-blue-600 transition-colors drop-shadow-sm">
                  {stat.value}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Section - Progress Over Time */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <TrendingUp size={120} className="text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Personal Productivity Trend</h2>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Workload completion velocity across recent cycles</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <TrendingUp size={14} />
                +14.2% Increase
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                      padding: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorTasks)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Task Distribution Pictorial */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Goal Distribution</h2>
          <p className="text-xs text-gray-400 font-medium mb-8">Completed vs. Pending workload</p>
          
          <div className="h-60 w-full relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-black text-gray-900">
                  {Math.round((stats.find(s => s.label === 'Completed')?.value / stats.find(s => s.label === 'Total Tasks')?.value) * 100 || 0)}%
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Done</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {taskData.map((entry, idx) => (
                    <Cell key={`tm-pie-cell-${idx}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {taskData.map((item, idx) => (
              <div key={`tm-task-legend-${idx}`} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{item.value} Tasks</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-none">
        {/* Main Feed & Assignments (BIG CONTENT - 2/3) */}
        <div className="lg:col-span-2 space-y-8">
           {/* Deadline Proximity Analytics - MOVED HERE */}
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertCircle size={100} className="text-red-600" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Deadline Proximity</h2>
                  <p className="text-xs text-gray-400 font-medium">Tasks categorized by remaining time</p>
                  {totalActive > 0 ? (
                    <>
                      {lessThan2d > 0 ? (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl max-w-md animate-fade-in">
                          <p className="text-[10px] text-red-800 font-bold uppercase tracking-widest mb-1 italic">Action Recommended</p>
                          <p className="text-xs text-red-700 leading-tight font-medium">
                            You have {lessThan2d} task{lessThan2d > 1 ? 's' : ''} with high urgency (&lt; 48h). Prioritize these for immediate submission.
                          </p>
                        </div>
                      ) : between2And5d > 0 ? (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl max-w-md animate-fade-in">
                          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest mb-1 italic">Upcoming Deadlines</p>
                          <p className="text-xs text-amber-700 leading-tight font-medium">
                            You have {between2And5d} task{between2And5d > 1 ? 's' : ''} due within 2-5 days. Check task details.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl max-w-md animate-fade-in">
                          <p className="text-[10px] text-green-800 font-bold uppercase tracking-widest mb-1">On Track</p>
                          <p className="text-xs text-green-700 leading-tight font-medium">
                            All your active tasks have comfortable deadlines ({oneWeekPlus} task{oneWeekPlus > 1 ? 's' : ''} with 1w+ remaining).
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl max-w-md">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 italic">No Deadlines</p>
                      <p className="text-xs text-gray-500 leading-tight font-medium">
                        No tasks currently assigned, so there are no deadlines to display.
                      </p>
                    </div>
                  )}
                </div>
                {totalActive > 0 ? (
                  <div className="h-32 w-full md:w-64">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={[
                         { range: '< 2d', count: lessThan2d },
                         { range: '2-5d', count: between2And5d },
                         { range: '1w+', count: oneWeekPlus }
                       ]}>
                         <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} />
                         <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                         <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                       </BarChart>
                     </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 w-full md:w-64 h-32">
                    <CheckSquare size={28} className="text-gray-300 mb-2" />
                    <span className="text-xs font-bold text-gray-400">All caught up!</span>
                  </div>
                )}
              </div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="text-blue-600" size={120} />
             </div>
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-8">
                 <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pending Assignments</h2>
                   <p className="text-sm text-gray-400 font-medium mt-1">Foundational requirements for your current phase</p>
                 </div>
                 <Link to="/dashboard/team-member/assignments" className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                   View Full List
                 </Link>
               </div>
               
               <div className="grid grid-cols-1 gap-5">
                 {pendingAssignments && pendingAssignments.length > 0 ? (
                   pendingAssignments.map((assignment, index) => (
                    <div key={`assignment-${assignment.id || index}-${index}`} className="group/item p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all animate-in fade-in zoom-in duration-300">
                           <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover/item:text-blue-700 transition-colors">{assignment.title}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                              <Clock size={12} />
                              Due: {assignment.deadline}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <User size={12} />
                              From: {assignment.from}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        to="/dashboard/team-member/assignments"
                        className="p-3 bg-white rounded-xl transform translate-x-4 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 transition-all text-blue-600 shadow-md border border-gray-50"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  ))
                 ) : (
                  <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <FileText className="text-gray-200" size={32} />
                    </div>
                    <p className="text-lg font-bold text-gray-400">All caught up!</p>
                    <p className="text-sm text-gray-300 mt-1">No pending assignments for your role at this time.</p>
                  </div>
                 )}
               </div>
             </div>
           </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Recently Assigned Tasks</h2>
                <Link to="/dashboard/team-member/assigned-tasks" className="text-blue-600 text-sm font-bold hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {recentTasks && recentTasks.length > 0 ? (
                  recentTasks.map((task, idx) => (
                    <div key={`tm-recent-task-${task.id || idx}`} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between group/task hover:bg-white hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                            task.priority === 'High' ? 'bg-red-100 text-red-600' : 
                            task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                        }`}>
                          <CheckSquare size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{task.title}</h4>
                          <p className="text-[10px] text-gray-500 font-medium">Deadline: {task.deadline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {task.status}
                        </span>
                        <ChevronRight size={16} className="text-gray-300 group-hover/task:text-blue-600" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-sm text-gray-400 italic">No recent tasks</p>
                )}
              </div>
           </div>

           {/* Project Submissions & Deliverables */}
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                   <FileText size={20} />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-gray-900">My Submissions & Deliverables</h2>
                   <p className="text-xs text-gray-400 font-medium">Submissions & deliverables created by you</p>
                 </div>
               </div>
               <Link 
                 to="/dashboard/team-member/submissions" 
                 className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
               >
                 View Submissions
               </Link>
             </div>
             
             {submissions && submissions.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {submissions.map((sub, index) => {
                   let statusColor = "bg-gray-100 text-gray-700 border-gray-200";
                   if (sub.status === 'Approved') statusColor = "bg-green-100 text-green-700 border-green-200";
                   else if (sub.status === 'Rejected') statusColor = "bg-red-100 text-red-700 border-red-200";
                   else if (sub.status?.startsWith('Pending')) statusColor = "bg-amber-100 text-amber-700 border-amber-200";

                   return (
                     <div key={`tm-sub-${sub._id || index}`} className="flex flex-col justify-between p-4 rounded-2xl hover:bg-gray-50/50 transition-all border border-gray-100 bg-white shadow-sm hover:shadow-md">
                       <div className="flex items-start gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                           <FileText size={20} />
                         </div>
                         <div className="min-w-0 flex-1">
                           <h4 className="font-bold text-sm text-gray-900 truncate" title={sub.title}>{sub.title}</h4>
                           <p className="text-xs text-gray-500 mt-1">
                             Phase: <span className="font-semibold text-gray-700">{sub.phase}</span> • Sem {sub.semester || 7}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-[10px]">
                         <span className="text-gray-400 truncate max-w-[140px]" title={sub.submittedBy?.name}>
                           Created by: <span className="font-bold text-gray-600">{sub.submittedBy?.name || 'You'}</span>
                         </span>
                         <span className={`font-bold uppercase px-2.5 py-0.5 rounded-lg border text-[9px] ${statusColor}`}>
                           {sub.status === 'Pending TL' ? 'Pending TL' :
                            sub.status === 'Pending Supervisor' ? 'Under Supervisor' :
                            sub.status === 'Pending HOD' ? 'Under HOD' :
                            sub.status === 'Pending Admin' ? 'Under Admin' : sub.status}
                         </span>
                       </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="py-8 text-center text-gray-400 space-y-3 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                 <div className="w-12 h-12 bg-white border border-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                   <FileText size={24} />
                 </div>
                 <p className="text-xs italic text-gray-500">No submissions created by you yet.</p>
               </div>
             )}
             <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
               <Link 
                 to="/dashboard/team-member/submissions" 
                 className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
               >
                 Go to Project Submissions Page
               </Link>
             </div>
           </div>
        </div>

        {/* Sidebar Components (SMALL CONTENT - 1/3) */}
        <div className="space-y-8">
           <div className="sticky top-24 space-y-8">
             <AnnouncementFeed />
             
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Feedback</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Supervisor Correspondence</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {recentFeedbacks && recentFeedbacks.length > 0 ? (
                    recentFeedbacks.map((item, idx) => (
                      <div key={`tm-feedback-${idx}`} className="flex gap-4 group cursor-default">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <User size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="font-bold text-sm text-gray-900 truncate">{item.from}</h4>
                            <span className="text-[9px] font-black text-gray-300 uppercase shrink-0">{item.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50 group-hover:border-blue-100 transition-all">
                            &quot;{item.msg}&quot;
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                      <p className="text-sm text-gray-300 italic">No feedback received yet</p>
                    </div>
                  )}
                </div>
                
                <Link to="/dashboard/team-member/feedback" className="w-full mt-8 py-4 border border-blue-50 bg-blue-50/30 hover:bg-blue-600 hover:text-white rounded-2xl text-center block text-xs font-bold text-blue-600 transition-all shadow-sm whitespace-nowrap">
                   View All Feedback History
                </Link>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const TeamMemberDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`/api/dashboard/team?t=${Date.now()}`);
        setStatsData(data);
      } catch (error) {
        console.error('Error fetching team member stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();

    const isRoot = location.pathname === '/dashboard/team-member' || location.pathname === '/dashboard/team-member/';
    let intervalId;
    if (isRoot) {
      intervalId = setInterval(fetchStats, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [location.pathname]);

  const taskData = [
    { name: 'Completed', value: statsData?.completedTasks || 0, color: '#10B981' },
    { name: 'Pending', value: (statsData?.totalTasks || 0) - (statsData?.completedTasks || 0), color: '#3B82F6' },
  ];

  const weeklyProgress = statsData?.teamPerformance || [
    { day: 'W1', tasks: 0 },
    { day: 'W2', tasks: 0 },
    { day: 'W3', tasks: 0 },
    { day: 'W4', tasks: 0 },
    { day: 'W5', tasks: 0 },
  ];

  const stats = [
    { label: 'Total Tasks', value: String(statsData?.totalTasks ?? 0), icon: CheckSquare, color: 'blue' },
    { label: 'Completed', value: String(statsData?.completedTasks ?? 0), icon: TrendingUp, color: 'green' },
    { label: 'Submissions', value: String(statsData?.submissions?.length ?? 0), icon: FileText, color: 'amber' },
    { label: 'Team Members', value: String(statsData?.teamMembersCount ?? 0), icon: Users, color: 'indigo' },
  ];

  const pendingAssignments = statsData?.pendingAssignments || [];
  const recentFeedbacks = statsData?.recentFeedbacks || [];
  const recentTasks = statsData?.recentTasks || [];

  if (loading) return <div className="p-8 text-center flex flex-col items-center gap-4">
    <Loader2 className="animate-spin text-blue-600" size={32} />
    <span className="text-gray-500 font-medium">Loading your dashboard...</span>
  </div>;
  
  return (
    <div className="pb-12 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <h2 className="text-2xl font-bold mt-4 mb-8 px-6 py-4 bg-gray-50 border border-gray-205 rounded-2xl shadow-sm text-gray-850">
        Project: <span className="text-blue-600 font-black">{statsData?.projectTitle}</span>
      </h2>
      <Routes>
        <Route path="/" element={
          <DashboardOverview 
            stats={stats} 
            weeklyProgress={weeklyProgress} 
            taskData={taskData} 
            pendingAssignments={pendingAssignments} 
            recentFeedbacks={recentFeedbacks} 
            recentTasks={recentTasks}
            deadlineProximity={statsData?.deadlineProximity}
            submissions={statsData?.submissions || []}
          />
        } />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/team" element={<MyTeamPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/assigned-tasks" element={<AssignedTasks />} />
        <Route path="/submissions" element={<ProjectSubmission />} />
        <Route path="/plagiarism" element={<PlagiarismChecker />} />
      </Routes>
    </div>
  );
};

export default TeamMemberDashboard;
