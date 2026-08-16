import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Announcements from '../../components/Announcements';
import PlagiarismChecker from '../../components/PlagiarismChecker';
import Feedback from '../../components/Feedback';
import Notifications from '../../components/Notifications';
import TeamMembersList from '../../components/TeamMembersList';
import TaskManagement from '../../components/TaskManagement';
import AssignedTasks from '../../components/AssignedTasks';
import ProjectSubmission from '../../components/ProjectSubmission';
import Assignments from '../../components/Assignments';
import { 
  Users, 
  CheckSquare, 
  FileText, 
  Edit2,
  Trash2,
  TrendingUp
} from 'lucide-react';
import MyTeamPage from '../../components/MyTeamPage';

const DashboardOverview = ({ stats, teamPerformance, teamMembers, taskDistribution, submissions = [] }) => (
    <div className="space-y-8 w-full max-w-none">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-none">
        {stats.map((stat, index) => (
          <motion.div
            key={`stat-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-none">
        {/* Team Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Team Progress Over Time</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              Steady Growth
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={teamPerformance}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="progress" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Task Distribution</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {taskDistribution.map((item, index) => (
              <div key={`task-dist-${index}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Submissions Status */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between w-full" id="real-time-submissions-section">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Real-Time Submissions</h2>
            <span className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold">
              {submissions.length} Total
            </span>
          </div>
          {submissions && submissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {submissions.slice(0, 4).map((sub, index) => {
                let statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                if (sub.status === 'Approved') {
                  statusColor = 'bg-green-50 text-green-700 border-green-200';
                } else if (sub.status === 'Rejected') {
                  statusColor = 'bg-red-50 text-red-700 border-red-200';
                }
                
                return (
                  <div key={`sub-${sub._id || index}`} className="flex flex-col justify-between p-4 rounded-xl hover:bg-gray-50/50 transition-all border border-gray-100 bg-white shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-gray-900 truncate" title={sub.title}>{sub.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Phase: <span className="font-semibold text-gray-700">{sub.phase}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-[10px]">
                      <span className="text-gray-400 truncate max-w-[120px]" title={sub.submittedBy?.name}>
                        By: {sub.submittedBy?.name || 'Team Member'}
                      </span>
                      <span className={`font-bold uppercase px-2 py-0.5 rounded border text-[9px] ${statusColor}`}>
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
            <div className="py-8 text-center text-gray-400 space-y-3">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <p className="text-xs italic">No project documents have been submitted yet.</p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <Link 
            to="/dashboard/team-leader/submissions" 
            className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
          >
            Manage & Review Submissions
          </Link>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
          <Link to="/dashboard/team-leader/team" className="text-blue-600 text-sm font-bold hover:underline">View My Team</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Tasks</th>
                <th className="px-6 py-4">Progress & Performance</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamMembers.map((member, index) => {
                const totalTasks = member.tasks || 0;
                const completedTasks = member.completed || 0;
                const pendingTasks = totalTasks - completedTasks;
                const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                
                // Real-time progress status badge tag
                let progressBadge = { text: 'Standby', className: 'bg-gray-150 text-gray-600 border-gray-200' };
                if (totalTasks > 0) {
                  if (progressPct === 100) {
                    progressBadge = { text: 'All Done 🎉', className: 'bg-green-100 text-green-800 border-green-200' };
                  } else if (progressPct >= 75) {
                    progressBadge = { text: 'Close to finish 🚀', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                  } else if (progressPct >= 30) {
                    progressBadge = { text: 'Active / On Track 📈', className: 'bg-blue-100 text-blue-800 border-blue-200' };
                  } else if (progressPct > 0) {
                    progressBadge = { text: 'Getting Started 🌱', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
                  } else {
                    progressBadge = { text: 'Not Started Yet ⏳', className: 'bg-amber-100 text-amber-800 border-amber-200' };
                  }
                }

                return (
                  <tr key={`member-${member.id}-${index}`} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                          {member.name ? member.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{member.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">ID: FYP-2024-{member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{member.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      {totalTasks > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-sm font-black text-gray-900">
                            <span>{completedTasks}</span>
                            <span className="text-gray-400">/</span>
                            <span>{totalTasks}</span>
                            <span className="text-xs text-gray-400 font-normal">completed</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-green-50 text-green-700 font-bold border border-green-100">
                              Done: {completedTasks}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-150">
                              Pending: {pendingTasks}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No tasks assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 max-w-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">{progressPct}%</span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${progressBadge.className}`}>
                            {progressBadge.text}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                        member.status === 'Active' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'
                        }`}></div>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

const TeamLeaderDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`/api/dashboard/team?t=${Date.now()}`);
        setStatsData(data);
      } catch (error) {
        console.error('Error fetching team leader stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();

    const isRoot = location.pathname === '/dashboard/team-leader' || location.pathname === '/dashboard/team-leader/';
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

  const teamPerformance = statsData?.teamPerformance || [
    { name: 'Week 1', progress: 0 },
    { name: 'Week 2', progress: 0 },
    { name: 'Week 3', progress: 0 },
    { name: 'Week 4', progress: 0 },
    { name: 'Week 5', progress: 0 },
  ];

  const teamMembers = statsData?.teamMembers || [];
  const taskDistribution = [
    { name: 'Completed', value: statsData?.completedTasks ?? 0, color: '#10B981' },
    { name: 'Pending', value: (statsData?.totalTasks ?? 0) - (statsData?.completedTasks ?? 0), color: '#3B82F6' },
  ];

  const stats = [
    { label: 'Team Members', value: String(statsData?.teamMembersCount ?? 0), icon: Users, color: 'blue' },
    { label: 'Total Tasks', value: String(statsData?.totalTasks ?? 0), icon: CheckSquare, color: 'blue' },
    { label: 'Completed Tasks', value: String(statsData?.completedTasks ?? 0), icon: CheckSquare, color: 'blue' },
    { label: 'Submissions', value: String(statsData?.submissions?.length ?? 0), icon: FileText, color: 'blue' },
  ];

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  
  return (
    <div className="pb-12 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <h2 className="text-2xl font-bold mt-4 mb-8 px-6 py-4 bg-gray-50 border border-gray-205 rounded-2xl shadow-sm text-gray-850">
        Project: <span className="text-blue-600 font-black">{statsData?.projectTitle}</span>
      </h2>
      <Routes>
        <Route path="/" element={<DashboardOverview stats={stats} teamPerformance={teamPerformance} teamMembers={teamMembers} taskDistribution={taskDistribution} submissions={statsData?.submissions || []} />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/team" element={<MyTeamPage />} />
        <Route path="/members" element={<TeamMembersList />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/assigned-tasks" element={<AssignedTasks />} />
        <Route path="/submissions" element={<ProjectSubmission />} />
        <Route path="/plagiarism" element={<PlagiarismChecker />} />
      </Routes>
    </div>
  );
};

export default TeamLeaderDashboard;
