import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { 
  Users, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Search, 
  Filter, 
  ChevronRight,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  Loader2
} from 'lucide-react';

const TeamMembersList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For simplicity, we fetch projects the user is involved in and get members
      // The dashboard controllers already return some of this, but let's try a direct approach
      const { data } = await axios.get('/api/projects');
      
      // Flatten all members from all projects user is in
      const allMembers = [];
      const memberIds = new Set();
      
      data.forEach(proj => {
        proj.members?.forEach(m => {
          if (!memberIds.has(m._id)) {
            memberIds.add(m._id);
            allMembers.push({
              ...m,
              role: m.role || 'Member',
              email: m.email,
              phone: m.phone || 'N/A',
              tasksCompleted: 0, // Mock for now or calculated later
              totalTasks: 0,
              status: 'Active',
              lastActive: 'Recently'
            });
          }
        });
        if (proj.teamLeader && !memberIds.has(proj.teamLeader._id)) {
            memberIds.add(proj.teamLeader._id);
             allMembers.push({
              ...proj.teamLeader,
              role: 'Team Leader',
              email: proj.teamLeader.email,
              phone: proj.teamLeader.phone || 'N/A',
              tasksCompleted: 0,
              totalTasks: 0,
              status: 'Active',
              lastActive: 'Recently'
            });
        }
      });
      
      setMembers(allMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchMembers();
    };
    init();
  }, [fetchMembers]);

  const filteredMembers = members.filter(member => 
    (member.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (member.role?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1700px] mx-auto space-y-8 pb-12">
      {/* Error Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[200] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <X size={20} className="cursor-pointer" onClick={() => setError(null)} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage your team members and track their individual progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <MessageSquare size={18} />
            Group Chat
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or role..."
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

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="font-bold">Loading Team Members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No team members found</p>
          </div>
        ) : (
          filteredMembers.map((member, idx) => (
            <motion.div
              layout
              key={`member-card-${member._id || 'none'}-${idx}`}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-6 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner">
                      {typeof member.name === 'string' ? member.name.charAt(0) : 'U'}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      member.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {typeof member.name === 'string' ? member.name : 'Unknown User'}
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      {typeof member.role === 'string' ? member.role : 'Member'}
                    </p>
                  </div>
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Mail size={18} className="text-blue-500" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                    <p className="text-xs font-bold text-gray-700 truncate">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Phone size={18} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                    <p className="text-xs font-bold text-gray-700">{member.phone}</p>
                  </div>
                </div>
              </div>
  
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                  <Clock size={14} />
                  Active {member.lastActive}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamMembersList;
