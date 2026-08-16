import User from "../models/User.js";
import Department from "../models/Department.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Submission from "../models/Submission.js";
import Announcement from "../models/Announcement.js";
import Assignment from "../models/Assignment.js";
import Feedback from "../models/Feedback.js";
import SystemLog from "../models/SystemLog.js";
import { isUserScheduledForAssignment } from "./assignmentController.js";

const formatRelativeTime = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (isNaN(date.getTime())) return "Unknown time";
  if (diffSecs < 5) return "Just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDepts = await Department.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalAnnouncements = await Announcement.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt");

    // Dynamic Approved Projects
    const approvedProjects = await Project.countDocuments({ status: { $in: ["Approved", "Completed", "Published"] } });

    // Dynamic Recent Projects
    const dbRecentProjects = await Project.find()
      .populate('department')
      .populate('teamLeader')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentProjects = dbRecentProjects.map(proj => ({
      _id: proj._id,
      name: proj.title,
      dept: proj.department?.name || 'Unassigned',
      team: proj.teamName || (proj.teamLeader ? `${proj.teamLeader.name}'s Team` : 'No Team'),
      status: proj.status
    }));

    // Dynamic Department Overview
    const departments = await Department.find();
    const departmentOverview = await Promise.all(
      departments.map(async (dept) => {
        const projectsCount = await Project.countDocuments({ department: dept._id });
        const teamsCount = await Project.countDocuments({ department: dept._id, teamLeader: { $ne: null } });
        return {
          name: dept.name,
          projects: projectsCount,
          teams: teamsCount
        };
      })
    );

    // Dynamic Recent Activities (submissions, announcements, system logs)
    const recentSubmissions = await Submission.find()
      .populate('project')
      .populate('submittedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(40);

    const recentAnns = await Announcement.find()
      .populate('author', 'name role')
      .sort({ createdAt: -1 })
      .limit(40);

    const recentLogs = await SystemLog.find()
      .sort({ createdAt: -1 })
      .limit(40);

    const mergedActivities = [];
    
    recentSubmissions.forEach(sub => {
      mergedActivities.push({
        id: `sub-${sub._id}`,
        type: 'submission',
        action: `Submitted: ${sub.title || 'Document'}`,
        user: sub.submittedBy?.name || 'Student',
        role: sub.submittedBy?.role || 'Team Member',
        createdAt: sub.createdAt
      });
    });

    recentAnns.forEach(ann => {
      mergedActivities.push({
        id: `ann-${ann._id}`,
        type: 'announcement',
        action: `Announced: ${ann.title}`,
        user: ann.author?.name || 'Admin/HOD',
        role: ann.author?.role || 'Admin',
        createdAt: ann.createdAt
      });
    });

    recentLogs.forEach(log => {
      let iconType = 'log';
      if (log.level === 'Error') iconType = 'error';
      else if (log.level === 'Warning') iconType = 'warning';

      // Clean default IP description from user
      const userLabel = log.user === 'System' ? 'System Portal' : log.user;

      mergedActivities.push({
        id: `log-${log._id}`,
        type: iconType,
        action: `${log.event}: ${log.details}`,
        user: userLabel,
        role: 'System/Admin',
        createdAt: log.createdAt
      });
    });

    // Sort descending by actual creation time
    mergedActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Format relative time strings and slice a larger window to support front-end Show More load triggers
    const recentActivity = mergedActivities.slice(0, 100).map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      user: activity.user,
      role: activity.role,
      time: formatRelativeTime(activity.createdAt)
    }));

    // Dynamic Recent Assignments
    const dbRecentAssignments = await Assignment.find()
      .populate('creator', 'name role')
      .sort({ createdAt: -1 })
      .limit(3);

    const recentAssignments = dbRecentAssignments.map(assign => ({
      id: assign._id,
      title: assign.title,
      deadline: new Date(assign.endDate).toLocaleDateString(),
      status: new Date() > new Date(assign.endDate) ? 'Expired' : 'Active'
    }));

    // Dynamic Growth Analytics
    const growthAnalytics = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const projectsCount = await Project.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      growthAnalytics.push({
        month: months[d.getMonth()],
        projects: projectsCount
      });
    }

    res.json({
      totalUsers,
      totalDepts,
      totalProjects,
      totalAnnouncements,
      approvedProjects,
      recentUsers,
      recentProjects,
      departmentOverview,
      recentActivity,
      recentAssignments,
      growthAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHODStats = async (req, res) => {
  try {
    let deptId = req.user.department?._id || req.user.department;
    if (!deptId) {
      const dept = await Department.findOne({ hod: req.user._id });
      if (dept) deptId = dept._id;
    }
    
    if (!deptId) {
      return res.json({
        departmentName: "Department",
        totalStudents: 0,
        totalSupervisors: 0,
        supervisors: 0,
        totalProjects: 0,
        completedProjects: 0,
        pendingProposals: 0,
        pendingApprovals: 0,
        activeTeams: 0,
        supervisorStats: [],
        recentAssignments: [],
        performanceTrend: [
          { name: 'Mon', performance: 0 },
          { name: 'Tue', performance: 0 },
          { name: 'Wed', performance: 0 },
          { name: 'Thu', performance: 0 },
          { name: 'Fri', performance: 0 },
        ],
        taskPriorityDistribution: [
          { name: 'High', value: 0 },
          { name: 'Medium', value: 0 },
          { name: 'Low', value: 0 }
        ]
      });
    }

    const departmentDetails = await Department.findById(deptId);
    const departmentName = departmentDetails ? departmentDetails.name : "Department";

    const totalStudents = await User.countDocuments({ department: deptId, role: { $in: ["Team Leader", "Team Member"] } });
    const totalSupervisors = await User.countDocuments({ department: deptId, role: { $in: ["Supervisor", "HOD", "HOD, Supervisor"] } });
    const deptProjects = await Project.countDocuments({ department: deptId });
    const pendingProposals = await Project.countDocuments({ department: deptId, status: "Proposed" });
    
    // Realistic live pending approvals awaiting HOD action
    const pendingApprovals = await Project.countDocuments({
      department: deptId,
      status: "Completed",
      isApprovedBySupervisor: true,
      isApprovedByHOD: false
    });
    
    // Count projects in active/approved stages
    const activeTeams = await Project.countDocuments({ 
      department: deptId, 
      status: { $in: ["Approved", "In Progress", "Active"] } 
    });

    const completedProjects = await Project.countDocuments({
      department: deptId,
      status: { $in: ["Completed", "Published"] }
    });

    const deptProjectIds = await Project.find({ department: deptId }).distinct("_id");
    
    // Calculate actual task priority distribution for the department
    const highAndCriticalTasks = await Task.countDocuments({
      project: { $in: deptProjectIds },
      priority: { $in: ["High", "Critical"] }
    });
    const mediumTasks = await Task.countDocuments({
      project: { $in: deptProjectIds },
      priority: "Medium"
    });
    const lowTasks = await Task.countDocuments({
      project: { $in: deptProjectIds },
      priority: "Low"
    });

    const taskPriorityDistribution = [
      { name: "High", value: highAndCriticalTasks || 1 },
      { name: "Medium", value: mediumTasks || 1 },
      { name: "Low", value: lowTasks || 1 }
    ];

    // Get all supervisors in this department
    const supervisorsList = await User.find({ department: deptId, role: { $in: ["Supervisor", "HOD", "HOD, Supervisor"] } }).select("name email phone interests");
    
    const supervisorStats = await Promise.all(
      supervisorsList.map(async (sup) => {
        const groupsCount = await Project.countDocuments({ supervisor: sup._id });
        
        // Calculate dynamic supervisor inputs to reflect real-time active contributions
        const feedbackCount = await Feedback.countDocuments({ author: sup._id });
        const assignmentsCreated = await Assignment.countDocuments({ creator: sup._id });
        const tasksAssignedCount = await Task.countDocuments({ assignedBy: sup._id });
        const announcementsCount = await Announcement.countDocuments({ author: sup._id });
        
        // Base score for the supervisor being active inside the system
        let activityPoints = 25; 
        activityPoints += feedbackCount * 12;      // +12 for each feedback given
        activityPoints += assignmentsCreated * 15; // +15 for each assignment created
        activityPoints += tasksAssignedCount * 8;   // +8 for each task assigned
        activityPoints += announcementsCount * 10; // +10 for each announcement made
        
        const rawActivityProgress = Math.min(95, activityPoints);
        
        let performance;
        const supervisorProjList = await Project.find({ supervisor: sup._id });
        if (supervisorProjList.length > 0) {
          let totalProjProgress = 0;
          for (const p of supervisorProjList) {
            const totalTasks = await Task.countDocuments({ project: p._id });
            const completedTasks = await Task.countDocuments({ project: p._id, status: "Completed" });
            
            let computedProg;
            if (p.status === "Completed" || p.status === "Published") {
              computedProg = 100;
            } else if (totalTasks > 0) {
              computedProg = Math.round((completedTasks / totalTasks) * 100);
            } else {
              switch (p.currentPhase) {
                case "Proposal":
                  computedProg = p.status === "Proposed" ? 15 : 25;
                  break;
                case "Analysis":
                  computedProg = 45;
                  break;
                case "Design":
                  computedProg = 65;
                  break;
                case "Implementation":
                  computedProg = 85;
                  break;
                case "Final":
                  computedProg = 95;
                  break;
                default:
                  computedProg = p.progress || 20;
              }
            }
            if (p.progress !== computedProg) {
              p.progress = computedProg;
              await p.save();
            }
            totalProjProgress += computedProg;
          }
          const completedCount = supervisorProjList.filter(p => p.status === "Completed" || p.status === "Published").length;
          if (completedCount === supervisorProjList.length) {
            performance = 100;
          } else {
            const avgProjectProgress = Math.round(totalProjProgress / supervisorProjList.length);
            performance = avgProjectProgress;
          }
        } else {
          performance = 0;
        }
        
        performance = Math.max(0, Math.min(100, performance));
        
        return {
          _id: sup._id,
          name: sup.name,
          email: sup.email,
          phone: sup.phone || "",
          interests: sup.interests ? (Array.isArray(sup.interests) ? sup.interests.join(", ") : sup.interests) : "",
          groups: groupsCount,
          performance
        };
      })
    );

    // Fetch up to 5 recent assignments created in this department
    const deptUserIds = await User.find({ department: deptId }).distinct("_id");
    const recentAssignmentsList = await Assignment.find({ creator: { $in: deptUserIds } })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentAssignments = recentAssignmentsList.map(assign => ({
      id: assign._id,
      title: assign.title,
      target: assign.targetRoles?.join(', ') || 'All',
      deadline: new Date(assign.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }));

    // Calculate a dynamic department submissions velocity trend based on real submission timestamps or weekly task activity
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const performanceTrend = [];
    const now = new Date();
    
    // Create trend counts for the last 5 days
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const deptProjectsList = await Project.find({ department: deptId }).distinct("_id");
      
      const completedTasksCount = await Task.countDocuments({
        project: { $in: deptProjectsList },
        status: "Completed",
        updatedAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const submissionsCount = await Submission.countDocuments({
        project: { $in: deptProjectsList },
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      // Calculate a live performance velocity score
      const score = (completedTasksCount * 15) + (submissionsCount * 25);
      const baseline = Math.min(25, Math.max(10, deptProjectsList.length * 8));
      
      performanceTrend.push({
        name: daysOfWeek[startOfDay.getDay()],
        performance: score > 0 ? score : baseline
      });
    }

    res.json({
      departmentName,
      totalStudents,
      totalSupervisors,
      supervisors: totalSupervisors,
      totalProjects: deptProjects,
      completedProjects,
      pendingProposals,
      pendingApprovals,
      activeTeams,
      supervisorStats,
      recentAssignments,
      performanceTrend,
      taskPriorityDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupervisorStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all projects assigned to this supervisor
    const projects = await Project.find({ supervisor: userId }).populate("department");
    const totalGroups = projects.length;

    // Projects IDs
    const projectIds = projects.map(p => p._id);

    // Count pending supervisor reviews
    const pendingReviewsCount = await Submission.countDocuments({ 
      project: { $in: projectIds },
      status: "Pending Supervisor" 
    });

    // Fetch the detailed pending review submissions
    const submissions = await Submission.find({
      project: { $in: projectIds },
      status: "Pending Supervisor"
    }).populate("project");

    const reviews = submissions.map(sub => ({
      id: sub._id,
      doc: sub.title || `${sub.phase} Document`,
      group: sub.project?.title || "Unknown Group",
      submitted: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Recently",
      priority: "High"
    }));

    // Calculate group progress dynamically
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];
    const groupProgress = await Promise.all(projects.map(async (p, idx) => {
      const totalTasks = await Task.countDocuments({ project: p._id });
      const completedTasks = await Task.countDocuments({ project: p._id, status: "Completed" });
      
      let computedProg;
      if (p.status === "Completed" || p.status === "Published") {
        computedProg = 100;
      } else if (totalTasks > 0) {
        computedProg = Math.round((completedTasks / totalTasks) * 100);
      } else {
        switch (p.currentPhase) {
          case "Proposal":
            computedProg = p.status === "Proposed" ? 10 : 20;
            break;
          case "Analysis":
            computedProg = 40;
            break;
          case "Design":
            computedProg = 60;
            break;
          case "Implementation":
            computedProg = 80;
            break;
          case "Final":
            computedProg = 95;
            break;
          default:
            computedProg = p.progress || 15;
        }
      }

      if (p.progress !== computedProg) {
        p.progress = computedProg;
        await p.save();
      }

      return {
        _id: p._id,
        name: p.title,
        progress: computedProg,
        color: colors[idx % colors.length]
      };
    }));

    // Compute comparative week-by-week submission trends
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    const w4Count = await Submission.countDocuments({ project: { $in: projectIds }, createdAt: { $gte: oneWeekAgo } });
    const w3Count = await Submission.countDocuments({ project: { $in: projectIds }, createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } });
    const w2Count = await Submission.countDocuments({ project: { $in: projectIds }, createdAt: { $gte: threeWeeksAgo, $lt: twoWeeksAgo } });
    const w1Count = await Submission.countDocuments({ project: { $in: projectIds }, createdAt: { $lt: threeWeeksAgo } });

    const monthlyTrend = [
      { month: 'Week 1', activity: 20 + w1Count * 15 },
      { month: 'Week 2', activity: 40 + w2Count * 15 },
      { month: 'Week 3', activity: 30 + w3Count * 15 },
      { month: 'Week 4', activity: 50 + w4Count * 25 },
    ];

    // Real-time task, student and completed project counters for supervisor
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
    const completedTasks = await Task.countDocuments({ project: { $in: projectIds }, status: "Completed" });

    const studentIds = new Set();
    projects.forEach(p => {
      if (p.teamLeader) studentIds.add(p.teamLeader.toString());
      if (p.members && p.members.length > 0) {
        p.members.forEach(m => studentIds.add(m.toString()));
      }
    });
    const totalStudents = studentIds.size;

    const completedProjectsCount = await Project.countDocuments({
      supervisor: userId,
      status: { $in: ["Published", "Completed"] }
    });

    res.json({
      totalGroups,
      pendingReviews: pendingReviewsCount,
      completedProjects: completedProjectsCount,
      totalStudents,
      totalTasks,
      completedTasks,
      reviews,
      groupProgress,
      monthlyTrend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamLeaderStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const project = await Project.findOne({ teamLeader: userId });
    if (!project) return res.json({ projectStatus: "None", tasksCompleted: 0, pendingSubmissions: 0 });

    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({ project: project._id, status: "Completed" });
    const pendingSubmissions = await Submission.countDocuments({ project: project._id, status: "Pending TL" });

    res.json({
      projectStatus: project.status,
      totalTasks,
      completedTasks,
      pendingSubmissions,
      projectTitle: project.title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamMemberStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const myTasks = await Task.countDocuments({ assignee: userId });
    const completedTasks = await Task.countDocuments({ assignee: userId, status: "Completed" });
    const pendingTasks = await Task.countDocuments({ assignee: userId, status: { $ne: "Completed" } });

    res.json({
      myTasks,
      completedTasks,
      pendingTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  const role = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
  switch (role) {
    case "Admin": return getAdminStats(req, res);
    case "HOD": return getHODStats(req, res);
    case "Supervisor": return getSupervisorStats(req, res);
    case "Team Leader": return getTeamLeaderStats(req, res);
    case "Team Member": return getTeamMemberStats(req, res);
    default:
      if (role.includes("HOD")) return getHODStats(req, res);
      if (role.includes("Supervisor")) return getSupervisorStats(req, res);
      res.status(400).json({ message: "Invalid role" });
  }
};

export const getTeamStats = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check both members and teamLeader fields
    const project = await Project.findOne({ 
      $or: [{ members: userId }, { teamLeader: userId }] 
    }).populate('supervisor teamLeader members');
    
    if (!project) {
      return res.json({
        projectTitle: "None",
        totalTasks: 0,
        completedTasks: 0,
        submissions: [],
        recentTasks: [],
        teamPerformance: [
          { day: 'W1', tasks: 0 },
          { day: 'W2', tasks: 0 },
          { day: 'W3', tasks: 0 },
          { day: 'W4', tasks: 0 },
          { day: 'W5', tasks: 0 },
        ],
        pendingAssignments: [],
        recentFeedbacks: [],
        teamMembers: [],
        teamMembersCount: 0
      });
    }

    // Calculate overall project progress in real-time
    const overallTotalTasks = await Task.countDocuments({ project: project._id });
    const overallCompletedTasks = await Task.countDocuments({ project: project._id, status: "Completed" });
    
    let computedProg = 0;
    if (project.status === "Completed" || project.status === "Published") {
      computedProg = 100;
    } else if (overallTotalTasks > 0) {
      computedProg = Math.round((overallCompletedTasks / overallTotalTasks) * 100);
    } else {
      switch (project.currentPhase) {
        case "Proposal":
          computedProg = project.status === "Proposed" ? 10 : 20;
          break;
        case "Analysis":
          computedProg = 40;
          break;
        case "Design":
          computedProg = 60;
          break;
        case "Implementation":
          computedProg = 80;
          break;
        case "Final":
          computedProg = 95;
          break;
        default:
          computedProg = project.progress || 15;
      }
    }

    if (project.progress !== computedProg) {
      project.progress = computedProg;
      await project.save();
    }

    const isLeader = req.user.role === 'Team Leader';

    const totalTasks = isLeader 
      ? await Task.countDocuments({ project: project._id })
      : await Task.countDocuments({ project: project._id, assignee: userId });
    
    const completedTasks = isLeader
      ? await Task.countDocuments({ project: project._id, status: "Completed" })
      : await Task.countDocuments({ project: project._id, status: { $in: ["Completed", "Reviewing"] }, assignee: userId });

    const submissions = isLeader
      ? await Submission.find({ project: project._id })
          .populate("submittedBy", "name")
          .populate({
            path: "feedbacks",
            populate: { path: "author", select: "name role" }
          })
          .sort({ createdAt: -1 })
      : await Submission.find({ project: project._id, submittedBy: userId })
          .populate("submittedBy", "name")
          .populate({
            path: "feedbacks",
            populate: { path: "author", select: "name role" }
          })
          .sort({ createdAt: -1 });

    const recentTasks = isLeader
      ? await Task.find({ project: project._id }).sort({ createdAt: -1 }).limit(5)
      : await Task.find({ project: project._id, assignee: userId }).sort({ createdAt: -1 }).limit(5);

    // Calculate actual team members count including team leader
    // Using a Set to avoid duplicates if TL is also in members array
    const memberIds = new Set();
    if (project.teamLeader) memberIds.add(project.teamLeader._id.toString());
    project.members.forEach(m => memberIds.add(m._id.toString()));
    const teamMembersCount = memberIds.size;

    // Real-time weekly progress for the specific user/team
    const completedTasksList = isLeader
      ? await Task.find({ project: project._id, status: "Completed" })
      : await Task.find({ assignee: userId, status: { $in: ["Completed", "Reviewing"] } });

    const now = new Date();
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0;
    completedTasksList.forEach(t => {
      const date = t.updatedAt || t.createdAt || now;
      const diffDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) w5++;
      else if (diffDays <= 14) w4++;
      else if (diffDays <= 21) w3++;
      else if (diffDays <= 28) w2++;
      else w1++;
    });

    const teamPerformance = [
      { day: 'W1', name: 'Week 1', tasks: w1, progress: w1 },
      { day: 'W2', name: 'Week 2', tasks: w2, progress: w2 },
      { day: 'W3', name: 'Week 3', tasks: w3, progress: w3 },
      { day: 'W4', name: 'Week 4', tasks: w4, progress: w4 },
      { day: 'W5', name: 'Week 5', tasks: w5, progress: w5 },
    ];

    // Fetch assignments for this user's role created after they registered
    const activeRoleForAssign = req.activeRole || (req.user?.role ? req.user.role.split(',')[0].trim() : '');
    const rawAssignments = await Assignment.find({ 
      targetRoles: activeRoleForAssign,
      "submissions.student": { $ne: userId },
      createdAt: { $gte: req.user.createdAt }
    }).populate('creator', 'name role department');

    const userProjectsForFilter = await Project.find({
      $or: [
        { supervisor: userId },
        { teamLeader: userId },
        { members: userId }
      ]
    });

    const pendingAssignmentsList = [];
    for (const assignment of rawAssignments) {
      if (assignment.creator && await isUserScheduledForAssignment(assignment, req.user, userProjectsForFilter, activeRoleForAssign)) {
        pendingAssignmentsList.push(assignment);
      }
    }
    const pendingAssignments = pendingAssignmentsList.slice(0, 3);

    // Fetch feedbacks related to project submissions
    const submissionIds = isLeader
      ? await Submission.find({ project: project._id }).distinct('_id')
      : await Submission.find({ project: project._id, submittedBy: userId }).distinct('_id');
    
    const recentFeedbacks = await Feedback.find({ submission: { $in: submissionIds } })
      .populate('author', 'name role')
      .sort({ createdAt: -1 })
      .limit(3);

    const teamMembers = project.members.map(m => ({
      id: m._id,
      name: m.name,
      role: m.role,
      tasks: 0, // Placeholder, will calculate below
      completed: 0,
      status: 'Active'
    }));

    // Calculate tasks per member
    const memberTasks = await Task.find({ project: project._id });
    teamMembers.forEach(member => {
      const tasks = memberTasks.filter(t => t.assignee?.toString() === member.id.toString());
      member.tasks = tasks.length;
      member.completed = tasks.filter(t => t.status === 'Completed').length;
    });

    // Calculate real-time deadline proximity of active/pending tasks
    const activeTasks = isLeader
      ? await Task.find({ project: project._id, status: { $ne: "Completed" } })
      : await Task.find({ project: project._id, status: { $nin: ["Completed", "Reviewing"] }, assignee: userId });

    let lessThan2d = 0;
    let between2And5d = 0;
    let oneWeekPlus = 0;

    activeTasks.forEach(t => {
      if (t.deadline) {
        const diffTime = new Date(t.deadline).getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) {
          lessThan2d++;
        } else if (diffDays <= 5) {
          between2And5d++;
        } else {
          oneWeekPlus++;
        }
      }
    });

    const deadlineProximity = {
      lessThan2d,
      between2And5d,
      oneWeekPlus,
      totalActive: activeTasks.length
    };

    res.json({
      projectTitle: project.title,
      totalTasks,
      completedTasks,
      submissions,
      recentTasks: recentTasks.map(t => ({
        id: t._id,
        title: t.title,
        status: (!isLeader && t.status === 'Reviewing') ? 'Completed' : t.status,
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A',
        priority: t.priority
      })),
      teamPerformance,
      pendingAssignments: pendingAssignments.map(a => ({
        id: a._id,
        title: a.title,
        deadline: new Date(a.endDate).toLocaleDateString(),
        from: a.creator?.name || 'System'
      })),
      recentFeedbacks: recentFeedbacks.map(f => ({
        from: f.author?.name || 'Reviewer',
        time: new Date(f.createdAt).toLocaleDateString(),
        msg: f.content
      })),
      teamMembers,
      teamMembersCount,
      deadlineProximity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearSystemLogs = async (req, res) => {
  try {
    await SystemLog.deleteMany({});
    res.json({ message: "System logs cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
