import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
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
import Announcements from '../../components/Announcements';
import AnnouncementFeed from '../../components/AnnouncementFeed';
import UserManagement from '../../components/UserManagement';
import PlagiarismChecker from '../../components/PlagiarismChecker';
import DepartmentManagement from '../../components/DepartmentManagement';
import SystemLogs from '../../components/SystemLogs';
import ProjectRecords from '../../components/ProjectRecords';
import Notifications from '../../components/Notifications';
import Assignments from '../../components/Assignments';
import ProjectSubmission from '../../components/ProjectSubmission';
import { 
  Users, 
  GraduationCap, 
  Activity, 
  FileText, 
  ChevronRight,
  Bell,
  CheckCircle2,
  Folder,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const DashboardOverview = ({ stats, recentProjects, departmentOverview, recentAssignments, recentActivity, chartData }) => (
    <div className="space-y-8 w-full max-w-none">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-none">
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

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-none">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Project Submissions Growth</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <TrendingUp size={14} />
              +12% this month
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="projects" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">System Distribution</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {chartData.distribution.map((item, index) => (
              <div key={`dist-${index}`} className="flex items-center justify-between text-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-none">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Projects</h2>
            <Link to="/dashboard/admin/projects" className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1 group/link">
              View All 
              <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={`project-${project._id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm`}>
                    <Folder size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h4>
                    <p className="text-xs text-gray-500">{project.dept} • {project.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-600' :
                    project.status === 'Review' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {project.status}
                  </span>
                  <Link 
                    to="/dashboard/admin/projects"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Overview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Department Overview</h2>
          <div className="space-y-4">
            {departmentOverview.map((dept, index) => (
              <div key={`dept-${index}`} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-800">{dept.name}</span>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">{dept.projects} projects</p>
                  <p className="text-[10px] text-gray-500">{dept.teams} teams</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assignments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-none">
        <div className="lg:col-span-2">
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Recent Assignments</h2>
              <Link to="/dashboard/admin/assignments" className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline shrink-0">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentAssignments.map((assignment) => (
                <div key={`assign-${assignment.id}`} className="flex items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-50 rounded-2xl hover:bg-white hover:border-blue-150 transition-all shadow-sm min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight break-words">{assignment.title}</h4>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold mt-1 uppercase">Due: {assignment.deadline}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest shrink-0">
                    {assignment.status}
                  </span>
                </div>
              ))}
              {recentAssignments.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400 text-sm italic">
                  No active assignments found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <AnnouncementFeed />
        </div>
      </div>

    </div>
);

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const { data } = await axios.get(`/api/dashboard/admin?t=${Date.now()}`);
        setStatsData(data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err.response?.data?.message || 'Failed to connect to the backend server. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    const isRoot = location.pathname === '/dashboard/admin' || location.pathname === '/dashboard/admin/';
    fetchStats();

    let intervalId;
    if (isRoot) {
      intervalId = setInterval(() => {
        fetchStats();
      }, 8000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [location.pathname]);

  const stats = [
    { label: 'Total Departments', value: String(statsData?.totalDepts ?? 0), icon: GraduationCap, color: 'blue' },
    { label: 'Total Projects', value: String(statsData?.totalProjects ?? 0), icon: Folder, color: 'blue' },
    { label: 'Approved Projects', value: String(statsData?.approvedProjects ?? 0), icon: CheckCircle2, color: 'blue' },
    { label: 'Total Users', value: String(statsData?.totalUsers ?? 0), icon: Users, color: 'blue' },
  ];

  const recentProjects = statsData?.recentProjects || [];
  const departmentOverview = statsData?.departmentOverview || [];
  const recentActivity = statsData?.recentActivity || [];
  const recentAssignments = statsData?.recentAssignments || [];

  const chartData = {
    growth: statsData?.growthAnalytics || [
      { month: 'Jan', projects: 0 },
      { month: 'Feb', projects: 0 },
      { month: 'Mar', projects: 0 },
      { month: 'Apr', projects: 0 },
    ],
    distribution: [
      { name: 'Projects', value: statsData?.totalProjects ?? 0, color: '#3B82F6' },
      { name: 'Users', value: statsData?.totalUsers ?? 0, color: '#10B981' },
      { name: 'Departments', value: statsData?.totalDepts ?? 0, color: '#F59E0B' },
    ]
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Activity className="animate-pulse text-blue-600" size={48} />
      <p className="text-gray-500 font-bold">Synchronizing System Data...</p>
    </div>
  );

  return (
    <div className="pb-12 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <div className="flex items-center justify-between mb-8 w-full">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Global system overview and management</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-bold animate-in slide-in-from-top-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Routes>
        <Route path="/" element={
          <DashboardOverview 
            stats={stats} 
            recentProjects={recentProjects}
            departmentOverview={departmentOverview}
            recentAssignments={recentAssignments}
            recentActivity={recentActivity}
            chartData={chartData}
          />
        } />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/departments" element={<DepartmentManagement />} />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/projects" element={<ProjectRecords />} />
        <Route path="/submissions" element={<ProjectSubmission />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/plagiarism" element={<PlagiarismChecker />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
