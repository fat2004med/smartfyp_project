import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  X, 
  Users, 
  User, 
  Calendar, 
  Tag, 
  ExternalLink,
  BookOpen,
  Clock,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Mail,
  Phone,
  Download,
  Eye
} from 'lucide-react';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const AnimatedSelect = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const uniqueOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    const seen = new Set();
    return options.filter(opt => {
      const str = String(opt || '').trim();
      if (!str || seen.has(str)) return false;
      seen.add(str);
      return true;
    });
  }, [options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 relative ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white border rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none active:scale-[0.98] ${
            isOpen ? 'border-blue-500 ring-4 ring-blue-50 text-blue-600' : 'border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="truncate">{value}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronDown size={16} className={isOpen ? 'text-blue-500' : 'text-gray-400'} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95, transformOrigin: "top" }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 max-h-64 overflow-y-auto scrollbar-hide"
            >
              <div className="px-2 pb-1 mb-1 border-b border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Select {label}</p>
              </div>
              {uniqueOptions.map((option, idx) => (
                <button
                  key={`${label}-${option}-${idx}`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between group ${
                    String(value) === String(option) 
                      ? 'text-blue-600 font-bold bg-blue-50/50' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  {option}
                  {String(value) === String(option) && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 size={14} className="text-blue-500" />
                    </motion.div>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ProjectCard = ({ project, onViewDetails, index = 0 }) => {
  const getGradient = (title) => {
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-emerald-500 to-teal-700',
      'from-purple-600 to-indigo-800',
      'from-amber-500 to-orange-700',
      'from-rose-500 to-pink-700',
      'from-cyan-500 to-blue-700'
    ];
    const idx = (title?.length || 0) % gradients.length;
    return gradients[idx];
  };


  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: (index % 3) * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full"
    >
      <div className={`relative h-44 bg-gradient-to-br ${getGradient(project.title)} p-6 flex flex-col justify-between overflow-hidden`}>
        {/* Pattern overlap */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[10px] border-white ring-8 ring-white/20"></div>
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full border-[20px] border-white ring-12 ring-white/10"></div>
        </div>

        <div className="relative z-10 flex justify-between items-start">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-widest border border-white/30">
            {project.department?.name || 'General'}
          </span>
          <span className={`px-3 py-1 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-widest ${
            project.status === 'Completed' || project.status === 'Published' ? 'bg-green-500/30' : 'bg-amber-500/30'
          } border border-white/20`}>
            {project.status || 'Active'}
          </span>
        </div>

        <div className="relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 border border-white/30">
            <BookOpen size={20} className="text-white" />
          </div>
          <h3 className="text-white font-black text-xl leading-tight line-clamp-2 uppercase tracking-tight">
            {project.title}
          </h3>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
          {project.description || project.abstract}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies?.slice(0, 3).map((tech, i) => (
            <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100 uppercase tracking-tighter">
              {tech}
            </span>
          ))}
          {(project.technologies?.length || 0) > 3 && (
            <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-md border border-gray-100">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <div className="mb-2">
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider leading-none mb-0.5 block">Team ID</span>
              <p className="text-xs text-indigo-600 font-extrabold truncate">{project.teamName || 'FYP Team'}</p>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider leading-none mb-0.5 block">Supervisor</span>
              <p className="text-xs text-gray-800 font-bold truncate">{project.supervisor?.name || 'Academic Faculty'}</p>
            </div>
          </div>
          <button 
            onClick={() => onViewDetails(project)}
            className="w-10 h-10 bg-gray-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group/btn flex-shrink-0"
          >
            <ChevronRight size={18} className="group-hover/btn:scale-110" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ProjectModal = ({ project, onClose }) => {
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });
  if (!project) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col"
      >
        {/* Close Button - Fixed Visibility */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white shadow-lg border border-gray-100 hover:bg-gray-50 rounded-full text-gray-900 z-50 transition-all active:scale-95"
          title="Close Details"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto">
          {/* Hero Header Instead of Image */}
          <div className="relative pt-20 pb-12 px-8 sm:px-12 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px]"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-4 py-1.5 bg-blue-600/40 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-white/20">
                  {project.department?.name || (typeof project.department === 'string' ? project.department : 'N/A')}
                </span>
                <span className={`px-4 py-1.5 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-white/20 ${
                  project.status === 'Completed' || project.status === 'Published' ? 'bg-green-500/40' : 'bg-amber-500/40'
                }`}>
                  {project.status}
                </span>
                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-white/10">
                  Batch {project.year || project.academicYear}
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4 drop-shadow-xl max-w-3xl">
                {project.title}
              </h2>
              <div className="flex items-center gap-4 text-blue-100/80 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                  Final Year Exhibition Project
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-8">
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-600" />
                    Project Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-center justify-between text-sm border-b border-gray-100/50 pb-2">
                      <span className="text-gray-500 font-medium">Team ID:</span>
                      <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">{project.teamName || 'FYP Team'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-b border-gray-100/50 pb-2">
                      <span className="text-gray-500">Supervisor:</span>
                      <span className="font-bold text-gray-900">
                        {project.supervisor?.name || (typeof project.supervisor === 'string' ? project.supervisor : 'N/A')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-b border-gray-100/50 pb-2">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-bold text-gray-900">{project.duration || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-b border-gray-100/50 pb-2">
                      <span className="text-gray-500">Academic Grade:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-black text-sm shadow-sm">{project.grade || 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm sm:col-span-2 border-b border-gray-100/50 pb-2">
                      <span className="text-gray-500">Live Demo:</span>
                      {project.isLiveLinkPublic && project.liveLink ? (
                        <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg transition-all flex items-center gap-1">
                          Launch Project <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Private or N/A</span>
                      )}
                    </div>

                    {project.fileUrl && (
                      <div className="flex items-center justify-between text-sm sm:col-span-2 border-b border-gray-100/50 pb-2">
                        <span className="text-gray-500">Documentation / Proposal:</span>
                        <button
                          type="button"
                          onClick={() => triggerDirectDownload(project.fileUrl, `${project.title} (Documentation)`)}
                          className="font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                          title="Download document file"
                        >
                          <Download size={13} /> Download Original Doc
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Contacts Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Project Team & Contact Details
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Supervisor Contact Info */}
                    {project.supervisor && (
                      <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl border border-emerald-100 space-y-3">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Supervisor</p>
                        <div className="font-bold text-gray-900 text-sm">
                          {project.supervisor.name || (typeof project.supervisor === 'string' ? project.supervisor : 'Academic Supervisor')}
                        </div>
                        {typeof project.supervisor === 'object' && (project.supervisor.email || project.supervisor.phone) ? (
                          <div className="space-y-1.5 text-xs">
                            {project.supervisor.email && (
                              <a 
                                href={`mailto:${project.supervisor.email}`} 
                                className="flex items-center gap-2 text-gray-605 hover:text-indigo-600 font-medium break-all transition-colors"
                              >
                                <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                {project.supervisor.email}
                              </a>
                            )}
                            {project.supervisor.phone && (
                              <a 
                                href={`tel:${project.supervisor.phone}`} 
                                className="flex items-center gap-2 text-gray-605 hover:text-indigo-600 font-medium transition-colors"
                              >
                                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                {project.supervisor.phone}
                              </a>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Team Leader Contact Info */}
                    {project.teamLeader && (
                      <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl border border-indigo-100 space-y-3">
                        <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Team Leader</p>
                        <div className="font-bold text-gray-900 text-sm">
                          {project.teamLeader.name || (typeof project.teamLeader === 'string' ? project.teamLeader : 'Team Leader')}
                        </div>
                        {typeof project.teamLeader === 'object' && (project.teamLeader.email || project.teamLeader.phone) ? (
                          <div className="space-y-1.5 text-xs">
                            {project.teamLeader.email && (
                              <a 
                                href={`mailto:${project.teamLeader.email}`} 
                                className="flex items-center gap-2 text-gray-605 hover:text-indigo-600 font-medium break-all transition-colors"
                              >
                                <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                {project.teamLeader.email}
                              </a>
                            )}
                            {project.teamLeader.phone && (
                              <a 
                                href={`tel:${project.teamLeader.phone}`} 
                                className="flex items-center gap-2 text-gray-655 hover:text-indigo-600 font-medium transition-colors"
                              >
                                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                {project.teamLeader.phone}
                              </a>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Team Members Contact Info */}
                    {project.members && project.members.length > 0 && (
                      <div className="sm:col-span-2 space-y-2.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Team Members Contacts</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {project.members.map((member, i) => (
                            <div key={`member-contact-${i}`} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                              <div className="font-bold text-gray-900 text-sm">
                                {member.name || (typeof member === 'string' ? member : 'Team Member')}
                              </div>
                              {typeof member === 'object' && (member.email || member.phone) ? (
                                <div className="space-y-1.5 text-xs">
                                  {member.email && (
                                    <a 
                                      href={`mailto:${member.email}`} 
                                      className="flex items-center gap-2 text-gray-605 hover:text-indigo-600 font-medium break-all transition-colors"
                                    >
                                      <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                      {member.email}
                                    </a>
                                  )}
                                  {member.phone && (
                                    <a 
                                      href={`tel:${member.phone}`} 
                                      className="flex items-center gap-2 text-gray-655 hover:text-indigo-600 font-medium transition-colors"
                                    >
                                      <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                      {member.phone}
                                    </a>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Tag size={20} className="text-blue-600" />
                    Technologies Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl border border-blue-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter border-b-2 border-blue-600 w-fit pb-1">Project Abstract Summary</h4>
                  <div className="p-8 bg-blue-50/30 rounded-3xl border border-blue-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BookOpen size={48} className="text-blue-900" />
                    </div>
                    <p className="text-gray-750 text-gray-700 leading-relaxed italic text-base font-medium relative z-10">
                      &quot;{project.abstract || project.description}&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Sidebar Info - Sticky on Desktop */}
              <div className="space-y-6 lg:sticky lg:top-8 self-start">
                {/* Academic Context Block */}
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">
                    Academic Context
                  </h4>
                  <div className="space-y-3.5 text-sm text-gray-700">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">Department:</span>
                      <span className="font-bold text-gray-900 text-base leading-tight block">
                        {project.department?.name || (typeof project.department === 'string' ? project.department : 'N/A')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">Academic Year:</span>
                      <span className="font-bold text-gray-900 text-base block">
                        {project.academicYear || project.year || 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">Project Batch:</span>
                      <span className="font-bold text-gray-900 text-base block">
                        {project.batch || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl text-white shadow-2xl shadow-blue-200/50">
                  <h4 className="font-black text-xl mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <GraduationCap size={24} />
                    Verified Status
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <p className="text-blue-200 text-[10px] uppercase font-black tracking-[0.2em] mb-2 opacity-80">Department</p>
                      <p className="font-bold text-lg leading-tight">{project.department?.name || (typeof project.department === 'string' ? project.department : 'N/A')}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-[10px] uppercase font-black tracking-[0.2em] mb-2 opacity-80">Authentication</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 size={18} className="text-emerald-400" />
                        <p className="font-black text-sm uppercase">Faculty Verified</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Admin Verified Record</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold px-3 py-2 bg-white rounded-xl border border-gray-100">
                      <span className="text-gray-400">Published</span>
                      <span className="text-emerald-600">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc({ isOpen: false, fileUrl: '', title: '' })}
        fileUrl={viewerDoc.fileUrl}
        title={viewerDoc.title}
      />
    </motion.div>
  );
};

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedTech, setSelectedTech] = useState('All Technologies');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedProject, setSelectedProject] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);

  const [publicProjects, setPublicProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPublicProjects = async () => {
    try {
      const { data } = await axios.get('/api/projects/public');
      setPublicProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching public projects:', error);
      setPublicProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const { data } = await axios.get('/api/projects/public');
        if (isMounted) {
          setPublicProjects(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching public projects:', error);
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, []);

  const departments = useMemo(() => {
    const raw = publicProjects.map(p => p.department?.name).filter(Boolean);
    const unique = Array.from(new Set(raw.map(String)));
    return ["All Departments", ...unique];
  }, [publicProjects]);

  const technologies = useMemo(() => {
    const allTechs = publicProjects
      .filter(p => p.status === 'Completed' || p.status === 'Published')
      .flatMap(p => p.technologies || [])
      .filter(Boolean);
    const unique = Array.from(new Set(allTechs.map(String)));
    return ["All Technologies", ...unique];
  }, [publicProjects]);

  const years = useMemo(() => {
    const rawYears = publicProjects
      .map(p => (p.year != null ? String(p.year) : (p.academicYear != null ? String(p.academicYear) : '')))
      .filter(Boolean);
    const unique = Array.from(new Set(rawYears)).sort();
    return ["All Years", ...unique];
  }, [publicProjects]);

  const filteredProjects = useMemo(() => {
    return publicProjects.filter(project => {
      // Only completed or published projects will be shown in the gallery
      const isAvailable = project.status === 'Completed' || project.status === 'Published';
      if (!isAvailable) return false;

      const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (project.technologies && project.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesDept = selectedDept === 'All Departments' || project.department?.name === selectedDept;
      const matchesTech = selectedTech === 'All Technologies' || (project.technologies && project.technologies.some(t => t.toLowerCase() === selectedTech.toLowerCase()));
      const matchesYear = selectedYear === 'All Years' || String(project.year || project.academicYear) === selectedYear;

      return matchesSearch && matchesDept && matchesTech && matchesYear;
    });
  }, [publicProjects, searchQuery, selectedDept, selectedTech, selectedYear]);

  const displayedProjects = filteredProjects.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProjects.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-400 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
        </div>
        
        <div className="w-full max-w-[1700px] mx-auto px-4 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
          >
            Student Projects Gallery
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Explore innovative final year projects from talented students across all departments. 
            Search, filter, and discover groundbreaking work from our academic community.
          </motion.p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-12 bg-gray-50 border-b border-gray-100 shadow-sm">
        <div className="w-full max-w-[1700px] mx-auto px-4">
          <div className="flex flex-col gap-8">
            {/* Search Bar */}
            <div className="relative max-w-3xl mx-auto w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input 
                type="text" 
                placeholder="Search projects by title, description, team name, or technology..." 
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl shadow-xl shadow-blue-100/50 border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 text-lg transition-all"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              <AnimatedSelect 
                label="Department" 
                value={selectedDept} 
                options={departments} 
                onChange={setSelectedDept} 
              />
              <AnimatedSelect 
                label="Technology" 
                value={selectedTech} 
                options={technologies} 
                onChange={setSelectedTech} 
              />
              <AnimatedSelect 
                label="Academic Year" 
                value={selectedYear} 
                options={years} 
                onChange={setSelectedYear} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-white">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProjects.length} Projects Found
            </h2>
            <p className="text-sm text-gray-500">
              Showing results for your search criteria
            </p>
          </div>

          {displayedProjects.length > 0 ? (
            <>
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {displayedProjects.map((project, index) => (
                    <ProjectCard 
                      key={project._id} 
                      project={project} 
                      onViewDetails={setSelectedProject}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {hasMore && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-16 text-center"
                >
                  <button 
                    onClick={() => setVisibleCount(filteredProjects.length)}
                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2 mx-auto group"
                  >
                    View All Projects
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                <Search size={40} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
               <p className="text-gray-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
               <button 
                 onClick={() => {
                   setSearchQuery('');
                   setSelectedDept('All Departments');
                   setSelectedTech('All Technologies');
                   setSelectedYear('All Years');
                 }}
                 className="mt-6 text-blue-600 font-bold hover:underline"
               >
                 Clear all filters
               </button>
             </div>
          )}
        </div>
      </section>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
