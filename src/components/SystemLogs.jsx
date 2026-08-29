import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Search, 
  RefreshCw, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  User, 
  Globe, 
  ShieldCheck,
  Download,
  Trash2,
  Database,
  CheckCircle2,
  Bell,
  FileText,
  Activity
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLimit, setActivitiesLimit] = useState(5);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Health checking async function
  const checkHealthAsync = async () => {
    try {
      const { data } = await axios.get(`/api/health?t=${Date.now()}`);
      setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
    } catch (err) {
      setDbStatus('disconnected');
    }
  };

  // Fetch from our backend
  const fetchLogsAsync = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      setErrorMsg('');
      const { data } = await axios.get('/api/dashboard/logs');
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch system logs from backend:', err);
      setErrorMsg('Failed to fetch latest system logs from the server.');
    } finally {
      setLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  };

  const fetchActivitiesAsync = async () => {
    try {
      setLoadingActivities(true);
      const { data } = await axios.get('/api/dashboard/admin');
      setRecentActivities(data.recentActivity || []);
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialLoad = async () => {
      try {
        setErrorMsg('');
        const { data } = await axios.get('/api/dashboard/logs');
        if (active) {
          setLogs(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load system logs:', err);
        if (active) {
          setErrorMsg('Failed to fetch latest system logs from the server.');
          setLoading(false);
        }
      }
    };

    const initialHealth = async () => {
      try {
        const { data } = await axios.get('/api/health');
        if (active) {
          setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
        }
      } catch (err) {
        if (active) setDbStatus('disconnected');
      }
    };

    const initialActivities = async () => {
      try {
        setLoadingActivities(true);
        const { data } = await axios.get('/api/dashboard/admin');
        if (active) {
          setRecentActivities(data.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to load recent activities:', err);
      } finally {
        if (active) setLoadingActivities(false);
      }
    };

    initialLoad();
    initialHealth();
    initialActivities();
    
    // Auto-poll logs every 8 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get('/api/dashboard/logs');
        if (active) {
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to poll system logs:', err);
      }
    }, 8000);

    // Auto-poll health every 15 seconds
    const healthInterval = setInterval(async () => {
      try {
        const { data } = await axios.get('/api/health');
        if (active) {
          setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
        }
      } catch (err) {
        if (active) setDbStatus('disconnected');
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(healthInterval);
    };
  }, []);

  // Handle Refresh Action manually
  const handleRefresh = () => {
    fetchLogsAsync(true);
    checkHealthAsync();
    fetchActivitiesAsync();
  };

  // Clear system logs via database delete endpoint
  const handleClear = async () => {
    try {
      setIsClearing(true);
      await axios.delete('/api/dashboard/logs');
      setLogs([]);
      setCurrentPage(1);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear logs:', err);
      setErrorMsg('Error clearing logs. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  // Premium Client-side Export to CSV file
  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Level', 'Event', 'User', 'Timestamp', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      log.level,
      log.event,
      log.user,
      new Date(log.createdAt).toLocaleString(),
      log.ip || 'Internal',
      log.details
    ]);
    
    // Construct properly encoded CSV content
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.id = "csv-download-link";
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartfyp_system_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelStyles = (level) => {
    switch (level) {
      case 'Info': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Warning': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Error': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Info': return <Info size={14} />;
      case 'Warning': return <AlertTriangle size={14} />;
      case 'Error': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  // Perform search & filters
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    const event = log.event || '';
    const user = log.user || '';
    const details = log.details || '';
    const ip = log.ip || '';
    
    const matchesSearch = 
      event.toLowerCase().includes(term) || 
      user.toLowerCase().includes(term) ||
      details.toLowerCase().includes(term) ||
      ip.toLowerCase().includes(term);
      
    const matchesLevel = filterLevel === 'All' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // Pagination bounds
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Compute live responsive metrics safely
  const totalLogsCount = logs.length;
  const errorLogsCount = logs.filter(l => l.level === 'Error').length;
  const warningLogsCount = logs.filter(l => l.level === 'Warning').length;
  const failedLogins24h = logs.filter(l => l.event === 'Failed Login Attempt').length;
  const activeIpsCount = new Set(logs.map(l => l.ip).filter(ip => ip && ip !== 'Internal')).size || 1;

  return (
    <div className="max-w-[1700px] mx-auto space-y-6 pb-10" id="system-logs-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="system-logs-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3" id="system-logs-title">
            <Terminal className="text-blue-600" size={32} />
            System Logs
          </h1>
          <p className="text-gray-500 mt-1" id="system-logs-description">Monitor system events, logins, security audits, and application health in real time</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 animate-in fade-in duration-300" id="header-actions">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
            dbStatus === 'connected' ? 'bg-green-50 text-green-600 border-green-200' : 
            dbStatus === 'disconnected' ? 'bg-red-50 text-red-600 border-red-200' : 
            'bg-gray-50 text-gray-500 border-gray-200 animate-pulse'
          }`}>
            <Database size={16} />
            Database: {dbStatus === 'connected' ? 'Atlas Online' : dbStatus === 'disconnected' ? 'Atlas Offline' : 'Checking...'}
          </div>

          <button 
            id="btn-refresh-logs"
            onClick={handleRefresh}
            className={`p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh logs from database"
          >
            <RefreshCw size={20} />
          </button>
          
          <button 
            id="btn-clear-logs"
            onClick={() => setShowClearConfirm(true)}
            disabled={logs.length === 0}
            className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={18} />
            Clear Logs
          </button>

          <button 
            id="btn-export-logs"
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-sm" id="logs-err-msg">
          {errorMsg}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4" id="system-logs-filters">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            id="search-logs-input"
            type="text"
            placeholder="Search events, users, or details..."
            value={searchQuery || ''}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2" id="level-filter-container">
          <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Event Type:</span>
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200" id="level-filter-buttons">
            {['All', 'Info', 'Warning', 'Error'].map((level) => (
              <button
                id={`filter-btn-${level}`}
                key={level}
                onClick={() => {
                  setFilterLevel(level);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterLevel === level 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="realtime-logs-stats">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4" id="stat-total-logs">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Total Database Logs</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalLogsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4" id="stat-failed-login">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Failed Logins (Live)</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{failedLogins24h}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4" id="stat-errors">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">System Errors</p>
            <p className="text-2xl font-bold text-red-600 mt-0.5">{errorLogsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4" id="stat-active-ips">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Active IP Sources</p>
            <p className="text-2xl font-bold text-green-600 mt-0.5">{activeIpsCount}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Recent Activity Tracker */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm" id="recent-activity-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Recent Activity Feed</h2>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">Real-time submissions, announcements, and critical system events</p>
            </div>
          </div>
          <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-150">
            {recentActivities.length} total events fetched
          </div>
        </div>

        {loadingActivities ? (
          <div className="py-12 text-center text-gray-400 font-semibold flex flex-col items-center gap-2">
            <RefreshCw className="animate-spin text-blue-500" size={24} />
            Loading recent activities...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentActivities.slice(0, activitiesLimit).map((activity) => (
                <div 
                  key={`activity-log-${activity.id}`} 
                  className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-50 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all duration-305 min-w-0"
                >
                  <div className={`p-2.5 rounded-xl shadow-xs shrink-0 ${
                    activity.type === 'submission' ? 'bg-blue-100/70 text-blue-600' : 
                    activity.type === 'announcement' ? 'bg-indigo-100/70 text-indigo-600' : 
                    activity.type === 'error' ? 'bg-red-100/70 text-red-600' :
                    activity.type === 'warning' ? 'bg-yellow-100/70 text-yellow-600' :
                    'bg-emerald-100/70 text-emerald-600'
                  }`}>
                    {activity.type === 'submission' ? <FileText size={16} /> : 
                     activity.type === 'announcement' ? <Bell size={16} /> : 
                     activity.type === 'error' || activity.type === 'warning' ? <AlertCircle size={16} /> :
                     <CheckCircle2 size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug break-words">{activity.action}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1.5">
                      <span className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="col-span-2 text-center py-10 text-gray-400 text-sm italic">
                  No recent activities recorded in the system.
                </div>
              )}
            </div>

            {recentActivities.length > activitiesLimit && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setActivitiesLimit(prev => prev + 6)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-[1.02] shadow-md hover:shadow-blue-200 transition-all cursor-pointer"
                >
                  Show More Activities
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="logs-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="logs-table">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Event Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Performed By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <RefreshCw size={36} className="animate-spin text-blue-500" />
                      <p className="font-bold text-sm">Loading logs dynamically from database...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode='popLayout'>
                  {paginatedLogs.map((log) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={log._id || log.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider ${getLevelStyles(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 text-sm">{log.event}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <User size={12} />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{log.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock size={14} />
                          <span className="text-xs">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Globe size={14} />
                          <span className="text-xs font-mono">{log.ip || 'Internal'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <span className="text-xs font-medium text-gray-600 break-words block">{log.details}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
              
              {!loading && paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <ShieldCheck size={48} strokeWidth={1.5} className="text-green-500" />
                      <p className="font-bold">No logs matching search query or event level</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Container */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between" id="logs-pagination">
          <p className="text-xs text-gray-500 font-bold" id="pagination-status">
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} log entries
          </p>
          <div className="flex items-center gap-2" id="pagination-controls">
            <button 
              id="btn-prev-page"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400 font-bold px-1">Page {currentPage} of {totalPages}</span>
            <button 
              id="btn-next-page"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="system-health-grid">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="health-security">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={18} />
            Database & System Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Logging Level</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">PROD_TRACE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Logged Incidents (Total)</span>
              <span className="text-sm font-bold text-gray-900">{errorLogsCount + warningLogsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto Backups</span>
              <span className="text-sm text-green-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Active
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="health-performance">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="text-blue-500" size={18} />
            System Performance Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Gateway Status</span>
              <span className="text-sm font-bold text-green-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Polling Interval</span>
              <span className="text-sm font-bold text-gray-900">8000 ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Trace State</span>
              <span className="text-sm font-bold text-gray-900">Normal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Logs Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        isLoading={isClearing}
        title="Clear All System Logs"
        message="Are you sure you want to permanently clear all system event and audit logs? This action cannot be undone and historic traces will be wiped."
        confirmText="Yes, Clear All Logs"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default SystemLogs;
