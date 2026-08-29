import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  Trash2, 
  Check, 
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Loader2,
  FileText,
  X,
  ExternalLink
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Notifications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    loading 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deleteConfirmNotification, setDeleteConfirmNotification] = useState(null);

  const notificationId = searchParams.get('id');

  useEffect(() => {
    if (notificationId && notifications.length > 0) {
      const found = notifications.find(n => n._id === notificationId);
      if (found) {
        if (!found.isRead) {
          markAsRead(found._id);
        }
        const timer = setTimeout(() => {
          setSelectedNotification(found);
          setSearchParams({}, { replace: true });
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [notificationId, notifications, setSearchParams, markAsRead]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setSelectedNotification(notification);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmNotification) return;
    const id = deleteConfirmNotification._id;
    await deleteNotification(id);
    if (selectedNotification?._id === id) {
      setSelectedNotification(null);
    }
    setDeleteConfirmNotification(null);
  };

  const handleProceedLink = (link) => {
    setSelectedNotification(null);
    if (!link) return;

    const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');
    const rolePath = activeRole.toLowerCase().replace(/\s+/g, '-');
    if (!rolePath) return;

    // Split the query parameters to process them separately
    const [pathPart, queryPart] = link.split('?');
    
    // Normalize path: extract page/subpath from the link
    let section = '';
    
    if (pathPart.startsWith('/dashboard')) {
      const parts = pathPart.split('/').filter(Boolean);
      if (parts.length > 1) {
        const knownRoles = ['team-member', 'team-leader', 'supervisor', 'hod', 'admin', 'student', 'teacher'];
        if (knownRoles.includes(parts[1])) {
          section = parts.slice(2).join('/');
        } else {
          section = parts.slice(1).join('/');
        }
      }
    } else {
      section = pathPart.replace(/^\/+/, '');
    }

    // Map section keywords to correct subpath according to current user role's available routes
    let targetSection = section;

    if (rolePath === 'team-member') {
      if (targetSection === 'tasks' || targetSection === 'task' || targetSection === 'task-review' || targetSection === 'assigned-tasks') {
        targetSection = 'assigned-tasks';
      } else if (targetSection === 'projects' || targetSection === 'records' || targetSection === 'teams') {
        targetSection = 'team';
      }
    } else if (rolePath === 'team-leader') {
      if (targetSection === 'task' || targetSection === 'task-review') {
        targetSection = 'tasks';
      } else if (targetSection === 'projects' || targetSection === 'records' || targetSection === 'teams') {
        targetSection = 'team';
      }
    } else if (rolePath === 'supervisor') {
      if (targetSection === 'records') {
        targetSection = 'projects';
      } else if (targetSection === 'assigned-tasks' || targetSection === 'task-review') {
        targetSection = 'tasks';
      }
    } else if (rolePath === 'hod') {
      if (targetSection === 'records') {
        targetSection = 'projects';
      } else if (targetSection === 'assigned-tasks' || targetSection === 'tasks' || targetSection === 'task-review') {
        targetSection = 'teams';
      } else if (targetSection === 'approvals' || targetSection === 'submissions') {
        targetSection = 'submissions';
      }
    } else if (rolePath === 'admin') {
      if (targetSection === 'records') {
        targetSection = 'projects';
      } else if (targetSection === 'logs' || targetSection === 'system-logs') {
        targetSection = 'logs';
      }
    }

    // Join back into target section path
    let targetLink = `/dashboard/${rolePath}`;
    if (targetSection) {
      targetLink += `/${targetSection}`;
    }
    
    // Append query parameter if it exists
    if (queryPart) {
      targetLink += `?${queryPart}`;
    }

    navigate(targetLink);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Announcement': return <Bell className="text-amber-500" size={20} />;
      case 'Task': return <CheckCircle2 className="text-blue-500" size={20} />;
      case 'Submission': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'Feedback': return <Info className="text-indigo-500" size={20} />;
      case 'Assignment': return <FileText className="text-purple-500" size={20} />;
      default: return <Info className="text-gray-500" size={20} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesTab = activeTab === 'All' || (activeTab === 'Unread' && !n.isRead);
    const matchesSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with the latest activities and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-blue-50"
          >
            <Check size={16} />
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {['All', 'Unread'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search notifications..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification) => (
            <motion.div
              layout
              key={notification._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`bg-white p-5 rounded-2xl border transition-all flex items-start gap-4 group cursor-pointer hover:shadow-md ${
                notification.isRead ? 'border-gray-100 opacity-80' : 'border-blue-100 shadow-sm shadow-blue-50'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
              }`}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-gray-900 ${notification.isRead ? 'text-gray-600' : ''}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {notification.message}
                </p>
                
                <div className="flex items-center gap-2 pt-3">
                  {!notification.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-100 flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      Mark read
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmNotification(notification);
                    }}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              {notification.link && (
                <div className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-300 group-hover:text-gray-600">
                  <ChevronRight size={18} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Bell size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No notifications</h3>
              <p className="text-gray-500">You&apos;re all caught up! No new alerts at the moment.</p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    {getIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Notification Details</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedNotification.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-widest">
                    {selectedNotification.type} Alert
                  </span>
                  <h2 className="text-xl font-black text-gray-900 mt-3 font-sans leading-snug">
                    {selectedNotification.title}
                  </h2>
                  <p className="text-xs text-gray-400 font-bold font-mono mt-1.5 flex items-center gap-1.5">
                    <Clock size={12} />
                    {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-100/50">
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium font-sans">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between gap-3 flex-wrap">
                <button 
                  onClick={() => setDeleteConfirmNotification(selectedNotification)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete
                </button>

                <div className="flex items-center gap-2.5">
                  {!selectedNotification.isRead && (
                    <button 
                      onClick={() => {
                        markAsRead(selectedNotification._id);
                        setSelectedNotification(prev => ({ ...prev, isRead: true }));
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-100"
                    >
                      <Check size={14} />
                      Mark read
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                  {selectedNotification.link && (
                    <button 
                      onClick={() => handleProceedLink(selectedNotification.link)}
                      className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-100"
                    >
                      <ExternalLink size={14} />
                      Go to Section
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Notification Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmNotification}
        onClose={() => setDeleteConfirmNotification(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? It will be removed from your notifications inbox."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmNotification ? deleteConfirmNotification.title : null}
      />
    </div>
  );
};

export default Notifications;
