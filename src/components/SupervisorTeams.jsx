import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  Users, 
  Briefcase, 
  Search, 
  Filter, 
  ChevronRight, 
  ExternalLink,
  TrendingUp,
  User,
  Mail,
  Phone,
  MessageSquare,
  Activity,
  X,
  FileText,
  Clock,
  Code2,
  Calendar,
  CheckCircle2,
  Award,
  Download,
  Eye
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const SupervisorTeams = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });

  useEffect(() => {
    const fetchTeams = async () => {
        try {
            const { data } = await axios.get('/api/projects');
            // Backend already filters by supervisor if the user role is Supervisor
            setTeams(data);
        } catch (error) {
            console.error('Error fetching supervised teams:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(team => 
    team.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.teamName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Activity className="animate-pulse text-blue-600" size={48} />
      <p className="text-gray-500 font-bold">Loading Your Teams...</p>
    </div>
  );

  return (
    <div className="max-w-[1700px] mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assigned Teams</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all project teams under your supervision</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <span className="text-sm font-bold text-gray-700">{teams.length} Active Teams</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by team name or project..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
        <button className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all text-sm">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team, idx) => {
          const teamKey = team._id || team.id || `idx-${idx}`;
          return (
            <motion.div
              layout
              key={`supervised-team-${teamKey}`}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all space-y-5 group flex flex-col justify-between"
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <Users size={24} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    team.status === 'Completed' ? 'bg-green-100 text-green-600' :
                    team.status === 'Active' || team.status === 'Approved' ? 'bg-blue-100 text-blue-600' :
                    team.status === 'Proposed' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {team.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{team.teamName || team.title}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{team.department?.name || 'Department'}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project</p>
                    <p className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[40px]">{team.title}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Leader</p>
                      <p className="text-sm font-medium text-gray-700">{team.teamLeader?.name || 'Leader'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Members</p>
                      <p className="text-sm font-medium text-gray-700">{team.members?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-blue-600">{team.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${team.progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                <div className="flex items-center gap-2">
                  {team.teamLeader?.email && (
                    <a href={`mailto:${team.teamLeader.email}`} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors">
                      <Mail size={16} />
                    </a>
                  )}
                  {team.teamLeader?.phone && (
                    <a href={`tel:${team.teamLeader.phone}`} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors">
                      <Phone size={16} />
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedTeam(team)}
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )})}
      </div>

      {/* Team Details Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTeam(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl relative z-10 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
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
                    <p className="text-sm sm:text-base md:text-lg font-black text-blue-600 break-all">{selectedTeam.progress}% Done</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedTeam.progress}%` }} />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Status</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-blue-600 break-all">
                      {(() => {
                        const status = selectedTeam.status || 'Proposed';
                        if (status === 'Proposed' || status === 'Rejected') return 'Inactive';
                        if (status === 'Completed' || status === 'Published') return 'Completed';
                        return 'Activated';
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Current Phase</p>
                    <p className="text-sm sm:text-base md:text-lg font-black text-indigo-600 break-words">
                      {(() => {
                        const status = selectedTeam.status || 'Proposed';
                        const hasSubmissions = selectedTeam.finalDocumentations && selectedTeam.finalDocumentations.length > 0;
                        if (status === 'Proposed' || status === 'Rejected') return 'Proposal';
                        if (status === 'Completed') return 'Completed (Final)';
                        if (status === 'Published') return 'Published';
                        return hasSubmissions ? 'In Progress' : 'Started';
                      })()}
                    </p>
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
                              <span key={`tag-${i}`} className="text-xs font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-2.5 py-1 rounded-lg">
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
                            onClick={() => triggerDirectDownload(selectedTeam.fileUrl, `${selectedTeam.title || selectedTeam.teamName} (Proposal Document)`)}
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all text-xs font-bold text-white shadow-xs cursor-pointer"
                            title="Download Proposal Document"
                          >
                            <Download size={14} />
                            <span>Download Proposal Doc</span>
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
                        <User size={14} className="text-emerald-500" /> Supervisor Info
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
                              className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium break-all select-all transition-colors"
                            >
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              {selectedTeam.supervisor.email}
                            </a>
                            {selectedTeam.supervisor.phone ? (
                              <a 
                                href={`tel:${selectedTeam.supervisor.phone}`} 
                                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium select-all transition-colors"
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
                        <User size={14} /> Team Leader Info
                      </h4>
                      {selectedTeam.teamLeader ? (
                        <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100 space-y-3">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                            {selectedTeam.teamLeader.name}
                          </div>
                          
                          <div className="space-y-1.5 text-xs">
                            <a 
                              href={`mailto:${selectedTeam.teamLeader.email}`} 
                              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium break-all select-all transition-colors"
                            >
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              {selectedTeam.teamLeader.email}
                            </a>
                            {selectedTeam.teamLeader.phone && (
                              <a 
                                href={`tel:${selectedTeam.teamLeader.phone}`} 
                                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium select-all transition-colors"
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
                                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium break-all select-all transition-colors"
                                >
                                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                  {member.email}
                                </a>
                                {member.phone ? (
                                  <a 
                                    href={`tel:${member.phone}`} 
                                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium select-all transition-colors"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl text-center transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc({ isOpen: false, fileUrl: '', title: '' })}
        fileUrl={viewerDoc.fileUrl}
        title={viewerDoc.title}
      />
    </div>
  );
};

export default SupervisorTeams;
