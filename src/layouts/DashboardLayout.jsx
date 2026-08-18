import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  GraduationCap,
  Activity,
  LayoutDashboard, 
  Users, 
  Building2,
  CheckSquare, 
  FileText, 
  MessageSquare, 
  Bell, 
  Megaphone,
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  User,
  Shield,
  ShieldCheck,
  Upload,
  UserCircle,
  Lock,
  Mail,
  Check
} from 'lucide-react';
import ProfileModal from '../components/ProfileModal';
import SecurityModal from '../components/SecurityModal';

const DashboardLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  
  const profileRef = useRef(null);
  
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, activePopups, dismissPopup } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const activeRole = (() => {
    const roles = user?.role ? user.role.split(',').map(r => r.trim()) : [];
    if (roles.length > 1) {
      const matchedRole = roles.find(role => {
        const pathPart = role.toLowerCase().replace(/\s+/g, '-');
        return location.pathname.includes(`/dashboard/${pathPart}`);
      });
      if (matchedRole) return matchedRole;

      const saved = localStorage.getItem('activeDashboardRole');
      if (saved && roles.includes(saved)) return saved;

      return roles[0];
    }
    return user?.role || '';
  })();

  const activeRolePath = activeRole ? activeRole.toLowerCase().replace(/\s+/g, '-') : '';

  useEffect(() => {
    if (activeRole) {
      axios.defaults.headers.common['X-Selected-Role'] = activeRole;
      axios.defaults.headers.common['X-Active-Role'] = activeRole;
      localStorage.setItem('activeDashboardRole', activeRole);
      window.dispatchEvent(new CustomEvent('roleChanged', { detail: activeRole }));
    } else {
      delete axios.defaults.headers.common['X-Selected-Role'];
      delete axios.defaults.headers.common['X-Active-Role'];
    }
  }, [activeRole]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      setIsMobile(mobile);
      
      // Auto-open sidebar on desktop, mini on tablet, close on mobile
      if (width >= 1024) {
        setIsSidebarOpen(true);
      } else if (tablet) {
        setIsSidebarOpen(false); // Mini mode for tablet
      } else {
        setIsSidebarOpen(false); // Closed for mobile
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setTimeout(() => setIsSidebarOpen(false), 0);
    }
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    'Team Member': [
      { icon: Activity, label: 'Overview', path: '/dashboard/team-member' },
      { icon: Users, label: 'My Team', path: '/dashboard/team-member/team' },
      { icon: Megaphone, label: 'Announcements', path: '/dashboard/team-member/announcements' },
      { icon: FileText, label: 'Assignments', path: '/dashboard/team-member/assignments' },
      { icon: CheckSquare, label: 'Assigned Tasks', path: '/dashboard/team-member/assigned-tasks' },
      { icon: Upload, label: 'Project Submission', path: '/dashboard/team-member/submissions' },
      { icon: ShieldCheck, label: 'Plagiarism Checker', path: '/dashboard/team-member/plagiarism' },
      { icon: MessageSquare, label: 'Feedback', path: '/dashboard/team-member/feedback' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/team-member/notifications' },
    ],
    'Team Leader': [
      { icon: Activity, label: 'Overview', path: '/dashboard/team-leader' },
      { icon: Users, label: 'My Team', path: '/dashboard/team-leader/team' },
      { icon: FileText, label: 'Assignments', path: '/dashboard/team-leader/assignments' },
      { icon: CheckSquare, label: 'Task Management', path: '/dashboard/team-leader/tasks' },
      { icon: CheckSquare, label: 'Assigned Tasks', path: '/dashboard/team-leader/assigned-tasks' },
      { icon: Upload, label: 'Project Submission', path: '/dashboard/team-leader/submissions' },
      { icon: ShieldCheck, label: 'Plagiarism Checker', path: '/dashboard/team-leader/plagiarism' },
      { icon: Megaphone, label: 'Announcements', path: '/dashboard/team-leader/announcements' },
      { icon: MessageSquare, label: 'Feedback', path: '/dashboard/team-leader/feedback' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/team-leader/notifications' },
    ],
    'Supervisor': [
      { icon: Activity, label: 'Overview', path: '/dashboard/supervisor' },
      { icon: FileText, label: 'Assignments', path: '/dashboard/supervisor/assignments' },
      { icon: Users, label: 'Teams', path: '/dashboard/supervisor/teams' },
      { icon: CheckSquare, label: 'Task Management', path: '/dashboard/supervisor/tasks' },
      { icon: FileText, label: 'Project Records', path: '/dashboard/supervisor/projects' },
      { icon: Upload, label: 'Project Submissions', path: '/dashboard/supervisor/submissions' },
      { icon: ShieldCheck, label: 'Plagiarism Checker', path: '/dashboard/supervisor/plagiarism' },
      { icon: Megaphone, label: 'Announcements', path: '/dashboard/supervisor/announcements' },
      { icon: MessageSquare, label: 'Feedback', path: '/dashboard/supervisor/feedback' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/supervisor/notifications' },
    ],
    'HOD': [
      { icon: Activity, label: 'Department Overview', path: '/dashboard/hod' },
      { icon: FileText, label: 'Assignments', path: '/dashboard/hod/assignments' },
      { icon: Users, label: 'User Management', path: '/dashboard/hod/users' },
      { icon: Users, label: 'Team Management', path: '/dashboard/hod/teams' },
      { icon: ShieldCheck, label: 'Supervisor Management', path: '/dashboard/hod/supervisors' },
      { icon: FileText, label: 'Project Records', path: '/dashboard/hod/projects' },
      { icon: Upload, label: 'Submissions & Approvals', path: '/dashboard/hod/submissions' },
      { icon: ShieldCheck, label: 'Plagiarism Checker', path: '/dashboard/hod/plagiarism' },
      { icon: MessageSquare, label: 'Feedback', path: '/dashboard/hod/feedback' },
      { icon: Megaphone, label: 'Announcements', path: '/dashboard/hod/announcements' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/hod/notifications' },
    ],
    'Admin': [
      { icon: Activity, label: 'Overview', path: '/dashboard/admin' },
      { icon: FileText, label: 'Assignments', path: '/dashboard/admin/assignments' },
      { icon: Upload, label: 'Submission Approvals', path: '/dashboard/admin/submissions' },
      { icon: ShieldCheck, label: 'Plagiarism Checker', path: '/dashboard/admin/plagiarism' },
      { icon: Users, label: 'User Management', path: '/dashboard/admin/users' },
      { icon: Building2, label: 'Departments', path: '/dashboard/admin/departments' },
      { icon: FileText, label: 'Project Records', path: '/dashboard/admin/projects' },
      { icon: Megaphone, label: 'Announcements', path: '/dashboard/admin/announcements' },
      { icon: Shield, label: 'System Logs', path: '/dashboard/admin/logs' },
      { icon: Bell, label: 'Notifications', path: '/dashboard/admin/notifications' },
    ]
  };

  const currentRoleItems = menuItems[activeRole] || [];

  const roleInfo = {
    'Admin': {
      title: 'Admin Panel',
      description: 'Global system overview and hierarchical management.'
    },
    'Supervisor': {
      title: 'Supervisor Dashboard',
      description: 'Monitor your assigned project groups and review their submissions.'
    },
    'Team Member': {
      title: 'Team Member Dashboard',
      description: "Welcome back! Here's what's happening with your project."
    },
    'Team Leader': {
      title: 'Team Leader Dashboard',
      description: 'Manage your team, assign tasks, and track project milestones.'
    },
    'HOD': {
      title: 'HOD Dashboard',
      description: `Department of ${
        user?.department?.name || 
        (typeof user?.department === 'string' && user.department.length !== 24 ? user.department : 'Information Technology')
      } - Overview & Management`
    }
  };

  const currentRoleInfo = roleInfo[activeRole] || {
    title: 'Dashboard',
    description: `Welcome back, ${user?.name}`
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (isMobile ? 280 : 256) : (isMobile ? 0 : 80),
          x: isSidebarOpen ? 0 : (isMobile ? -280 : 0)
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`bg-white border-r border-gray-200 z-[70] h-full shadow-2xl md:shadow-none overflow-hidden ${
          isMobile ? 'fixed inset-y-0 left-0' : 'relative'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header: Logo & Toggle */}
          <div className={`p-5 flex flex-col gap-4 ${isSidebarOpen ? 'items-stretch' : 'items-center'}`}>
            {!isSidebarOpen ? (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
                title="Expand Sidebar"
              >
                <Menu size={20} />
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                    <GraduationCap className="text-white" size={20} />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-gray-900 whitespace-nowrap">SmartFYP</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
                  title="Collapse Sidebar"
                >
                  {isMobile ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
            {currentRoleItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all group relative overflow-hidden ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200/50'
                    : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-md hover:translate-x-1'
                }`}
              >
                {/* Visual Accent for Hover */}
                {! (location.pathname === item.path) && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                )}

                <item.icon size={20} className={`transition-transform duration-300 ${location.pathname === item.path ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`} />
                {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                
                {isSidebarOpen && location.pathname === item.path && (
                  <motion.div layoutId="active" className="ml-auto flex items-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <ChevronRight size={14} />
                  </motion.div>
                )}
                {/* Active Indicator Bar */}
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="activeSide"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            {isSidebarOpen && (
              <div className="mb-3 p-2 bg-white rounded-xl flex items-center gap-3 border border-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{activeRole}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm font-bold ${
                !isSidebarOpen && 'justify-center'
              }`}
            >
              <LogOut size={18} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle Only */}
            {isMobile && !isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
              >
                <Menu size={22} />
              </button>
            )}

            {/* Dashboard Title & Description */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {currentRoleInfo.title}
              </h1>
              <p className="text-xs text-gray-500">
                {currentRoleInfo.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-3 rounded-xl relative transition-all shadow-sm border ${
                  isNotificationsOpen 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border-gray-100'
                }`}
                title="Notifications"
              >
                <Bell size={22} className={unreadCount > 0 && !isNotificationsOpen ? 'animate-bell-ring' : ''} />
                {unreadCount > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300 ${
                    isNotificationsOpen ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {/* Interactive background pulse */}
                    <span className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                      isNotificationsOpen ? 'bg-amber-400' : 'bg-red-400'
                    }`} style={{ animationDuration: '2s' }} />
                    <span className="relative z-10">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <Link 
                        to={`/dashboard/${activeRolePath}/notifications`}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {notifications.slice(0, 5).map((n) => (
                            <div 
                              key={n._id} 
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                              onClick={() => {
                                if (!n.isRead) markAsRead(n._id);
                                navigate(`/dashboard/${activeRolePath}/notifications?id=${n._id}`);
                                setIsNotificationsOpen(false);
                              }}
                            >
                              {!n.isRead && (
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-full" />
                              )}
                              <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                  n.type === 'Announcement' ? 'bg-amber-100 text-amber-600' :
                                  n.type === 'Task' ? 'bg-blue-100 text-blue-600' :
                                  'bg-indigo-100 text-indigo-600'
                                }`}>
                                  {n.type === 'Announcement' ? <Megaphone size={18} /> : 
                                   n.type === 'Task' ? <CheckSquare size={18} /> : 
                                   <Bell size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold text-gray-900 truncate ${!n.isRead ? 'pr-2' : ''}`}>{n.title}</p>
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Recently</p>
                                    {!n.isRead && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(n._id);
                                        }}
                                        className="px-2 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded text-[10px] font-bold uppercase transition-all border border-blue-100 flex items-center gap-0.5"
                                      >
                                        <Check size={10} />
                                        Mark Read
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                          <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                          <p className="text-sm font-bold text-gray-400">No new notifications</p>
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <Link 
                        to={`/dashboard/${activeRolePath}/notifications`}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block p-4 text-center text-xs font-bold text-gray-500 hover:text-blue-600 bg-gray-50 transition-colors"
                      >
                        See more activities
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="flex items-center gap-3 pl-2 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user?.name || 'User'}</p>
                  <p className="text-xs text-blue-600 font-medium">{activeRole}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name?.charAt(0) || <User size={20} />
                  )}
                </div>
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    {/* Profile Header */}
                    <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/30 overflow-hidden">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user?.name?.charAt(0) || <User size={24} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-lg truncate">{user?.name || 'User'}</h4>
                          <p className="text-blue-100 text-sm flex items-center gap-1 min-w-0" title={user?.email}>
                            <Mail size={14} className="flex-shrink-0" />
                            <span className="truncate">{user?.email || 'user@example.com'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 w-fit">
                        <Shield size={14} className="text-blue-200" />
                        <span className="text-xs font-bold uppercase tracking-wider">{activeRole}</span>
                      </div>
                    </div>
                    
                    {/* Profile Actions */}
                    <div className="p-4 space-y-1">
                      <div className="px-2 pb-2 mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Management</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setIsEditProfileOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 group transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <UserCircle size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Manage Profile</p>
                            <p className="text-[10px] text-gray-500">Update your personal details</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600" />
                      </button>
                      
                      <button 
                        onClick={() => {
                          setIsSecurityOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Lock size={16} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">Security</p>
                            <p className="text-[10px] text-gray-500">Password & Authentication</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600" />
                      </button>
                      
                      <div className="h-px bg-gray-100 my-2"></div>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
        <ProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
        <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />
      </div>

      {/* Floating Action / Slide-in Popup Notifications Queue */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 min-w-[320px] max-w-[400px] pointer-events-none">
        <AnimatePresence>
          {activePopups && activePopups.map((popup) => (
            <motion.div
              layout
              key={popup.popupId}
              initial={{ opacity: 0, x: 50, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, y: -15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white/95 backdrop-blur-md p-5 rounded-3xl border-2 border-blue-50 hover:border-blue-100 shadow-2xl shadow-blue-900/10 flex items-start gap-3.5 cursor-pointer hover:shadow-blue-950/10 pointer-events-auto select-none"
              onClick={() => {
                markAsRead(popup._id);
                dismissPopup(popup.popupId);
                navigate(`/dashboard/${activeRolePath}/notifications?id=${popup._id}`);
              }}
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0 mt-0.5">
                <Bell size={18} className="animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest leading-none">
                    {popup.type || 'Activity'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissPopup(popup.popupId);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h3 className="text-xs font-extrabold text-gray-900 mt-2 truncate line-clamp-1">
                  {popup.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {popup.message}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-blue-500 uppercase flex items-center gap-1">
                      Click to Open
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(popup._id);
                        dismissPopup(popup.popupId);
                      }}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md text-[9px] font-extrabold uppercase transition-all border border-blue-100 flex items-center gap-0.5"
                    >
                      <Check size={10} />
                      Mark Read
                    </button>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 font-mono">
                    Just now
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardLayout;
