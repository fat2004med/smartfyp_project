import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronRight, Clock, Megaphone, Info, X, User, Paperclip, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AnnouncementFeed = () => {
  const { user } = useAuth();
  const location = useLocation();

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
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/announcements');
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.assigned) {
        list = data.assigned;
      }

      const filtered = list.filter(a => {
        if (activeRole && a.targetRoles && !a.targetRoles.includes(activeRole)) {
          return false;
        }
        const authorId = (a.author?._id || a.author)?.toString();
        const cRole = a.createdAsRole || a.publisherRole || a.authorRole;
        if (authorId === user?._id?.toString() && cRole === activeRole) {
          return false;
        }
        const userRegistrationTimestamp = user?.firstLoginAt || user?.createdAt;
        const userCutoffTime = userRegistrationTimestamp ? new Date(userRegistrationTimestamp).getTime() : null;
        if (userCutoffTime && a.createdAt && user?.role !== 'Admin') {
          const annCreatedTime = new Date(a.createdAt).getTime();
          if (authorId !== user?._id?.toString() && annCreatedTime < userCutoffTime) {
            return false;
          }
        }
        return true;
      });

      setAnnouncements(filtered.slice(0, 5));
    } catch (error) {
      console.error('Error fetching announcement feed:', error);
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchAnnouncements();
    };
    loadData();
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchAnnouncements]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Megaphone size={20} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-sans">Announcements</h2>
        </div>
        <Link 
          to={`/dashboard/${activeRolePath}/announcements`} 
          className="text-blue-600 text-xs sm:text-sm font-bold hover:underline flex items-center gap-1 group/all"
        >
          View All <ChevronRight size={14} className="group-hover/all:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-50 rounded-2xl" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 text-gray-400 italic">No new announcements</div>
        ) : (
          announcements.map((ann, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={ann._id} 
              className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group relative border-l-4 border-l-indigo-500"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-xs sm:text-sm font-sans flex-1 min-w-0" title={ann.title}>{ann.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase shrink-0 ${
                    ann.priority === 'High' ? 'bg-red-100 text-red-600' :
                    ann.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {ann.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 break-words">{ann.description}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider min-w-0">
                    <Clock size={10} className="shrink-0" />
                    <span className="shrink-0">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    <span className="shrink-0">•</span>
                    <span className="flex items-center gap-1 bg-gray-100/50 px-1.5 py-0.5 rounded border border-gray-200/60 max-w-[150px] sm:max-w-[200px] truncate" title={ann.author?.name || 'Admin'}>
                      <span className="truncate">{ann.author?.name || 'Admin'}</span>
                      {(ann.authorRole || ann.author?.role) && (
                        <span className="text-[7px] sm:text-[8px] bg-blue-50 text-blue-600 border border-blue-100 rounded px-1 uppercase font-black shrink-0">
                          {ann.authorRole || ann.author.role.split(',')[0].trim()}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedAnnouncement(ann);
                      setIsDetailsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-indigo-600 px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm w-full sm:w-auto"
                  >
                    <Info size={12} />
                    Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>      {/* Local Details Modal for Feed */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedAnnouncement && (
           <div className="fixed inset-0 z-[200] flex justify-center items-center p-2 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDetailsModalOpen(false)}
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-indigo-100 text-indigo-600`}>
                      <Bell size={20} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-sans">Announcement Details</h3>
                  </div>
                  <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-gray-400 shadow-sm border border-gray-100 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {selectedAnnouncement.category || 'General'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedAnnouncement.priority === 'High' ? 'bg-red-100 text-red-600' :
                          selectedAnnouncement.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {selectedAnnouncement.priority}
                        </span>
                     </div>
                     <h2 className="text-xl sm:text-3xl font-black text-gray-900 leading-tight font-sans tracking-tight break-words">{selectedAnnouncement.title}</h2>
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                           <User size={14} className="text-indigo-500 shrink-0" /> 
                           <span className="truncate">{selectedAnnouncement.author?.name || 'Admin'}</span>
                           {(selectedAnnouncement.authorRole || selectedAnnouncement.author?.role) && (
                             <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded font-black uppercase tracking-wide ml-1 shrink-0">
                               {selectedAnnouncement.authorRole || selectedAnnouncement.author.role.split(',')[0].trim()}
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                           <Clock size={14} className="text-indigo-500 shrink-0" /> 
                           <span>{new Date(selectedAnnouncement.createdAt).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-sm sm:text-lg text-gray-700 leading-relaxed whitespace-pre-wrap font-medium italic break-words">
                      &quot;{selectedAnnouncement.description}&quot;
                    </p>
                  </div>

                  {selectedAnnouncement.attachmentUrl && (
                    <div className="pt-6 border-t border-gray-100 space-y-3">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                        <Paperclip size={16} className="text-indigo-600" />
                        Attached Document
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                           <a 
                             href={selectedAnnouncement.attachmentUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             download
                             className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer group"
                           >
                              <div className="flex items-center gap-4 overflow-hidden">
                                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                    <FileText size={24} />
                                 </div>
                                 <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                       {selectedAnnouncement.attachmentUrl.split('/').pop()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Click to download file</p>
                                 </div>
                              </div>
                              <ChevronRight size={18} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                           </a>
                      </div>
                    </div>
                  )}

                  {/* Extract and show potential links in description */}
                  {selectedAnnouncement.description && selectedAnnouncement.description.match(/https?:\/\/[^\s]+/g) && (
                    <div className="pt-6 border-t border-gray-100 space-y-3">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest">
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
                
                <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                   <button 
                    onClick={() => setIsDetailsModalOpen(false)} 
                    className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-center"
                   >
                    Close
                   </button>
                </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementFeed;
