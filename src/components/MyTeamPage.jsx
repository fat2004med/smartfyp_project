import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Code2, 
  Award, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Briefcase,
  GraduationCap,
  Edit2,
  Save,
  X,
  Sparkles,
  Download,
  Eye
} from 'lucide-react';
import DocumentViewerModal from './DocumentViewerModal';
import { triggerDirectDownload } from '../utils/fileHelpers';

const MyTeamPage = () => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [viewerDoc, setViewerDoc] = useState({ isOpen: false, fileUrl: '', title: '' });

  const isTeamLeader = 
    user?.role === 'Team Leader' || 
    user?.role?.toLowerCase() === 'team leader' ||
    (project?.teamLeader && (
      project.teamLeader === user?._id || 
      project.teamLeader?._id === user?._id || 
      String(project.teamLeader?._id || project.teamLeader) === String(user?._id)
    ));

  useEffect(() => {
    console.log('MyTeamPage component mounted/updated. User info:', user?.email, 'Role:', user?.role, 'isTeamLeader:', isTeamLeader);
  }, [user, project, isTeamLeader]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Forms state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    technologies: '',
    tags: '',
    githubLink: '',
    liveLink: '',
    fileUrl: '',
    description: '',
    outcomes: ''
  });

  useEffect(() => {
    let active = true;
    const loadProject = async () => {
      try {
        const { data } = await axios.get('/api/projects/my-project');
        if (active) {
          setProject(data);
          if (data) {
            setUpdateForm({
              technologies: data.technologies ? data.technologies.join(', ') : '',
              tags: data.tags ? data.tags.join(', ') : '',
              githubLink: data.githubLink || '',
              liveLink: data.liveLink || '',
              fileUrl: data.fileUrl || '',
              description: data.description || data.abstract || '',
              outcomes: data.outcomes || ''
            });
          }
        }
      } catch (err) {
        console.error('Error fetching my team project:', err);
        if (active) {
          setError(err.response?.data?.message || 'Failed to load your team and project details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProject();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const technologiesArray = updateForm.technologies
        ? updateForm.technologies.split(',').map(tech => tech.trim()).filter(Boolean)
        : [];
      const tagsArray = updateForm.tags
        ? updateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const payload = {
        description: updateForm.description,
        abstract: updateForm.description, // keep abstract in sync
        outcomes: updateForm.outcomes,
        githubLink: updateForm.githubLink,
        liveLink: updateForm.liveLink,
        fileUrl: updateForm.fileUrl,
        technologies: technologiesArray,
        tags: tagsArray
      };

      const { data } = await axios.put(`/api/projects/${project._id}`, payload);
      
      // Update local state with the fully populated project returned by the backend
      setProject(data);
      
      toast.success('Project details updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error(err.response?.data?.message || 'Failed to update project details.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      setSaving(true);
      await axios.put(`/api/projects/${project._id}/complete`);
      toast.success("Project submitted successfully! Status changed to Completed.");
      const { data } = await axios.get('/api/projects/my-project');
      setProject(data);
    } catch (err) {
      console.error('Error submitting project for completion:', err);
      toast.error(err.response?.data?.message || 'Failed to submit project.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-bold">Loading Your Team Space...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-[1700px] mx-auto p-6 pt-10">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-3xl flex items-start gap-4 max-w-2xl mx-auto shadow-sm">
          <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={24} />
          <div>
            <h3 className="font-extrabold text-lg">No Project and Team Registered</h3>
            <p className="text-sm mt-1 text-red-700 font-medium">
              {error || 'You are currently not assigned to any FYP project or team. Please contact your coordinator/department HOD to form or join a team.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getDynamicStatusAndPhase = () => {
    const status = project?.status || 'Proposed';
    const hasSubmissions = project?.finalDocumentations && project.finalDocumentations.length > 0;

    let displayStatus = 'Inactive';
    let statusColorClass = 'text-gray-500 font-extrabold';
    let dotClass = 'bg-gray-400';

    let displayPhase = 'Proposal';
    let phaseColorClass = 'text-gray-500 font-extrabold';

    if (status === 'Proposed' || status === 'Rejected') {
      displayStatus = 'Inactive';
      statusColorClass = 'text-rose-500 font-extrabold';
      dotClass = 'bg-rose-500 shadow-sm';
      displayPhase = 'Proposal';
      phaseColorClass = 'text-rose-500 font-extrabold';
    } else if (status === 'Completed') {
      displayStatus = 'Completed';
      statusColorClass = 'text-green-600 font-extrabold';
      dotClass = 'bg-green-500 animate-pulse border border-green-200';
      displayPhase = 'Completed (Final)';
      phaseColorClass = 'text-green-600 font-extrabold';
    } else if (status === 'Published') {
      displayStatus = 'Completed';
      statusColorClass = 'text-green-600 font-extrabold';
      dotClass = 'bg-green-500 animate-pulse border border-green-200';
      displayPhase = 'Published';
      phaseColorClass = 'text-green-600 font-extrabold';
    } else if (status === 'Active' || status === 'Approved') {
      displayStatus = 'Activated';
      statusColorClass = 'text-blue-600 font-extrabold';
      dotClass = 'bg-blue-500 animate-pulse';
      if (hasSubmissions) {
        displayPhase = 'In Progress';
        phaseColorClass = 'text-amber-500 font-extrabold';
      } else {
        displayPhase = 'Started';
        phaseColorClass = 'text-teal-500 font-extrabold';
      }
    }

    return { displayStatus, statusColorClass, dotClass, displayPhase, phaseColorClass };
  };

  const { displayStatus, statusColorClass, dotClass, displayPhase, phaseColorClass } = getDynamicStatusAndPhase();

  return (
    <div className="max-w-[1700px] mx-auto space-y-8 pb-12 px-6 md:px-8 pt-8 md:pt-10">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            {project.teamName || 'FYP Team'}
          </span>
          <h1 className="text-3xl font-black text-gray-900 mt-2 select-all">{project.title}</h1>
          <p className="text-gray-500 mt-1 font-medium">Detailed specifications, progress metrics, and coordinator/member details for your final year project.</p>
        </div>
        {isTeamLeader && (
          <div className="flex gap-2 flex-wrap shrink-0 self-start md:self-center">
            {(project.status === 'Active' || project.status === 'Approved') && (
              <>
                <button
                  onClick={handleMarkCompleted}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-605 hover:bg-green-700 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-100 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  Mark as Completed
                </button>
                <button
                  onClick={handleMarkCompleted}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-100 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  Complete & Submit Project
                </button>
              </>
            )}
            <button
              onClick={() => setIsEditing(true)}
              id="edit-project-btn"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-150"
            >
              <Edit2 size={16} />
              Edit Info
            </button>
          </div>
        )}
      </div>

      {/* Visual Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-2 w-full">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Team Progress</p>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-blue-600 break-all">{project.progress}% Done</p>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
        <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-1 w-full">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Project Status</p>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2 flex-wrap break-words">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
            <span className={`break-all ${statusColorClass}`}>{displayStatus}</span>
          </p>
        </div>
        <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-1 w-full">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Active Phase</p>
          <p className={`text-lg sm:text-xl md:text-2xl font-black break-words ${phaseColorClass}`}>
            {displayPhase}
          </p>
        </div>
        <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-1 w-full">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest break-words">Batch</p>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-indigo-600 break-all">{project.batch || 'N/A'}</p>
        </div>
      </div>

      {/* Main Grid Content split (2/3 Details, 1/3 People Context) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (Deliverables, Specifications, Technologies) */}
        <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          {/* Abstract / Description */}
          <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-blue-600" /> Abstract & Description
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed font-semibold bg-gray-50/50 p-5 rounded-2xl border border-gray-50 whitespace-pre-line">
              {project.description || project.abstract || 'No abstract or core description provided yet.'}
            </p>
          </div>

          {/* Outcomes */}
          <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" /> Key Outcomes & Deliverables
            </h4>
            <p className="text-sm text-gray-650 leading-relaxed font-semibold p-5 bg-gray-50/55 rounded-2xl border border-gray-50 whitespace-pre-line">
              {project.outcomes || 'No outcomes or deliverables specifications added yet.'}
            </p>
          </div>

          {/* Tech & Tags bento block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Code2 size={16} className="text-indigo-600" /> Core Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies && project.technologies.length > 0 ? (
                  project.technologies.map((tech, i) => (
                    <span key={`tech-${i}`} className="text-xs font-bold text-gray-700 bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-200">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No technologies added to project</span>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Award size={16} className="text-amber-500" /> Program Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tags && project.tags.length > 0 ? (
                  project.tags.map((tag, i) => (
                    <span key={`tag-${i}`} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No tags associated</span>
                )}
              </div>
            </div>
          </div>

          {/* Links & Repository Assets */}
          <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">FYP Integration Links & Artifacts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {project.githubLink ? (
                <a 
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all text-xs font-bold text-slate-800 shadow-xs"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={14} className="text-slate-500" />
                </a>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl text-center text-xs font-medium italic">
                  No GitHub Link Configured
                </div>
              )}

              {project.liveLink ? (
                <a 
                  href={project.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-all text-xs font-bold text-indigo-700 shadow-xs"
                >
                  <span>Live Project Workspace</span>
                  <ExternalLink size={14} className="text-indigo-500" />
                </a>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl text-center text-xs font-medium italic">
                  No Deployment Link Registered
                </div>
              )}

              {project.fileUrl ? (
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(project.fileUrl, `${project.title} (Proposal Document)`)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all text-xs font-bold text-white shadow-xs cursor-pointer"
                  title="Download Original Proposal Document"
                >
                  <Download size={15} />
                  <span>Download Proposal Doc</span>
                </button>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl text-center text-xs font-medium italic">
                  No Proposal File Submitted
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column (Supervisor, Leader, and Members Detail Block) */}
        <div className="space-y-8">
          
          {/* Department Academic Context */}
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-150 space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap size={14} className="text-gray-500" /> Department Info
            </h4>
            <div className="space-y-2 text-xs text-gray-700 font-semibold h-fit">
              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500">Department:</span>
                <span className="text-gray-800">{project.department?.name || 'Computer Science'}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-500">Academic Season:</span>
                <span className="text-gray-800">{project.academicYear || new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Supervisor Card (Prominent & Crucial) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={16} className="text-emerald-600" /> Project Supervisor
            </h4>
            {project.supervisor ? (
              <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-green-50/50 border border-emerald-100 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200">
                    {project.supervisor.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-900 text-sm">{project.supervisor.name}</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Project Supervisor Coordinator</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-100/50 space-y-2 text-xs">
                  <a 
                    href={`mailto:${project.supervisor.email}`} 
                    className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold break-all select-all transition-colors"
                  >
                    <Mail size={15} className="text-emerald-500 flex-shrink-0" />
                    {project.supervisor.email}
                  </a>
                  {project.supervisor.phone ? (
                    <a 
                      href={`tel:${project.supervisor.phone}`} 
                      className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-bold select-all transition-colors"
                    >
                      <Phone size={15} className="text-emerald-500 flex-shrink-0" />
                      {project.supervisor.phone}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 font-bold italic">
                      <Phone size={15} className="text-emerald-300 flex-shrink-0" />
                      No mobile listed
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-2xl border border-gray-100/60 text-center">No assigned project supervisor yet.</p>
            )}
          </div>

          {/* Team Leader Contact Block */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-blue-600" /> Team Leader
            </h4>
            {project.teamLeader ? (
              <div className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-3xl border border-blue-100/80 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
                    {project.teamLeader.name?.charAt(0) || 'L'}
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-900 text-sm">{project.teamLeader.name}</div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Main Point-of-Contact</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-100/50 space-y-2 text-xs">
                  <a 
                    href={`mailto:${project.teamLeader.email}`} 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-700 font-bold break-all select-all transition-colors"
                  >
                    <Mail size={15} className="text-blue-500 flex-shrink-0" />
                    {project.teamLeader.email}
                  </a>
                  {project.teamLeader.phone ? (
                    <a 
                      href={`tel:${project.teamLeader.phone}`} 
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-700 font-bold select-all transition-colors"
                    >
                      <Phone size={15} className="text-blue-500 flex-shrink-0" />
                      {project.teamLeader.phone}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 font-bold italic">
                      <Phone size={15} className="text-blue-300 flex-shrink-0" />
                      No contact phone listed
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-2xl border border-gray-100/60 text-center">No assigned leader</p>
            )}
          </div>

          {/* Team Members List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={16} className="text-indigo-600" /> Team Members ({project.members?.length || 0})
            </h4>
            <div className="space-y-4">
              {project.members && project.members.length > 0 ? (
                project.members.map((member, i) => (
                  <div key={`tm-member-card-${i}`} className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-inner">
                        {member.name?.charAt(0) || 'M'}
                      </div>
                      <div className="font-extrabold text-gray-900 text-sm">{member.name}</div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-50 space-y-2 text-xs">
                      <a 
                        href={`mailto:${member.email}`} 
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-650 font-bold break-all select-all transition-colors"
                      >
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        {member.email}
                      </a>
                      {member.phone ? (
                        <a 
                          href={`tel:${member.phone}`} 
                          className="flex items-center gap-2 text-gray-600 hover:text-blue-650 font-bold select-all transition-colors"
                        >
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          {member.phone}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 font-semibold italic">
                          <Phone size={14} className="text-gray-300 flex-shrink-0" />
                          No phone number
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-2xl border border-gray-100/60 text-center">No other crew members enrolled.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Editing Modal Dialog */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-150"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">Edit Project Workspace</h3>
                    <p className="text-xs text-gray-400 font-semibold">Update details visible across all team & supervisor dashboards.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                
                {/* Abstract Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block">Project Abstract & Description</label>
                  <textarea
                    value={updateForm.description || ''}
                    onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                    className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-4 min-h-[100px]"
                    placeholder="Enter short abstract or specifications about your project..."
                    required
                  />
                </div>

                {/* Outcomes Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-550 uppercase tracking-widest block">Deliverables & Outcomes</label>
                  <textarea
                    value={updateForm.outcomes || ''}
                    onChange={(e) => setUpdateForm({ ...updateForm, outcomes: e.target.value })}
                    className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-4 min-h-[80px]"
                    placeholder="Enter key deliverables or targets..."
                  />
                </div>

                {/* Tech & Tags side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-550 uppercase tracking-widest block">Technologies (Comma separated)</label>
                    <input
                      type="text"
                      value={updateForm.technologies || ''}
                      onChange={(e) => setUpdateForm({ ...updateForm, technologies: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-3.5"
                      placeholder="React, Node.js, TensorFlow"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-550 uppercase tracking-widest block">Program Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={updateForm.tags || ''}
                      onChange={(e) => setUpdateForm({ ...updateForm, tags: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-3.5"
                      placeholder="FYP-1, Web, AI"
                    />
                  </div>
                </div>

                {/* Links URL inputs */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Repository & Deliverable Links</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-550 uppercase tracking-widest block">GitHub Repository URL</label>
                    <input
                      type="url"
                      value={updateForm.githubLink || ''}
                      onChange={(e) => setUpdateForm({ ...updateForm, githubLink: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-3.5"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-550 uppercase tracking-widest block">Live Demo / Deployment link</label>
                    <input
                      type="url"
                      value={updateForm.liveLink || ''}
                      onChange={(e) => setUpdateForm({ ...updateForm, liveLink: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-3.5"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-550 uppercase tracking-widest block">Latest Document Link File (Latest PDF Proposal)</label>
                    <input
                      type="url"
                      value={updateForm.fileUrl || ''}
                      onChange={(e) => setUpdateForm({ ...updateForm, fileUrl: e.target.value })}
                      className="w-full text-sm font-semibold text-gray-705 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 transition-colors p-3.5"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>

                <div className="h-4"></div>
              </form>

              {/* Sticky bottom Action Bar */}
              <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-750 rounded-xl font-bold text-sm transition-all"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all shadow-blue-150"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
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

export default MyTeamPage;
