import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Paperclip, 
  X, 
  Clock,
  User,
  ChevronDown,
  History,
  Info,
  FileText,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const Announcements = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [activeTab, setActiveTab] = useState(user?.role === 'Admin' ? 'Created' : 'Assigned'); // 'Assigned' or 'Created'
  const [filterType, setFilterType] = useState('All Types');
  const [filterPriority, setFilterPriority] = useState('All Priorities');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [hasAllocatedTeam, setHasAllocatedTeam] = useState(true);
  const [deleteConfirmAnnouncement, setDeleteConfirmAnnouncement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [announcementData, setAnnouncementData] = useState({ created: [], assigned: [] });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    category: 'General',
    priority: 'Low',
    description: '',
    expiryDate: '',
    attachment: null,
    targetRoles: []
  });

  const [loadingAction, setLoadingAction] = useState(false);

  const roleHierarchy = ["Admin", "HOD", "Supervisor", "Team Leader", "Team Member"];
  const activeRole = localStorage.getItem('activeDashboardRole') || (user?.role ? user.role.split(',')[0].trim() : '');
  const userRoleIndex = roleHierarchy.indexOf(activeRole);

  // Get allowed target roles based on hierarchy
  const getAllowedTargetRoles = () => {
    if (userRoleIndex === -1) return [];
    // Only target roles strictly below active role
    return roleHierarchy.slice(userRoleIndex + 1);
  };

  const checkTeamAllocation = useCallback(async () => {
    if (activeRole === 'Supervisor' || activeRole === 'Team Leader') {
      try {
        const { data } = await axios.get('/api/projects');
        setHasAllocatedTeam(Array.isArray(data) && data.length > 0);
      } catch (error) {
        console.error('Error checking project allocation:', error);
      }
    } else {
      setHasAllocatedTeam(true);
    }
  }, [activeRole]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const [allRes, pubRes] = await Promise.all([
        axios.get('/api/announcements'),
        axios.get('/api/announcements/published').catch(() => ({ data: [] }))
      ]);
      const data = allRes.data || [];
      const publishedData = pubRes.data || [];

      // Published By Me: authored by the user in activeRole capacity
      const createdList = (publishedData.length > 0 ? publishedData : data).filter(a => {
        const authorId = (a.author?._id || a.author)?.toString();
        if (authorId !== user?._id?.toString()) return false;
        const cRole = a.createdAsRole || a.publisherRole || a.authorRole;
        if (cRole) return cRole === activeRole;
        return true;
      });

      // Announcements for Me: targeted to activeRole (and not created by self in same activeRole capacity)
      const userRegistrationTimestamp = user?.firstLoginAt || user?.createdAt;
      const userCutoffTime = userRegistrationTimestamp ? new Date(userRegistrationTimestamp).getTime() : null;

      const assignedList = data.filter(a => {
        const matchesTarget = a.targetRoles?.includes(activeRole) || !a.targetRoles || a.targetRoles.length === 0;
        if (!matchesTarget) return false;

        const authorId = (a.author?._id || a.author)?.toString();
        const cRole = a.createdAsRole || a.publisherRole || a.authorRole;
        if (authorId === user?._id?.toString() && cRole === activeRole) {
          return false;
        }

        // Only show announcements created after the user's registration/first login for non-Admin roles
        if (userCutoffTime && a.createdAt && user?.role !== 'Admin') {
          const annCreatedTime = new Date(a.createdAt).getTime();
          if (authorId !== user?._id?.toString() && annCreatedTime < userCutoffTime) {
            return false;
          }
        }

        return true;
      });

      setAnnouncementData({ created: createdList, assigned: assignedList });
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.createdAt, user?.firstLoginAt, user?.role, activeRole]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchAnnouncements(),
        checkTeamAllocation()
      ]);
    };
    load();
  }, [fetchAnnouncements, checkTeamAllocation]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const formData = new FormData();
      formData.append('title', newAnnouncement.title);
      formData.append('description', newAnnouncement.description);
      formData.append('category', newAnnouncement.category);
      formData.append('priority', newAnnouncement.priority);
      formData.append('expiryDate', newAnnouncement.expiryDate);
      formData.append('targetRoles', JSON.stringify(newAnnouncement.targetRoles));
      
      if (newAnnouncement.attachment) {
        formData.append('attachment', newAnnouncement.attachment);
      }

      if (editingId) {
        // ... (existing update logic)
        if (newAnnouncement.attachment) {
           await axios.put(`/api/announcements/${editingId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
           await axios.put(`/api/announcements/${editingId}`, {
             ...newAnnouncement,
             targetRoles: newAnnouncement.targetRoles
           });
        }
      } else {
        await axios.post('/api/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success(editingId ? 'Announcement Updated Successfully!' : 'Announcement Created Successfully!');
      fetchAnnouncements();
      setIsModalOpen(false);
      setEditingId(null);
      setNewAnnouncement({
        title: '',
        category: 'General',
        priority: 'Low',
        description: '',
        expiryDate: '',
        attachment: null,
        targetRoles: []
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving announcement');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (itemToDelete) => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/announcements/${itemToDelete._id}`);
      toast.success('Announcement deleted successfully!');
      setDeleteConfirmAnnouncement(null);
      setIsDetailsModalOpen(false);
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting announcement');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setNewAnnouncement({
      title: item.title,
      category: item.category,
      priority: item.priority,
      description: item.description,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 16) : '',
      attachment: null,
      targetRoles: item.targetRoles || []
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = (item) => {
    setSelectedAnnouncement(item);
    setIsDetailsModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewAnnouncement(prev => ({
        ...prev,
        attachment: e.target.files[0]
      }));
    }
  };

  const removeFile = () => {
    setNewAnnouncement(prev => ({
      ...prev,
      attachment: null
    }));
  };

  const toggleTarget = (role) => {
    setNewAnnouncement(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-600';
      case 'Medium': return 'bg-yellow-100 text-yellow-600';
      case 'Low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Academic': return 'bg-blue-100 text-blue-600';
      case 'Event': return 'bg-purple-100 text-purple-600';
      case 'Urgent': return 'bg-orange-100 text-orange-600';
      case 'General': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const canManage = (item) => {
    return user._id === item.author?._id || activeRole === 'Admin';
  };

  const currentList = activeTab === 'Assigned' ? announcementData.assigned : announcementData.created;

  const filteredAnnouncements = currentList.filter(item => {
    const typeMatch = filterType === 'All Types' || (item.category || item.type) === filterType;
    const priorityMatch = filterPriority === 'All Priorities' || item.priority === filterPriority;
    return typeMatch && priorityMatch;
  });

  return (
    <div className="w-full max-w-none space-y-6 pb-10 px-0 lg:px-0 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Announcements</h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'Assigned' ? `Viewing ${announcementData.assigned.length} critical updates for your role` : `Managing ${announcementData.created.length} announcements authored by you`}
          </p>
        </div>
        <div className="flex items-center gap-3">
             {activeRole !== 'Team Member' && (
               <button 
                 onClick={() => {
                   if (!hasAllocatedTeam && (activeRole === 'Supervisor' || activeRole === 'Team Leader')) {
                     toast.error("You cannot create announcements until a team/project is allocated to you.");
                     return;
                   }
                   setEditingId(null);
                   setNewAnnouncement({
                     title: '',
                     category: 'General',
                     priority: 'Low',
                     description: '',
                     expiryDate: '',
                     attachment: null,
                     targetRoles: []
                   });
                   setIsModalOpen(true);
                 }}
                 className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                   hasAllocatedTeam || (activeRole !== 'Supervisor' && activeRole !== 'Team Leader')
                     ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer'
                     : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                 }`}
               >
                 <Plus size={20} />
                 Create New
               </button>
             )}
        </div>
      </div>

      {/* Warning Alert for Unallocated Supervisor / Team Leader */}
      {!hasAllocatedTeam && (activeRole === 'Supervisor' || activeRole === 'Team Leader') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 shadow-sm">
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold shrink-0 text-sm">!</div>
          <div className="text-sm leading-relaxed">
            <span className="font-bold block text-amber-900 mb-0.5">Team Allocation Required</span>
            You are currently not allocated to any active student teams or projects. You will be able to create, award, and manage announcements once the Head of Department (HOD) or Admin assigns you to a project record in the system.
          </div>
        </div>
      )}

      {/* Tabs */}
      {activeRole !== 'Team Member' && activeRole !== 'Admin' && (
        <div className="flex items-center p-1 bg-gray-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('Assigned')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'Assigned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Bell size={18} />
            Announcements for Me
          </button>
          <button 
            onClick={() => setActiveTab('Created')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'Created' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <History size={18} />
            Published by Me
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Type</label>
          <div className="relative">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium pr-10"
            >
              <option>All Types</option>
              <option>Academic</option>
              <option>Event</option>
              <option>Urgent</option>
              <option>General</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Priority</label>
          <div className="relative">
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium pr-10"
            >
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
           <div className="text-center py-20 text-gray-400">Loading information feed...</div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Bell size={32} />
             </div>
             <h3 className="text-lg font-bold text-gray-900">Feed is empty</h3>
             <p className="text-gray-500 max-w-xs mx-auto">Either you are all caught up or no announcements match your selected filters.</p>
          </div>
        ) : filteredAnnouncements.map((item) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={item._id}
            className={`bg-white p-6 rounded-2xl border ${item.status === 'Inactive' ? 'border-gray-100 opacity-75' : 'border-blue-50'} shadow-sm hover:shadow-md transition-all relative group overflow-hidden`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeColor(item.category || item.type)}`}>
                      {item.category || item.type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm line-clamp-2">{item.description}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-50">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <User size={14} className="text-gray-400" />
                      <span className="font-medium">{item.author?.name || 'SmartFYP System'}</span>
                      {(item.createdAsRole || item.publisherRole || item.authorRole || item.author?.role) && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-600 border border-blue-100 rounded font-bold uppercase tracking-wide">
                          {item.createdAsRole || item.publisherRole || item.authorRole || item.author.role.split(',')[0].trim()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-gray-400" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    {activeTab === 'Created' && (
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded text-[10px] font-bold">
                        <Users size={12} className="text-gray-400" />
                        Audience: {item.targetRoles?.join(', ') || 'Global'}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleViewDetails(item)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                  >
                    <Info size={16} />
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Details Modal */}
        <AnimatePresence>
          {isDetailsModalOpen && selectedAnnouncement && (
             <div className="fixed inset-0 z-[110] flex justify-center items-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-blue-100 text-blue-600`}>
                        <Bell size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 font-sans">Announcement Details</h3>
                    </div>
                    <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-gray-400 shadow-sm border border-gray-100">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-8 space-y-6 max-h-[50vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeColor(selectedAnnouncement.category || selectedAnnouncement.type)}`}>
                            {selectedAnnouncement.category || selectedAnnouncement.type}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(selectedAnnouncement.priority)}`}>
                            {selectedAnnouncement.priority}
                          </span>
                       </div>
                       <h2 className="text-3xl font-bold text-gray-900 leading-tight">{selectedAnnouncement.title}</h2>
                       <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5 flex-wrap"><User size={16}/> <span className="font-semibold">{selectedAnnouncement.author?.name}</span>{(selectedAnnouncement.createdAsRole || selectedAnnouncement.publisherRole || selectedAnnouncement.authorRole || selectedAnnouncement.author?.role) && <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-bold uppercase tracking-wide ml-1.5">{selectedAnnouncement.createdAsRole || selectedAnnouncement.publisherRole || selectedAnnouncement.authorRole || selectedAnnouncement.author.role.split(',')[0].trim()}</span>}</div>
                          <div className="flex items-center gap-1.5"><Clock size={16}/> {new Date(selectedAnnouncement.createdAt).toLocaleString()}</div>
                       </div>
                    </div>

                    <div className="prose prose-blue max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                        {selectedAnnouncement.description}
                      </p>
                    </div>

                    {selectedAnnouncement.attachmentUrl && (
                      <div className="pt-6 border-t border-gray-100 space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                          <Paperclip size={16} className="text-blue-600" />
                          Attached Document
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                             <a 
                               href={selectedAnnouncement.attachmentUrl} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               download
                               className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group"
                             >
                                <div className="flex items-center gap-4 overflow-hidden">
                                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                      <FileText size={24} />
                                   </div>
                                   <div className="overflow-hidden">
                                      <p className="text-sm font-bold text-gray-900 truncate">
                                         {selectedAnnouncement.attachmentUrl.split('/').pop()}
                                      </p>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">Click to download file</p>
                                   </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                             </a>
                        </div>
                      </div>
                    )}

                    {/* Extract and show potential links in description */}
                    {selectedAnnouncement.description.match(/https?:\/\/[^\s]+/g) && (
                      <div className="pt-6 border-t border-gray-100 space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                          External Links
                        </h4>
                        <div className="space-y-2">
                          {selectedAnnouncement.description.match(/https?:\/\/[^\s]+/g).map((link, i) => (
                            <a 
                              key={i} 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors truncate border border-blue-100"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                     <div className="flex flex-col gap-1 items-start">
                        <div className="text-xs text-gray-400">
                          Target Roles: <span className="text-gray-600 font-bold">{selectedAnnouncement.targetRoles?.join(', ') || 'All Users'}</span>
                        </div>
                        {canManage(selectedAnnouncement) && (
                          <div className="flex items-center gap-3 mt-2">
                            <button 
                              onClick={() => {
                                handleEdit(selectedAnnouncement);
                                setIsDetailsModalOpen(false);
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                               <Edit2 size={12} /> Edit
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmAnnouncement(selectedAnnouncement)}
                              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                               <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                     </div>
                     <button onClick={() => setIsDetailsModalOpen(false)} className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all">Close</button>
                  </div>
                </motion.div>
             </div>
          )}
        </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter announcement title"
                    value={newAnnouncement.title || ''}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Type</label>
                    <select 
                      value={newAnnouncement.category || 'General'}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option>General</option>
                      <option>Academic</option>
                      <option>Event</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Priority</label>
                    <select 
                      value={newAnnouncement.priority || 'Low'}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Target Roles</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getAllowedTargetRoles().map((role) => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => toggleTarget(role)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            (newAnnouncement.targetRoles || []).includes(role) 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-300 group-hover:border-blue-400'
                          }`}
                        >
                          {(newAnnouncement.targetRoles || []).includes(role) && <CheckCircle2 size={12} />}
                        </div>
                        <span className="text-xs text-gray-600">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Enter announcement description"
                    value={newAnnouncement.description || ''}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Expiry Date (Optional)</label>
                  <input 
                    type="datetime-local"
                    value={newAnnouncement.expiryDate || ''}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, expiryDate: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Attachment (Optional)</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-bold cursor-pointer hover:bg-blue-100 transition-all">
                      <Paperclip size={18} />
                      {newAnnouncement.attachment ? 'Replace File' : 'Upload File (PDF, PNG, etc.)'}
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                    
                    {newAnnouncement.attachment && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Paperclip size={14} className="text-blue-500" />
                          <span className="max-w-[200px] truncate">{newAnnouncement.attachment.name}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile()}
                          className="p-1 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loadingAction}
                    className="w-full sm:flex-1 px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loadingAction}
                    className="w-full sm:flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loadingAction ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      editingId ? <CheckCircle2 size={18} /> : <Plus size={18} />
                    )}
                    {loadingAction ? 'Uploading...' : (editingId ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Announcement Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmAnnouncement}
        onClose={() => setDeleteConfirmAnnouncement(null)}
        onConfirm={() => handleDelete(deleteConfirmAnnouncement)}
        isLoading={isDeleting}
        title="Confirm Announcement Deletion"
        message="Are you sure you want to delete this announcement? It will be removed from all users' dashboards and notifications."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        itemName={deleteConfirmAnnouncement ? deleteConfirmAnnouncement.title : null}
      />
    </div>
  );
};

export default Announcements;
